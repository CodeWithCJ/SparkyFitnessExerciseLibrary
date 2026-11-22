import { defineConfig } from 'vitepress';

const REPO = 'https://github.com/CodeWithCJ/SparkyFitnessExerciseLibrary';

export default defineConfig({
  title: 'SparkyFitness Exercise Library',
  description: 'Browse 1,900+ exercises with muscles, equipment, instructions and demonstration videos.',
  base: '/SparkyFitnessExerciseLibrary/',
  srcDir: './src',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/SparkyFitnessExerciseLibrary/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Exercise Library',

    search: { provider: 'local' },

    nav: [
      { text: 'Browse', link: '/browse' },
      { text: 'Guide', link: '/guide/' },
      { text: 'SparkyFitness', link: 'https://codewithcj.github.io/SparkyFitness/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Using the catalog', link: '/guide/' },
            { text: 'Contributing an exercise', link: '/guide/contributing' },
            { text: 'Media standards', link: '/guide/media' },
          ],
        },
        {
          text: 'AI video prompts',
          items: [
            { text: 'Image to video', link: '/guide/prompts/image-to-video' },
            { text: 'Video to video', link: '/guide/prompts/video-to-video' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: REPO }],

    editLink: {
      pattern: `${REPO}/edit/main/docs/src/:path`,
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: `Free for non-commercial use. <a href="${REPO}/blob/main/LICENSE">License</a> · <a href="${REPO}/blob/main/NOTICE.md">Data credits</a>`,
      copyright: '© codewithcj',
    },
  },
});
