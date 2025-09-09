import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export default defineEventHandler(async (event) => {
  try {
    console.log("Starting widget upload to blob storage...");

    // Upload IIFE JavaScript file
    const jsPath = resolve(process.cwd(), "dist/embed/create-studio.iife.js");

    if (!existsSync(jsPath)) {
      console.log(
        "⚠️  JS file not found, widget build may still be in progress"
      );
      return { success: false, message: "Widget files not ready yet" };
    }
    const jsContent = readFileSync(jsPath, "utf-8"); // Read as text
    const uploadResult = await hubBlob().put(
      "create-studio.iife.js",
      jsContent,
      {
        addRandomSuffix: false,
        contentType: "application/javascript",
      }
    );
    console.log("✅ JS file uploaded to blob: ", Math.floor(uploadResult.size / 1024), "KB");

    // Upload CSS file (optional - might be inlined in JS)
    const cssPath = resolve(process.cwd(), "dist/embed/create-studio.css");
    try {
      const cssContent = readFileSync(cssPath, "utf-8"); // Read as text
      const cssUploadResult = await hubBlob().put("create-studio.css", cssContent, {
        addRandomSuffix: false,
        contentType: "text/css",
      });
      console.log("✅ CSS file uploaded to blob:", Math.floor(cssUploadResult.size / 1024), "KB");
    } catch (cssError) {
      console.log(
        "⚠️  CSS file not found (might be inlined in JS):",
        (cssError as Error).message
      );
      // This is okay if CSS is inlined in the JavaScript bundle
    }

    return { success: true, message: "Widget files uploaded to blob storage" };
  } catch (error) {
    console.error("❌ Blob upload failed:", error);
    console.error("Error details:", (error as Error).message);
    console.error("Error stack:", (error as Error).stack);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload widget files: ${
        (error as Error).message
      }`,
    });
  }
});
