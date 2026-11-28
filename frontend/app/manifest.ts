import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Resizer AI — Product Image Studio',
    short_name: 'Resizer AI',
    description: 'Resize, crop, compress, and convert product photos for your store and the web.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
