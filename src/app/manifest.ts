import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finza',
    short_name: 'finza.',
    description: 'Organize seu dinheiro por caixas de propósito.',
    start_url: '/dashboard', 
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}