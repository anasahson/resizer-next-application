const sharp = require('sharp');
const { recordJob } = require('../services/job.service');

/**
 * Extract image metadata (dimensions, format, channels, color space, size)
 */
async function getImageMetadata(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const metadata = await sharp(req.file.buffer).metadata();

    res.json({
      success: true,
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Process a single image (resize, format conversion, compression)
 */
async function processImage(req, res, next) {
  const startTime = Date.now();
  let targetFormat = 'webp';

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const {
      width,
      height,
      fit = 'fit',
      format = 'webp',
      quality = 80,
      aiCrop = false,
      maintainRatio = true,
      rotate,
      flip,
      flop,
      grayscale,
      blur,
      sharpen,
      background,
    } = req.body;

    targetFormat = (format || 'webp').toLowerCase();
    const parsedWidth = width ? parseInt(width, 10) : undefined;
    const parsedHeight = height ? parseInt(height, 10) : undefined;
    const parsedQuality = quality ? Math.min(100, Math.max(1, parseInt(quality, 10))) : 80;

    let pipeline = sharp(req.file.buffer);

    // Rotation & Flips
    if (rotate && !isNaN(parseInt(rotate, 10))) {
      pipeline = pipeline.rotate(parseInt(rotate, 10));
    }
    if (flip === 'true' || flip === true) {
      pipeline = pipeline.flip();
    }
    if (flop === 'true' || flop === true) {
      pipeline = pipeline.flop();
    }

    // Filters
    if (grayscale === 'true' || grayscale === true) {
      pipeline = pipeline.grayscale();
    }
    if (blur && parseFloat(blur) >= 0.3) {
      pipeline = pipeline.blur(Math.min(10, parseFloat(blur)));
    }
    if (sharpen === 'true' || sharpen === true) {
      pipeline = pipeline.sharpen();
    }

    // 1. Determine resize & fit options
    let sharpFit = 'inside';
    let sharpPosition = 'center';

    if (fit === 'fill') {
      sharpFit = 'cover';
      sharpPosition = aiCrop === 'true' || aiCrop === true ? sharp.strategy.entropy : 'center';
    } else if (fit === 'stretch') {
      sharpFit = 'fill';
    } else if (fit === 'fit') {
      sharpFit = maintainRatio === 'false' || maintainRatio === false ? 'fill' : 'inside';
    } else if (fit === 'contain') {
      sharpFit = 'contain';
    }

    if (parsedWidth || parsedHeight) {
      const resizeOpts = {
        width: parsedWidth,
        height: parsedHeight,
        fit: sharpFit,
        position: sharpPosition,
        withoutEnlargement: false,
      };
      if (background) {
        resizeOpts.background = background;
      }
      pipeline = pipeline.resize(resizeOpts);
    }

    // 2. Format conversion & compression
    let contentType = 'image/webp';
    let outputExtension = 'webp';

    switch (targetFormat) {
      case 'avif':
        pipeline = pipeline.avif({ quality: parsedQuality, effort: 4 });
        contentType = 'image/avif';
        outputExtension = 'avif';
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality: parsedQuality, mozjpeg: true });
        contentType = 'image/jpeg';
        outputExtension = 'jpg';
        break;
      case 'png':
        pipeline = pipeline.png({
          compressionLevel: Math.min(9, Math.max(1, Math.round((100 - parsedQuality) / 10))),
        });
        contentType = 'image/png';
        outputExtension = 'png';
        break;
      case 'webp':
      default:
        pipeline = pipeline.webp({ quality: parsedQuality, effort: 4 });
        contentType = 'image/webp';
        outputExtension = 'webp';
        break;
    }

    const outputBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();
    const processingTimeMs = Date.now() - startTime;

    const originalNameBase = req.file.originalname.replace(/\.[^/.]+$/, '');
    const filename = `${originalNameBase}_resized.${outputExtension}`;
    const savingsPercent = Math.round((1 - outputBuffer.length / req.file.size) * 100);

    // Asynchronously log job to MySQL
    recordJob({
      filename,
      originalName: req.file.originalname,
      targetFormat,
      originalSize: req.file.size,
      outputSize: outputBuffer.length,
      savingsPercent,
      width: outputMetadata.width,
      height: outputMetadata.height,
      processingTimeMs,
      status: 'completed',
    }).catch((err) => console.error('Background log error:', err));

    // If client asks for JSON metadata and base64 preview
    if (req.query.responseType === 'json') {
      return res.json({
        success: true,
        filename,
        contentType,
        originalSizeBytes: req.file.size,
        outputSizeBytes: outputBuffer.length,
        savingsPercent,
        width: outputMetadata.width,
        height: outputMetadata.height,
        format: outputMetadata.format,
        processingTimeMs,
        dataBase64: `data:${contentType};base64,${outputBuffer.toString('base64')}`,
      });
    }

    // Default: stream binary image data directly
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': outputBuffer.length,
      'X-Original-Size': req.file.size,
      'X-Processed-Size': outputBuffer.length,
      'X-Processing-Time-Ms': processingTimeMs,
    });

    return res.send(outputBuffer);
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    if (req.file) {
      recordJob({
        filename: req.file.originalname,
        originalName: req.file.originalname,
        targetFormat,
        originalSize: req.file.size,
        outputSize: 0,
        savingsPercent: 0,
        processingTimeMs,
        status: 'failed',
        errorMessage: error.message,
      }).catch((err) => console.error('Background log error:', err));
    }
    next(error);
  }
}

/**
 * Batch process multiple images
 */
async function processBatch(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided for batch processing' });
    }

    const {
      width,
      height,
      fit = 'fit',
      format = 'webp',
      quality = 80,
      rotate,
      flip,
      flop,
      grayscale,
      blur,
      sharpen,
      background,
    } = req.body;

    const parsedWidth = width ? parseInt(width, 10) : undefined;
    const parsedHeight = height ? parseInt(height, 10) : undefined;
    const parsedQuality = quality ? Math.min(100, Math.max(1, parseInt(quality, 10))) : 80;

    const results = await Promise.all(
      req.files.map(async (file) => {
        const itemStartTime = Date.now();
        const targetFormat = (format || 'webp').toLowerCase();

        try {
          let pipeline = sharp(file.buffer);

          // Rotation & Flips
          if (rotate && !isNaN(parseInt(rotate, 10))) {
            pipeline = pipeline.rotate(parseInt(rotate, 10));
          }
          if (flip === 'true' || flip === true) {
            pipeline = pipeline.flip();
          }
          if (flop === 'true' || flop === true) {
            pipeline = pipeline.flop();
          }

          // Filters
          if (grayscale === 'true' || grayscale === true) {
            pipeline = pipeline.grayscale();
          }
          if (blur && parseFloat(blur) >= 0.3) {
            pipeline = pipeline.blur(Math.min(10, parseFloat(blur)));
          }
          if (sharpen === 'true' || sharpen === true) {
            pipeline = pipeline.sharpen();
          }

          if (parsedWidth || parsedHeight) {
            const resizeOpts = {
              width: parsedWidth,
              height: parsedHeight,
              fit: fit === 'fill' ? 'cover' : fit === 'stretch' ? 'fill' : 'inside',
            };
            if (background) {
              resizeOpts.background = background;
            }
            pipeline = pipeline.resize(resizeOpts);
          }

          let contentType = 'image/webp';
          let ext = 'webp';

          if (targetFormat === 'avif') {
            pipeline = pipeline.avif({ quality: parsedQuality });
            contentType = 'image/avif';
            ext = 'avif';
          } else if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            pipeline = pipeline.jpeg({ quality: parsedQuality, mozjpeg: true });
            contentType = 'image/jpeg';
            ext = 'jpg';
          } else if (targetFormat === 'png') {
            pipeline = pipeline.png({ compressionLevel: 7 });
            contentType = 'image/png';
            ext = 'png';
          } else {
            pipeline = pipeline.webp({ quality: parsedQuality });
          }

          const outputBuffer = await pipeline.toBuffer();
          const meta = await sharp(outputBuffer).metadata();
          const originalBase = file.originalname.replace(/\.[^/.]+$/, '');
          const filename = `${originalBase}_resized.${ext}`;
          const savingsPercent = Math.round((1 - outputBuffer.length / file.size) * 100);
          const processingTimeMs = Date.now() - itemStartTime;

          // Asynchronously log job to MySQL
          recordJob({
            filename,
            originalName: file.originalname,
            targetFormat,
            originalSize: file.size,
            outputSize: outputBuffer.length,
            savingsPercent,
            width: meta.width,
            height: meta.height,
            processingTimeMs,
            status: 'completed',
          }).catch((err) => console.error('Background log error:', err));

          return {
            filename,
            originalName: file.originalname,
            originalSizeBytes: file.size,
            outputSizeBytes: outputBuffer.length,
            savingsPercent,
            width: meta.width,
            height: meta.height,
            format: meta.format,
            processingTimeMs,
            dataBase64: `data:${contentType};base64,${outputBuffer.toString('base64')}`,
          };
        } catch (err) {
          const processingTimeMs = Date.now() - itemStartTime;
          recordJob({
            filename: file.originalname,
            originalName: file.originalname,
            targetFormat,
            originalSize: file.size,
            outputSize: 0,
            savingsPercent: 0,
            processingTimeMs,
            status: 'failed',
            errorMessage: err.message,
          }).catch((e) => console.error('Background log error:', e));

          return {
            originalName: file.originalname,
            error: err.message,
          };
        }
      })
    );

    res.json({
      success: true,
      processedCount: results.filter((r) => !r.error).length,
      totalCount: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getImageMetadata,
  processImage,
  processBatch,
};
