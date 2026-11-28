/**
 * Programmatic presets: every entry is both a ranking page (/presets/<slug>)
 * and a pre-configured state for the studio (/tools?preset=<slug>).
 *
 * The page copy targets one concrete search intent; the specs drive the tool so
 * a visitor landing from search never has to configure anything.
 */

export type PresetTool = 'resize' | 'compress' | 'convert' | 'batch' | 'pdf';
export type PresetFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export interface Preset {
  slug: string;
  /** Short product name used in cards and links. */
  name: string;
  tool: PresetTool;
  /** <title> — keep near 60 characters; the layout appends the brand. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  specLabel: string;
  format: PresetFormat;
  quality: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain';
  /** Soft size target in kilobytes, used by compression presets. */
  maxKB?: number;
  bullets: string[];
  faqs: { q: string; a: string }[];
  related: string[];
}

export const PRESETS: Preset[] = [
  {
    slug: 'instagram-post',
    name: 'Instagram post',
    tool: 'resize',
    title: 'Resize Image for Instagram — 1080×1080 Post',
    description:
      'Resize any photo to Instagram’s 1080 × 1080 feed size. Square crop without stretching, exported as a sharp JPEG or WebP.',
    h1: 'Resize an image for Instagram (1080 × 1080)',
    intro:
      'Instagram displays feed posts as a square, so anything else gets cropped for you — often through the subject’s face. This preset sets the exact 1080 × 1080 pixel canvas, centres the crop, and exports a file Instagram will not re-compress into mush.',
    specLabel: '1080 × 1080 px · 1:1 · JPEG',
    format: 'jpeg',
    quality: 92,
    width: 1080,
    height: 1080,
    fit: 'cover',
    bullets: [
      'Exact 1080 × 1080 px canvas — the size Instagram renders without rescaling',
      'Centre-weighted crop fills the square instead of letterboxing it',
      'Quality 92 keeps text overlays and edges crisp after Instagram’s own re-compression',
      'The app does not permanently store the source image',
    ],
    faqs: [
      {
        q: 'What size should an Instagram post be?',
        a: 'Instagram feed posts render best at 1080 × 1080 pixels (1:1). Portrait posts work at 1080 × 1350 (4:5) and stories or reels at 1080 × 1920 (9:16).',
      },
      {
        q: 'Will resizing crop my photo?',
        a: 'This preset uses a cover fit: the image is scaled until it fills the square, then centred and cropped. That avoids the stretched look you get from forcing a non-square image into a square.',
      },
      {
        q: 'Does resizing lower the quality?',
        a: 'Downscaling to 1080 px is lossless in practice for photos. Exporting at quality 92 leaves enough headroom for Instagram’s own compression without visible artefacts.',
      },
    ],
    related: ['instagram-story', 'shopify-product', 'compress-under-200kb'],
  },
  {
    slug: 'instagram-story',
    name: 'Instagram story',
    tool: 'resize',
    title: 'Resize Image for Instagram Story — 1080×1920',
    description:
      'Turn any photo into a full-screen 1080 × 1920 Instagram story or reel cover. Vertical 9:16 crop, sharp export, no upload.',
    h1: 'Resize an image for an Instagram story (1080 × 1920)',
    intro:
      'Stories and reels are 9:16 and full-screen, so landscape photos leave dead bars and get zoomed by the viewer. This preset outputs exactly 1080 × 1920 with a centre crop that keeps the subject in frame.',
    specLabel: '1080 × 1920 px · 9:16 · JPEG',
    format: 'jpeg',
    quality: 92,
    width: 1080,
    height: 1920,
    fit: 'cover',
    bullets: [
      'Full-screen 1080 × 1920 canvas for stories, reels covers and shorts',
      'Vertical crop keeps the frame filled edge to edge',
      'Safe for text overlays at quality 92',
      'Batch the whole campaign when you need more than one story',
    ],
    faqs: [
      {
        q: 'What resolution is an Instagram story?',
        a: 'Stories and reels display at 1080 × 1920 pixels (9:16). Uploading that exact size avoids the extra scaling Instagram applies to other dimensions.',
      },
      {
        q: 'Can I convert a landscape photo to a story?',
        a: 'Yes. The preset covers the vertical frame and crops the sides. If the subject sits off-centre, crop first in the studio so the important part stays inside the 9:16 area.',
      },
    ],
    related: ['instagram-post', 'youtube-thumbnail', 'whatsapp-sticker'],
  },
  {
    slug: 'youtube-thumbnail',
    name: 'YouTube thumbnail',
    tool: 'resize',
    title: 'Resize Image for YouTube Thumbnail — 1280×720',
    description:
      'Create a YouTube thumbnail at the required 1280 × 720 pixels (16:9). Sharp text, correct aspect ratio, exported locally.',
    h1: 'Resize an image for a YouTube thumbnail (1280 × 720)',
    intro:
      'YouTube rejects thumbnails under 1280 × 720, and it renders the 16:9 crop everywhere from search results to the watch page. This preset produces the exact file, with enough quality left for bold text at small sizes.',
    specLabel: '1280 × 720 px · 16:9 · JPEG',
    format: 'jpeg',
    quality: 90,
    width: 1280,
    height: 720,
    fit: 'cover',
    bullets: [
      'Meets YouTube’s 1280 × 720 minimum for custom thumbnails',
      '16:9 crop matched to how YouTube displays results',
      'Quality 90 keeps overlay text legible in the mobile feed',
      'Export several variants in one batch for A/B testing',
    ],
    faqs: [
      {
        q: 'What size is a YouTube thumbnail?',
        a: '1280 × 720 pixels, 16:9, under 2 MB. YouTube accepts larger images, but it downscales anything above 1280 px wide.',
      },
      {
        q: 'Why does my thumbnail look blurry?',
        a: 'Usually it was uploaded below 1280 px wide or heavily compressed. Start from a source at least 1280 px wide and export at quality 90 or higher.',
      },
    ],
    related: ['instagram-post', 'shopify-product', 'compress-under-200kb'],
  },
  {
    slug: 'compress-under-200kb',
    name: 'Compress under 200 KB',
    tool: 'compress',
    title: 'Compress Image Under 200 KB — Job & University Portals',
    description:
      'Reduce a photo below 200 KB for PPSC, FPSC, university and visa upload forms. Keeps the dimensions and drops the file weight.',
    h1: 'Compress an image under 200 KB',
    intro:
      'Most Pakistani job and university portals cap uploads at 100–200 KB and reject anything larger without explaining why. This preset keeps your photo at its current dimensions and lowers the encoder quality until the file fits, so the form accepts it on the first attempt.',
    specLabel: 'Target ≤ 200 KB · keep dimensions · JPEG',
    format: 'jpeg',
    quality: 72,
    maxKB: 200,
    bullets: [
      'Built for PPSC, FPSC, NTS, HEC and university portal limits',
      'Keeps the original pixel dimensions — only the file weight drops',
      'Shows the before/after size so you can confirm it is under the cap',
      'Nothing is uploaded to a server, so documents stay private',
    ],
    faqs: [
      {
        q: 'How do I reduce a photo to under 200 KB?',
        a: 'Open this preset, drop the photo, and the studio applies a JPEG quality target that lands under 200 KB. If your file is still too large, lower the quality slider a step or export at a smaller dimension.',
      },
      {
        q: 'Will the photo still be accepted as a passport-style upload?',
        a: 'Yes — the preset preserves the pixel dimensions the portal asks for, so only the compression changes. Check the portal’s stated dimension requirement before uploading.',
      },
      {
        q: 'Is this safe for ID and application documents?',
        a: 'The image is sent to the configured processing service and is not permanently stored by this app. Avoid uploading sensitive documents unless you are comfortable with the configured provider’s data handling.',
      },
    ],
    related: ['compress-under-50kb', 'passport-photo', 'whatsapp-sticker'],
  },
  {
    slug: 'compress-under-50kb',
    name: 'Compress under 50 KB',
    tool: 'compress',
    title: 'Compress Image Under 50 KB — Photo & Form Uploads',
    description:
      'Shrink a JPG below 50 KB for strict upload forms, signatures and profile photos. Preview the result and check the exact file size.',
    h1: 'Compress an image under 50 KB',
    intro:
      'Fifty kilobytes is the tightest limit common on government forms, signature fields and older applicant portals. At that size the encoder matters more than the slider, so this preset starts from a JPEG profile tuned for small files and shows the resulting weight instantly.',
    specLabel: 'Target ≤ 50 KB · JPEG · quality tuned',
    format: 'jpeg',
    quality: 55,
    maxKB: 50,
    bullets: [
      'For forms with a hard 50 KB ceiling',
      'JPEG profile tuned for small files rather than raw quality',
      'Live byte size so you know it fits before you submit',
      'Drop the dimensions further if the portal also caps resolution',
    ],
    faqs: [
      {
        q: 'How do I compress an image to 50 KB?',
        a: 'Open the preset, drop the image, and compare the output size shown on the result card. If it is still above 50 KB, reduce the width and height slightly — file size falls roughly with the square of the dimension change.',
      },
      {
        q: 'Will it look bad at 50 KB?',
        a: 'For a passport-style portrait at 300–600 px it is fine. For a large landscape photo the visible softness is unavoidable at that weight, so downscale first if the form allows it.',
      },
    ],
    related: ['compress-under-200kb', 'passport-photo', 'whatsapp-sticker'],
  },
  {
    slug: 'passport-photo',
    name: 'Passport photo',
    tool: 'resize',
    title: 'Passport Photo Size — 35×45 mm (413×531 px)',
    description:
      'Create a 35 × 45 mm passport or visa photo at 300 DPI: 413 × 531 pixels, correct aspect ratio, ready for online applications.',
    h1: 'Make a 35 × 45 mm passport photo',
    intro:
      'The standard passport and visa photo is 35 × 45 mm. At 300 DPI that is 413 × 531 pixels, and most online application forms expect exactly those proportions. This preset crops to that frame so the head sits naturally inside it.',
    specLabel: '35 × 45 mm · 413 × 531 px @ 300 DPI',
    format: 'jpeg',
    quality: 95,
    width: 413,
    height: 531,
    fit: 'cover',
    bullets: [
      'Exact 413 × 531 px output for 35 × 45 mm at 300 DPI',
      'Portrait aspect ratio, no distortion',
      'Quality 95 for clean facial detail in print and on-screen review',
      'The app does not permanently store the source image',
    ],
    faqs: [
      {
        q: 'What is 35 × 45 mm in pixels?',
        a: 'At 300 DPI, 35 × 45 mm is 413 × 531 pixels. Some portals accept 600 × 800 or 400 × 600; check the specific form, then resize to that exact number.',
      },
      {
        q: 'Can I use this for a visa application?',
        a: 'The dimensions suit 35 × 45 mm photo requirements, which cover many visa and ID forms. Requirements such as background colour, head height and recency still apply — this tool only handles size.',
      },
    ],
    related: ['compress-under-200kb', 'compress-under-50kb', 'shopify-product'],
  },
  {
    slug: 'shopify-product',
    name: 'Shopify product image',
    tool: 'resize',
    title: 'Shopify Product Image Size — 2048×2048 Square',
    description:
      'Square 2048 × 2048 product photos for Shopify collections and zoom. Consistent framing across a catalog, exported as WebP or JPEG.',
    h1: 'Resize product photos for Shopify (2048 × 2048)',
    intro:
      'Shopify recommends square product images of at least 2048 × 2048 so hover zoom stays sharp and every collection tile lines up. This preset centres the product on a square canvas so a mixed catalog stops looking ragged.',
    specLabel: '2048 × 2048 px · 1:1 · WebP or JPEG',
    format: 'webp',
    quality: 88,
    width: 2048,
    height: 2048,
    fit: 'cover',
    bullets: [
      '2048 px square, the size Shopify suggests for zoomable product shots',
      'WebP output keeps collection pages fast without visible loss',
      'Consistent square framing across an entire catalog',
      'Batch the whole import and download one ZIP',
    ],
    faqs: [
      {
        q: 'What size should Shopify product images be?',
        a: 'Shopify recommends 2048 × 2048 px, square, with the product filling most of the frame. Files are limited to 20 MB and accepted in JPEG, PNG, WebP and GIF.',
      },
      {
        q: 'Should I use WebP on Shopify?',
        a: 'Yes — Shopify serves WebP to supporting browsers automatically, and a WebP upload reduces original file size too. Keep PNG only when the product genuinely needs transparency.',
      },
    ],
    related: ['instagram-post', 'youtube-thumbnail', 'compress-under-200kb'],
  },
  {
    slug: 'whatsapp-sticker',
    name: 'WhatsApp sticker',
    tool: 'resize',
    title: 'WhatsApp Sticker Size — 512×512 PNG',
    description:
      'Convert a photo into a 512 × 512 PNG WhatsApp sticker under 100 KB, with a transparent background ready for the sticker pack.',
    h1: 'Make a WhatsApp sticker (512 × 512 PNG)',
    intro:
      'WhatsApp stickers are 512 × 512 pixels, PNG, and must stay under 100 KB. That combination is exactly what this preset produces: square canvas, transparent-capable PNG, and a file small enough to import into any sticker app.',
    specLabel: '512 × 512 px · PNG · under 100 KB',
    format: 'png',
    quality: 100,
    width: 512,
    height: 512,
    fit: 'contain',
    maxKB: 100,
    bullets: [
      'Exact 512 × 512 px canvas required by WhatsApp',
      'PNG output preserves cut-out edges for sticker apps',
      'Contain fit so nothing is clipped before you cut the background',
      'Small enough to import directly into a sticker maker',
    ],
    faqs: [
      {
        q: 'What size is a WhatsApp sticker?',
        a: '512 × 512 pixels, PNG, under 100 KB per sticker. Animated stickers are 512 × 512 WebP and capped at 500 KB.',
      },
      {
        q: 'How do I remove the background?',
        a: 'This preset gives you the correct canvas and format. For a true cut-out, remove the background first so the PNG keeps transparency, then resize here.',
      },
    ],
    related: ['instagram-story', 'compress-under-50kb', 'passport-photo'],
  },
];

export const PRESET_SLUGS = PRESETS.map((preset) => preset.slug);

export function getPreset(slug: string): Preset | undefined {
  return PRESETS.find((preset) => preset.slug === slug);
}

/** Query string that opens the studio in this preset's exact configuration. */
export function presetHref(preset: Preset): string {
  return `/tools?preset=${preset.slug}&tool=${preset.tool}&format=${preset.format}`;
}
