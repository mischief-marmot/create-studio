import { describe, test, expect, beforeAll } from "vitest";
import { createPage, setup, url, $fetch } from "@nuxt/test-utils/e2e";

describe("Home Page", async () => {
  await setup({
    host: "http://localhost:3000",
  });

  test("has title", async () => {
    const page = await createPage("/");

    // Get page title using Playwright's page.title() method
    const pageTitle = await page.title();
    expect(pageTitle).toBe("Halogen - Schema Cards");
  });

  test("displays heading", async () => {
    const page = await createPage("/");

    // Get text content from the heading
    const heading = page.locator("h1");
    const headingText = await heading.textContent();
    expect(headingText?.trim()).toBe(
      "Create Beautiful Recipe Cards with Structured Data"
    );
  });

  test("responsive design works", async () => {
    const page = await createPage("/");

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    const hero = page.locator(".hero");
    const isVisibleDesktop = await hero.isVisible();
    expect(isVisibleDesktop).toBe(true);

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    const isVisibleMobile = await hero.isVisible();
    expect(isVisibleMobile).toBe(true);

    const heroClass = await hero.getAttribute("class");
    expect(heroClass).toMatch(/min-h-\[80vh\]/);
  });

  test("page has proper meta tags", async () => {
    const page = await createPage(url("/"));

    const description = page.locator('meta[name="description"]');
    const content = await description.getAttribute("content");
    expect(content).toBe(
      "Create structured data cards for recipes, how-to guides, and FAQs with automatic JSON-LD generation"
    );
  });
});
