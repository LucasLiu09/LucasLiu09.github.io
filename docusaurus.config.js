// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Lucas's Notebook",
  tagline: '分享思考 · 记录成长 · 探索世界',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://lucasliu09.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'LucasLiu09', // Usually your GitHub org/user name.
  projectName: 'LucasLiu09.github.io', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-cn',
    locales: ['zh-cn'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          include: ['**/*.md', '**/*.mdx', '**/**/*.md', '**/**/*.mdx'],
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/LucasLiu09/LucasLiu09.github.io/',
        },
        blog: false,
//        blog: {
//          showReadingTime: true,
//          feedOptions: {
//            type: ['rss', 'atom'],
//            xslt: true,
//          },
//          // Please change this to your repo.
//          // Remove this to remove the "edit this page" links.
//          editUrl:
//            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
//          // Useful options to enforce blogging best practices
//          onInlineTags: 'warn',
//          onInlineAuthors: 'warn',
//          onUntruncatedBlogPosts: 'warn',
//        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Notebook',
        logo: {
          alt: 'Lucas',
          src: 'img/home/lucas2_289x289.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Tutorial',
          },
          {
            type: 'docSidebar',
            sidebarId: 'odooSidebar',
            position: 'left',
            label: 'Odoo',
          },
          {
            type: 'docSidebar',
            sidebarId: 'projectManagerSidebar',
            position: 'left',
            label: '项目管理',
          },
          {
            href: 'https://github.com/LucasLiu09/LucasLiu09.github.io',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: 'docs/intro',
              },
              {
                label: 'Odoo',
                to: 'docs/odoo',
              },
              {
                label: '项目管理',
                to: 'docs/intro',
              },
            ],
          },
          {
            title: 'Contact us',
            items: [
              {
                label: 'Email: liusenyuan_09@163.com',
                href: '/',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/LucasLiu09',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Lucas's Notes, Lucas Liu. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
