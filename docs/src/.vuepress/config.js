const { description } = require('../../package')
const commands = require('./data/commands.json')

const cmds = commands.map((cmd) => {
  const fp = require('path')
    .resolve(__dirname, `../commands/${cmd.options.info.name}.md`)

  return { 
    path: `/commands/${cmd.options.info.name}`, 
    filePath: fp,
    name: cmd.options.info.name
  }
})

module.exports = {
  additionalPages() {
    return cmds.map((cmd) => ({ path: cmd.path, filePath: cmd.filePath }))
  },

  base: '/golem/',

  title: 'Golem',
  description: description,
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],
  theme: 'default-prefers-color-scheme',

  themeConfig: {
    repo: 'https://github.com/aturingmachine/golem',
    editLinks: false,
    docsDir: '',
    editLinkText: '',
    lastUpdated: false,
    logo: '/golem-logo.png',
    smoothScroll: true,
    nav: [
      { 
        text: 'Commands', 
        items: [{ text: 'All commands', link: '/commands/' }, ...cmds.map(cmd => ({ text: cmd.name, link: cmd.path }))],
      },
      {
        text: 'Reference',
        items: [
          { text: 'GolemAlias', link: '/reference/alias-strings' },
          { text: 'Modules', link: '/reference/modules' },
          { text: 'Tracks', link: '/reference/tracks' },
        ]
      },
      {
        text: 'Admin', items: [
          { text: 'Config', link: '/admin/config' }
        ]
      },
    ],
    sidebar: {
      '/commands': cmds.map((cmd) => [cmd.path, cmd.name ])
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
  ],
}
