export type ImageOutputFormat = 'webp' | 'avif' | 'jpeg' | 'png';

const FORMAT_BY_MIME = new Map<string, ImageOutputFormat>([
  ['image/jpeg', 'jpeg'],
  ['image/jpg', 'jpeg'],
  ['image/pjpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/x-png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
]);

const FORMAT_BY_EXTENSION = new Map<string, ImageOutputFormat>([
  ['jpg', 'jpeg'],
  ['jpeg', 'jpeg'],
  ['png', 'png'],
  ['webp', 'webp'],
  ['avif', 'avif'],
]);

export function getImageOutputFormat(file: Pick<File, 'type' | 'name'>): ImageOutputFormat {
  const mimeType = file.type.toLowerCase().split(';', 1)[0].trim();
  const mimeFormat = FORMAT_BY_MIME.get(mimeType);
  if (mimeFormat) return mimeFormat;

  const extension = file.name.toLowerCase().match(/\.([^.]+)$/)?.[1];
  return (extension && FORMAT_BY_EXTENSION.get(extension)) || 'webp';
}
