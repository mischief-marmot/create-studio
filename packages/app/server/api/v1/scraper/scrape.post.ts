/**
 * POST /api/v1/scraper/scrape
 * Scrape website content using Mozilla Readability
 *
 * Maintains compatibility with original Express API
 */

import { useLogger } from '@create-studio/shared/utils/logger'
import axios from "axios";
import * as cheerio from "cheerio";
import { verifyJWT } from "~~/server/utils/auth";
import { sendErrorResponse } from "~~/server/utils/errors";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const logger = useLogger("CS:Scraper", config.debug);
  logger.info("Scrape request received");
  try {
    // Verify JWT token
    await verifyJWT(event);

    const body = await readBody(event);

    // Validate URL
    if (!body.url) {
      setResponseStatus(event, 400);
      return {
        error: {
          message: "Something is wrong",
        },
      };
    }

    const url = body.url;

    // Configure axios with proper headers
    const axiosConfig: any = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36",
      },
    };

    // Fetch HTML content
    const parsedUrl = new URL(url);
    const response = await axios.get(url, axiosConfig);
    let html = response.data;

    // Fix relative URLs that start with //
    const regEx = new RegExp(`"\\/\\/${parsedUrl.hostname}`, "g");
    html = html.replace(regEx, `"${parsedUrl.protocol}//${parsedUrl.hostname}`);

    // Parse with Cheerio for better compatibility
    const $ = cheerio.load(html);

    // Extract main content by targeting common content selectors
    const contentSelectors = [
      "article",
      ".post-content",
      ".entry-content",
      ".content",
      "main",
      '[role="main"]',
    ];

    let content = "";
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > content.length) {
        // Remove scripts, styles, and navigation elements
        element
          .find("script, style, nav, .navigation, .nav, .sidebar")
          .remove();
        content = element.text().trim();
      }
    }

    // Fallback to body content if no main content found
    if (!content) {
      const bodyContent = $("body").clone();
      bodyContent
        .find("script, style, nav, .navigation, .nav, .sidebar, header, footer")
        .remove();
      content = bodyContent.text().replace(/\s+/g, " ").trim();
    }

    // Extract title from common tags
    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      extractTitle(content) ||
      null;

    // Extract author from common meta tags
    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      $(".author").first().text().trim() ||
      null;

    // Extract description/excerpt
    const excerpt =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      null;

    // Format response to match original Mercury parser format
    const scrapeResult = {
      title,
      content: content || extractContent(html),
      author,
      date_published: null,
      lead_image_url: extractImage(html),
      dek: excerpt,
      url: url,
      domain: parsedUrl.hostname,
      excerpt,
      word_count: content ? content.split(/\s+/).length : null,
      direction: "ltr",
      total_pages: 1,
      rendered_pages: 1,
    };

    // Return in original format
    setResponseStatus(event, 200);
    return {
      data: scrapeResult,
    };
  } catch (error) {
    console.error("Scraping error:", error);

    let errorMessage = error;

    // Handle specific service unavailable errors (firewall/bot-blocker)
    if (
      (error as any)?.message?.includes("503") ||
      (error as any)?.response?.status === 503
    ) {
      errorMessage = `Our server was unable to fetch [${
        (error as any).config?.url || "the URL"
      }] because of a firewall/bot-blocker on that site. Please contact support for help.`;
    }

    return sendErrorResponse(event, errorMessage);
  }
});

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract main content from HTML (simplified)
 */
function extractContent(html: string): string | null {
  // Very basic content extraction - in production use a proper parser
  const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
  if (bodyMatch) {
    // Remove scripts and styles
    let content = bodyMatch[1];
    content = content.replace(/<script[^>]*>.*?<\/script>/gis, "");
    content = content.replace(/<style[^>]*>.*?<\/style>/gis, "");
    content = content.replace(/<[^>]+>/g, " "); // Remove all HTML tags
    content = content.replace(/\s+/g, " ").trim(); // Clean up whitespace
    return content.length > 0 ? content : null;
  }
  return null;
}

/**
 * Extract lead image from HTML
 */
function extractImage(html: string): string | null {
  // Try meta property og:image first
  const ogImageMatch = html.match(
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i
  );
  if (ogImageMatch) return ogImageMatch[1];

  // Try meta name twitter:image
  const twitterImageMatch = html.match(
    /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i
  );
  if (twitterImageMatch) return twitterImageMatch[1];

  // Try first img tag
  const imgMatch = html.match(/<img[^>]*src="([^"]+)"/i);
  if (imgMatch) return imgMatch[1];

  return null;
}
