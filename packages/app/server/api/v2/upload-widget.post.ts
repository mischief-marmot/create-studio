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
    const body = await readBody<UploadPayload>(event)

    if (!body || !body.filename || !body.content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing filename or content in request body'
      })
    }

    // Determine content type
    const contentType = body.filename.endsWith('.js') ? 'application/javascript' : 'text/css';

    // Upload file to blob storage with the exact filename
    const uploadResult = await blob.put(
      body.filename,
      body.content,
      {
        addRandomSuffix: false,
        contentType,
        customMetadata: {
          buildTime: body.metadata?.buildTime || new Date().toISOString(),
          chunkType: 'widget-chunk'
        },
        httpMetadata: {
          cacheControl: 'public, max-age=3600'
        }
      }
    );

    return {
      success: true,
      message: `${body.filename} uploaded to blob storage`,
      timestamp: new Date().toISOString(),
      filename: body.filename,
      size: uploadResult.size,
      metadata: body.metadata
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    console.error('Widget upload failed:', (error as Error).message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload widget files: ${(error as Error).message}`,
      data: { error: (error as Error).message },
    });
  }
});
