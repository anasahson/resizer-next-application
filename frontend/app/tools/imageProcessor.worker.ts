interface ProcessSettings {
  resize: boolean;
  width: number;
  height: number;
  resizeMode: 'pixels' | 'percent';
  resizePercent: number;
  doNotEnlarge: boolean;
  maintainRatio: boolean;
  fitMode: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  crop: { x: number; y: number; width: number; height: number } | null;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  filter: 'none' | 'grayscale' | 'sepia' | 'blur' | 'vivid' | 'warm' | 'cool';
  brightness: number;
  contrast: number;
  saturation: number;
  watermark: string;
  watermarkColor: string;
  watermarkOpacity: number;
  watermarkPosition: { x: number; y: number };
  outputFormat: 'webp' | 'avif' | 'jpeg' | 'png';
  filenamePattern: string;
  quality: number;
}

interface ProcessRequest {
  id: string;
  name: string;
  mime: string;
  source: ArrayBuffer;
  settings: ProcessSettings;
}

const scope = self as unknown as Worker;

scope.onmessage = async ({ data }: MessageEvent<ProcessRequest>) => {
  let bitmap: ImageBitmap | null = null;
  const progress = (stage: string) => scope.postMessage({ id: data.id, type: 'PROGRESS', stage });
  try {
    const { id, name, mime, source, settings } = data;
    const startedAt = performance.now();
    progress('Decoding image');
    bitmap = await createImageBitmap(new Blob([source], { type: mime }), { imageOrientation: 'from-image' });

    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    const crop = settings.crop || { x: 0, y: 0, width: 100, height: 100 };
    let cropX = Math.round(sourceWidth * crop.x / 100);
    let cropY = Math.round(sourceHeight * crop.y / 100);
    let cropWidth = Math.max(1, Math.round(sourceWidth * crop.width / 100));
    let cropHeight = Math.max(1, Math.round(sourceHeight * crop.height / 100));
    let outputWidth = settings.resize
      ? settings.resizeMode === 'percent' ? Math.round(cropWidth * settings.resizePercent / 100) : settings.width
      : cropWidth;
    let outputHeight = settings.resize
      ? settings.resizeMode === 'percent' ? Math.round(cropHeight * settings.resizePercent / 100) : settings.height
      : cropHeight;

    if (settings.resize && settings.doNotEnlarge) {
      const scale = Math.min(1, outputWidth / cropWidth, outputHeight / cropHeight);
      outputWidth = Math.max(1, Math.round(cropWidth * scale));
      outputHeight = Math.max(1, Math.round(cropHeight * scale));
    }

    if (settings.resize && settings.maintainRatio && (settings.fitMode === 'contain' || settings.fitMode === 'inside')) {
      const ratio = cropWidth / cropHeight;
      if (outputWidth / outputHeight > ratio) outputWidth = Math.max(1, Math.round(outputHeight * ratio));
      else outputHeight = Math.max(1, Math.round(outputWidth / ratio));
    } else if (settings.resize && settings.fitMode === 'cover') {
      const targetRatio = outputWidth / outputHeight;
      if (cropWidth / cropHeight > targetRatio) {
        const nextWidth = Math.max(1, Math.round(cropHeight * targetRatio));
        cropX += Math.round((cropWidth - nextWidth) / 2);
        cropWidth = nextWidth;
      } else {
        const nextHeight = Math.max(1, Math.round(cropWidth / targetRatio));
        cropY += Math.round((cropHeight - nextHeight) / 2);
        cropHeight = nextHeight;
      }
    }

    if (![outputWidth, outputHeight].every(value => Number.isFinite(value) && value > 0 && value <= 16000)
      || outputWidth * outputHeight > 40000000) {
      throw new Error('Requested output is too large. Reduce the dimensions and try again.');
    }

    progress('Applying crop and transforms');
    const isQuarterTurn = settings.rotation === 90 || settings.rotation === 270;
    const canvas = new OffscreenCanvas(isQuarterTurn ? outputHeight : outputWidth, isQuarterTurn ? outputWidth : outputHeight);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas processing is unavailable in this browser.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const filterMap: Record<ProcessSettings['filter'], string> = {
      none: '',
      grayscale: 'grayscale(1)',
      sepia: 'sepia(1)',
      blur: 'blur(4px)',
      vivid: 'saturate(1.7) contrast(1.12)',
      warm: 'sepia(0.35) saturate(1.25)',
      cool: 'hue-rotate(12deg) saturate(1.15)',
    };
    context.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) ${filterMap[settings.filter]}`.trim();
    if (settings.outputFormat === 'jpeg') {
      context.filter = 'none';
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(settings.rotation * Math.PI / 180);
    context.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);
    const drawWidth = isQuarterTurn ? canvas.height : canvas.width;
    const drawHeight = isQuarterTurn ? canvas.width : canvas.height;
    context.drawImage(bitmap, cropX, cropY, cropWidth, cropHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.filter = 'none';
    progress('Applying color and layers');

    if (settings.watermark) {
      const fontSize = Math.max(20, Math.floor(canvas.width / 15));
      context.font = `bold ${fontSize}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = Math.max(2, fontSize / 10);
      context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillStyle = settings.watermarkColor;
      context.globalAlpha = settings.watermarkOpacity / 100;
      context.strokeText(settings.watermark, canvas.width * settings.watermarkPosition.x, canvas.height * settings.watermarkPosition.y);
      context.fillText(settings.watermark, canvas.width * settings.watermarkPosition.x, canvas.height * settings.watermarkPosition.y);
      context.globalAlpha = 1;
    }

    progress('Encoding output');
    const mimeType = settings.outputFormat === 'jpeg' ? 'image/jpeg' : `image/${settings.outputFormat}`;
    const blob = await canvas.convertToBlob({ type: mimeType, quality: Math.max(0.1, Math.min(1, settings.quality / 100)) });
    if (blob.type !== mimeType) throw new Error(`${settings.outputFormat.toUpperCase()} encoding is not available in this browser. Choose another format.`);
    const output = await blob.arrayBuffer();
    const extension = settings.outputFormat === 'jpeg' ? 'jpg' : settings.outputFormat;
    const baseName = name.replace(/\.[^/.]+$/, '');
    const patternedName = (settings.filenamePattern.trim() || '{name}-{w}x{h}')
      .replaceAll('{name}', baseName)
      .replaceAll('{w}', String(canvas.width))
      .replaceAll('{h}', String(canvas.height));
    const safeName = patternedName.replace(/[\\/:*?"<>|]/g, '-').replace(/\.+$/g, '') || 'image';
    const filename = safeName.toLowerCase().endsWith(`.${extension}`) ? safeName : `${safeName}.${extension}`;
    scope.postMessage({
      type: 'DONE',
      id,
      output,
      mimeType: blob.type,
      width: canvas.width,
      height: canvas.height,
      processingTimeMs: Math.round(performance.now() - startedAt),
      filename,
    }, [output]);
  } catch (error) {
    scope.postMessage({ type: 'ERROR', id: data.id, error: error instanceof Error ? error.message : 'Image processing failed.' });
  } finally {
    bitmap?.close();
  }
};