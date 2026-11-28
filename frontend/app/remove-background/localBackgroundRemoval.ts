import { pipeline, RawImage } from '@huggingface/transformers';

const MODEL_ID = 'xrds/isnet-general-onnx-int8';
const MAX_PROCESSING_EDGE = 2048;

export type ModelProgress = {
  status?: string;
  progress?: number;
};

type ProgressListener = (progress: ModelProgress) => void;

async function prepareImageForProcessing(file: File): Promise<RawImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, MAX_PROCESSING_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare this image in your browser.');
    context.drawImage(bitmap, 0, 0, width, height);
    return RawImage.fromCanvas(canvas);
  } finally {
    bitmap.close();
  }
}

async function createRemovalPipeline(onProgress: ProgressListener) {
  const device: 'webgpu' | 'wasm' = 'gpu' in navigator ? 'webgpu' : 'wasm';
  const progressCallback = (progress: ModelProgress) => onProgress(progress);

  try {
    return await pipeline('background-removal', MODEL_ID, {
      device,
      dtype: 'q8',
      progress_callback: progressCallback,
    });
  } catch (error) {
    if (device !== 'webgpu') throw error;
    onProgress({ status: 'fallback' });
    return pipeline('background-removal', MODEL_ID, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: progressCallback,
    });
  }
}

let removalPipeline: ReturnType<typeof createRemovalPipeline> | null = null;
let activeProgressListener: ProgressListener = () => {};

export async function removeImageBackground(file: File, onProgress: ProgressListener): Promise<Blob> {
  activeProgressListener = onProgress;
  if (!removalPipeline) {
    removalPipeline = createRemovalPipeline((progress) => activeProgressListener(progress)).catch((error) => {
      removalPipeline = null;
      throw error;
    });
  }

  try {
    const removeBackground = await removalPipeline;
    const result = await removeBackground(await prepareImageForProcessing(file));
    return result.toBlob('image/png');
  } catch (error) {
    removalPipeline = null;
    throw error;
  }
}
