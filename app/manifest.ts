import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vani',
    short_name: 'Vani',
    description: 'Production-grade X audio client for focused listening.',
    start_url: '/listen',
    display: 'standalone',
    background_color: '#07111f',
    theme_color: '#07111f',
    icons: [],
  }
}
