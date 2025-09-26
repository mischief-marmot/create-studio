import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { useLogger } from "#shared/utils/logger";

const logger = useLogger('UploadWidget-CI', true)

export default defineEventHandler(async (event) => {
  // Simple token authentication for CI/CD
  const authHeader = getHeader(event, 'x-ci-token')
  const expectedToken = process.env.CI_UPLOAD_TOKEN || process.env.NUXT_CI_UPLOAD_TOKEN

  // Allow the request if no token is configured (development)
  // or if the provided token matches
  if (expectedToken && authHeader !== expectedToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Add CORS headers for CI/CD requests
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, X-CI-Token')

  // Handle preflight
  if (event.node.req.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }

  try {
    logger.info("Starting widget upload to blob storage (CI/CD)...");

    // Upload IIFE JavaScript file
    const jsPath = resolve(process.cwd(), "dist/embed/create-studio.iife.js");

    if (!existsSync(jsPath)) {
      logger.warn(
        "JS file not found, widget build may still be in progress, jsPath:", jsPath
      );
      return { success: false, message: "Widget files not ready yet", jsPath };
    }
    const jsContent = readFileSync(jsPath, "utf-8");
    logger.debug(jsContent.slice(0, 50) + '...'); // Log first 50 chars for verification

    const uploadResult = await hubBlob().put(
      "create-studio.iife.js",
      jsContent,
      {
        addRandomSuffix: false,
        contentType: "application/javascript",
      }
    );
    logger.success("JS file uploaded to blob: ", Math.floor(uploadResult.size / 1024), "KB");

    // Upload CSS file (optional - might be inlined in JS)
    const cssPath = resolve(process.cwd(), "dist/embed/create-studio.css");
    try {
      const cssContent = readFileSync(cssPath, "utf-8");
      const cssUploadResult = await hubBlob().put("create-studio.css", cssContent, {
        addRandomSuffix: false,
        contentType: "text/css",
      });
      logger.success("CSS file uploaded to blob:", Math.floor(cssUploadResult.size / 1024), "KB");
    } catch (cssError) {
      logger.warn(
        "CSS file not found (might be inlined in JS):",
        (cssError as Error).message
      );
      // This is okay if CSS is inlined in the JavaScript bundle
    }

    return {
      success: true,
      message: "Widget files uploaded to blob storage",
      timestamp: new Date().toISOString(),
      jsSize: uploadResult.size
    };
  } catch (error) {
    logger.box({
      title: "Blob Upload Failed",
      message: () => {
        return `${(error as Error).message}\n${(error as Error).stack}`;
      },
      style: {
        borderColor: "red",
        padding: 1,
      },
    })
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload widget files: ${
        (error as Error).message
      }`,
    });
  }
});