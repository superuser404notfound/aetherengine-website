import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://aetherengine.superuser404.de',
  integrations: [
    starlight({
      title: 'AetherEngine',
      description: 'A media player engine for Apple platforms. FFmpeg demuxes, VideoToolbox decodes, AVPlayer handles Dolby Atmos.',
      logo: { src: './src/assets/logo.png', alt: 'AetherEngine' },
      favicon: '/favicon.png',
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/superuser404notfound/AetherEngine' },
      ],
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://aetherengine.superuser404.de/og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { slug: 'guides/introduction' },
            { slug: 'guides/quick-start' },
            { slug: 'guides/installation' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { slug: 'reference/formats' },
            { slug: 'reference/architecture' },
            { slug: 'reference/cli' },
          ],
        },
      ],
    }),
  ],
});
