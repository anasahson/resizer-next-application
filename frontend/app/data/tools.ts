export type ToolCategoryId =
  | 'optimize'
  | 'resize'
  | 'edit'
  | 'convert'
  | 'pdf'
  | 'ai';

export type ToolEngine = 'Client-Side' | 'Express API' | 'Hybrid';

export interface ToolCategory {
  id: ToolCategoryId;
  label: string;
  filterLabel: string;
  color: string;
  icon: string;
}

export interface ToolItem {
  title: string;
  description: string;
  slug: string;
  href: string;
  category: ToolCategoryId;
  icon: string;
  badge?: 'New';
  engine: ToolEngine;
  engineDetail: string;
  studioHref?: string;
  keywords: string[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: 'optimize', label: 'Optimize & Compress', filterLabel: 'Optimize', color: '#84CC16', icon: 'Gauge' },
  { id: 'resize', label: 'Resize & Dimensions', filterLabel: 'Resize', color: '#F97316', icon: 'ScanLine' },
  { id: 'edit', label: 'Crop, Edit & Enhance', filterLabel: 'Edit', color: '#A855F7', icon: 'SlidersHorizontal' },
  { id: 'convert', label: 'Format Converters', filterLabel: 'Convert', color: '#EAB308', icon: 'RefreshCw' },
  { id: 'pdf', label: 'PDF & Document Bridge', filterLabel: 'PDF Bridge', color: '#EF4444', icon: 'FileStack' },
  { id: 'ai', label: 'AI Studio & Automation', filterLabel: 'AI Studio', color: '#7C3AED', icon: 'Sparkles' },
];

export const TOOL_ITEMS: ToolItem[] = [
  {
    title: 'Compress Image',
    description: 'Reduce JPG, PNG, and WebP file sizes by up to 80% while keeping crisp visual clarity.',
    slug: 'compress-image',
    href: '/compress-image',
    category: 'optimize',
    icon: 'Gauge',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=compress',
    keywords: ['compress image', 'image compressor', 'reduce image size'],
  },
  {
    title: 'Compress to Target KB',
    description: 'Shrink images under exact size limits like 50KB, 100KB, or 200KB for visa, job, and university portals.',
    slug: 'compress-to-target-kb',
    href: '/compress-to-target-kb',
    category: 'optimize',
    icon: 'Target',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=compress',
    keywords: ['compress image to 50kb', 'compress image to 200kb', 'target kb compressor'],
  },
  {
    title: 'Bulk Image Compressor',
    description: 'Optimize dozens of heavy photos at once in your browser with zero upload wait times.',
    slug: 'bulk-compress-images',
    href: '/bulk-compress-images',
    category: 'optimize',
    icon: 'Layers',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=batch',
    keywords: ['bulk image compressor', 'batch compress images'],
  },
  {
    title: 'Website Image Analyzer',
    description: 'Audit image weight, dimensions, and next-gen format savings before uploading to your site.',
    slug: 'website-image-analyzer',
    href: '/website-image-analyzer',
    category: 'optimize',
    icon: 'ChartNoAxesCombined',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/analyzer',
    keywords: ['website image analyzer', 'image audit', 'image seo'],
  },
  {
    title: 'Resize Image',
    description: 'Change image dimensions by exact pixels or percentage without stretching or losing sharpness.',
    slug: 'resize-image',
    href: '/resize-image',
    category: 'resize',
    icon: 'Maximize2',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=resize',
    keywords: ['resize image', 'change image pixels', 'image resizer'],
  },
  {
    title: 'Social Media Resizer',
    description: 'One-click presets for Instagram posts, YouTube thumbnails, LinkedIn banners, and WhatsApp DPs.',
    slug: 'social-media-resizer',
    href: '/social-media-resizer',
    category: 'resize',
    icon: 'Smartphone',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/presets',
    keywords: ['social media image resizer', 'instagram post resizer', 'youtube thumbnail resizer'],
  },
  {
    title: 'Passport & ID Photo Maker',
    description: 'Create exact 2×2 inch or 35×45mm biometric photos ready for official applications.',
    slug: 'passport-photo-maker',
    href: '/passport-photo-maker',
    category: 'resize',
    icon: 'BadgeCheck',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/presets',
    keywords: ['passport photo maker', 'id photo', '35x45mm photo'],
  },
  {
    title: 'Bulk Image Resizer',
    description: 'Resize an entire batch of product photos or wallpapers to uniform dimensions in seconds.',
    slug: 'bulk-resize-images',
    href: '/bulk-resize-images',
    category: 'resize',
    icon: 'GalleryHorizontalEnd',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=batch',
    keywords: ['bulk image resizer', 'batch resize images'],
  },
  {
    title: 'Crop Image',
    description: 'Trim margins or lock aspect ratios like 1:1, 16:9, and 4:5 with precision guides.',
    slug: 'crop-image',
    href: '/crop-image',
    category: 'edit',
    icon: 'Crop',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/#resizer-studio',
    keywords: ['crop image', 'image cropper', 'aspect ratio crop'],
  },
  {
    title: 'Rotate & Flip Image',
    description: 'Fix sideways photos or mirror images horizontally and vertically in a single click.',
    slug: 'rotate-flip-image',
    href: '/rotate-flip-image',
    category: 'edit',
    icon: 'RotateCw',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/#resizer-studio',
    keywords: ['rotate image', 'flip image', 'mirror photo'],
  },
  {
    title: 'Add Watermark',
    description: 'Stamp custom text or logo watermarks across your photos with adjustable opacity and position.',
    slug: 'watermark-image',
    href: '/watermark-image',
    category: 'edit',
    icon: 'Stamp',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=convert',
    keywords: ['add watermark', 'watermark image', 'photo watermark'],
  },
  {
    title: 'Metadata & EXIF Remover',
    description: 'Strip hidden GPS location, camera details, and timestamps from photos before sharing online.',
    slug: 'remove-exif-metadata',
    href: '/remove-exif-metadata',
    category: 'edit',
    icon: 'ShieldCheck',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=compress',
    keywords: ['remove exif', 'strip image metadata', 'remove gps data'],
  },
  {
    title: 'Convert to WebP / AVIF',
    description: 'Turn heavy JPG and PNG files into ultra-fast modern web formats for better Core Web Vitals.',
    slug: 'convert-to-webp',
    href: '/convert-to-webp',
    category: 'convert',
    icon: 'FileType',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=convert',
    keywords: ['convert to webp', 'convert to avif', 'jpg to webp'],
  },
  {
    title: 'WebP / AVIF to JPG',
    description: 'Convert modern web images back into universally compatible JPG or transparent PNG files.',
    slug: 'webp-to-jpg',
    href: '/webp-to-jpg',
    category: 'convert',
    icon: 'ArrowLeftRight',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=convert',
    keywords: ['webp to jpg', 'avif to jpg', 'webp converter'],
  },
  {
    title: 'HEIC to JPG',
    description: 'Convert Apple iPhone HEIC photos into standard JPGs directly in your browser.',
    slug: 'heic-to-jpg',
    href: '/heic-to-jpg',
    category: 'convert',
    icon: 'Smartphone',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=convert',
    keywords: ['heic to jpg', 'iphone photo converter'],
  },
  {
    title: 'PNG to JPG',
    description: 'Convert PNG graphics to lightweight JPGs with automatic background color fill.',
    slug: 'png-to-jpg',
    href: '/png-to-jpg',
    category: 'convert',
    icon: 'Image',
    engine: 'Client-Side',
    engineDetail: 'Client-Side',
    studioHref: '/tools?tool=convert',
    keywords: ['png to jpg', 'convert png to jpeg'],
  },
  {
    title: 'PDF to JPG / PNG',
    description: 'Extract every PDF page into high-resolution JPG or transparent PNG images in seconds.',
    slug: 'pdf-to-jpg',
    href: '/pdf-to-jpg',
    category: 'pdf',
    icon: 'FileImage',
    engine: 'Client-Side',
    engineDetail: 'Client-Side via pdfjs-dist',
    studioHref: '/tools?tool=pdf',
    keywords: ['pdf to jpg', 'pdf to png', 'pdf page converter'],
  },
  {
    title: 'JPG to PDF',
    description: 'Combine one or multiple JPG and PNG images into a clean, print-ready PDF document.',
    slug: 'jpg-to-pdf',
    href: '/jpg-to-pdf',
    category: 'pdf',
    icon: 'FilePlus2',
    engine: 'Client-Side',
    engineDetail: 'Client-Side via pdf-lib',
    studioHref: '/tools?tool=image-pdf',
    keywords: ['jpg to pdf', 'image to pdf', 'png to pdf'],
  },
  {
    title: 'AI Background Remover',
    description: 'Automatically detect subjects and erase backgrounds cleanly for ecommerce products and portraits.',
    slug: 'ai-background-remover',
    href: '/ai-background-remover',
    category: 'ai',
    icon: 'Scissors',
    badge: 'New',
    engine: 'Hybrid',
    engineDetail: 'Client-Side ONNX / Express API',
    studioHref: '/remove-background',
    keywords: ['ai background remover', 'remove image background'],
  },
  {
    title: 'AI Image Upscaler',
    description: 'Enlarge low-resolution photos 2× or 4× while reconstructing sharp edges and textures.',
    slug: 'ai-image-upscaler',
    href: '/ai-image-upscaler',
    category: 'ai',
    icon: 'WandSparkles',
    badge: 'New',
    engine: 'Express API',
    engineDetail: 'Express API',
    studioHref: '/tools',
    keywords: ['ai image upscaler', 'upscale image', 'enhance image'],
  },
  {
    title: 'AI Smart Crop',
    description: 'Automatically keep faces and main products centered when converting between landscape and portrait ratios.',
    slug: 'ai-smart-crop',
    href: '/ai-smart-crop',
    category: 'ai',
    icon: 'Focus',
    badge: 'New',
    engine: 'Hybrid',
    engineDetail: 'Client-Side / Express API',
    studioHref: '/tools?tool=resize',
    keywords: ['ai smart crop', 'face crop', 'object-aware crop'],
  },
];

export const WORKFLOW_CARD = {
  title: 'Create a Workflow',
  description: 'Chain multiple tools together (e.g., PDF to JPG → Resize 1080×1080 → Compress to WebP) and run them in one click.',
  href: '/workflows',
  icon: 'Workflow',
};
