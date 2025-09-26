import { useLogger } from "#shared/utils/logger";

const logger = useLogger('UploadWidget', true)

interface UploadPayload {
  js: string;
  css?: string | null;
  metadata?: {
    buildTime?: string;
    version?: string;
    jsSize?: number;
    cssSize?: number;
  };
}

export default defineEventHandler(async (event) => {
  try {
    logger.info("Starting widget upload to blob storage...");

    // Get the file contents from the request body
    const body = await readBody<UploadPayload>(event)

    if (!body || !body.js) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing JavaScript content in request body'
      })
    }

    logger.debug(`Received JS content: ${body.js.slice(0, 50)}...`); // Log first 50 chars for verification

    // Upload JavaScript file as main.js
    const uploadResult = await hubBlob().put(
      "main.js",
      body.js,
      {
        addRandomSuffix: false,
        contentType: "application/javascript",
        customMetadata: {
          buildTime: body.metadata?.buildTime || new Date().toISOString(),
          version: body.metadata?.version || '1.0.0'
        }
      }
    );
    logger.success("JS file uploaded to blob as main.js: ", Math.floor(uploadResult.size / 1024), "KB");

    // Upload CSS file if provided
    let cssUploadResult = null;
    if (body.css) {
      cssUploadResult = await hubBlob().put("main.css", body.css, {
        addRandomSuffix: false,
        contentType: "text/css",
        customMetadata: {
          buildTime: body.metadata?.buildTime || new Date().toISOString(),
          version: body.metadata?.version || '1.0.0'
        }
      });
      logger.success("CSS file uploaded to blob as main.css:", Math.floor(cssUploadResult.size / 1024), "KB");
    } else {
      logger.info("No CSS content provided (likely inlined in JS)");
    }

    return {
      success: true,
      message: "Widget files uploaded to blob storage",
      timestamp: new Date().toISOString(),
      jsSize: uploadResult.size,
      cssSize: cssUploadResult?.size || 0,
      metadata: body.metadata
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
