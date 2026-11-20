// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'StudyPrep',
  tagline: 'Interview questions with simple answers and code',
  favicon: 'img/favicon.svg',

  // GitHub Pages settings (repo: amiteshgit/StudyPrep)
  url: 'https://amiteshgit.github.io',
  baseUrl: '/StudyPrep/',
  organizationName: 'amiteshgit',
  projectName: 'StudyPrep',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: { onBrokenMarkdownLinks: 'warn' },
  },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Docs-only site: lessons live at the root, no blog
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: 'StudyPrep',
        logo: { alt: 'StudyPrep logo', src: 'img/favicon.svg' },
        items: [
          { to: '/spring-boot-interview', label: 'Spring Boot', position: 'left' },
          { to: '/java-interview', label: 'Java', position: 'left' },
          { href: 'https://github.com/amiteshgit/StudyPrep', label: 'GitHub', position: 'right' },
        ],
      },
      docs: { sidebar: { hideable: true, autoCollapseCategories: true } },
      footer: {
        style: 'light',
        copyright: `StudyPrep. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['java', 'bash', 'yaml', 'properties', 'sql', 'json'],
      },
    }),
};

export default config;
