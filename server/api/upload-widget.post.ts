import { useLogger } from "#shared/utils/logger";

const logger = useLogger('UploadWidget', true)

interface UploadPayload {
  filename: string;
  content: string;
  metadata?: {
    buildTime?: string;
    size?: number;
  };
}

export default defineEventHandler(async (event) => {
  try {
    logger.info("Starting widget upload to blob storage...");

    // Get the file contents from the request body
    const body = await readBody<UploadPayload>(event)

    if (!body || !body.filename || !body.content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing filename or content in request body'
      })
    }

    logger.debug(`Uploading: ${body.filename} (${body.content.length} chars)`);

    // Determine content type
    const contentType = body.filename.endsWith('.js') ? 'application/javascript' : 'text/css';

    // Upload file to blob storage with the exact filename
    const uploadResult = await hubBlob().put(
      body.filename,
      body.content,
      {
        addRandomSuffix: false,
        contentType,
        customMetadata: {
          buildTime: body.metadata?.buildTime || new Date().toISOString(),
          chunkType: 'widget-chunk'
        },
        // Set cache control for browsers
        httpMetadata: {
          cacheControl: 'public, max-age=3600' // Cache for 1 hour in browsers
        }
      }
    );

    logger.success(`Uploaded: ${body.filename} (${Math.floor(uploadResult.size / 1024)}KB)`);

    return {
      success: true,
      message: `${body.filename} uploaded to blob storage`,
      timestamp: new Date().toISOString(),
      filename: body.filename,
      size: uploadResult.size,
      metadata: body.metadata
    };
  } catch (error) {
    // Check if this is already an HTTP error from createError()
    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw existing HTTP errors as-is
      throw error;
    }

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
