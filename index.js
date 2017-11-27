const path = require('path')
const meow = require('meow')
const chalk = require('chalk')
const fs = require('fs-extra')

const Runner = require('./src/Runner')
const emitter = require('./src/emitter')
const themes = ['slate']

const help = chalk`
{yellow Usage}
  {dim $} {cyan init}               Init project structure
  {dim $} {cyan build}              Build project
  {dim $} {cyan theme:list}         List of available themes
  {dim $} {cyan theme:add} <name>   Add theme to your project source

{yellow Options}
  {cyan --watch, -w}          Watch files during build

{yellow Examples}
  $ init
  $ build --watch
`

/**
 * Returns relative path to a file
 *
 * @param {String} absPath
 *
 * @returns {String}
 */
function relativePath (absPath) {
  return absPath.replace(process.cwd(), '').replace(path.sep, '')
}

const cli = meow(help, { description: false, version: false })
const [command, value] = cli.input

/**
 * Give you some scaffolding
 */
if (command === 'init') {
  (async function () {
    await fs.copy(path.join(__dirname, './config/index.js'), path.join(process.cwd(), 'chul.js'))
    await fs.ensureDir(path.join(process.cwd(), 'content'))
    await fs.ensureDir(path.join(process.cwd(), 'themes'))
    await fs.ensureDir(path.join(process.cwd(), 'pages'))
  })()
}

/**
 * List of available themes
 */
if (command === 'theme:list') {
  themes.forEach((theme) => {
    console.log(chalk`{yellow - ${theme}}`)
  })
}

/**
 * Copy theme to the user directory
 */
if (command === 'theme:add') {
  if (!value) {
    console.log(chalk`{red Define theme name}`)
  } else if (themes.indexOf(value) === -1) {
    console.log(chalk`{red Invalid theme ${value}}`)
  } else {
    (async function () {
      await fs.copy(path.join(__dirname, 'themes', value), path.join(process.cwd(), 'themes', value))
    })()
  }
}

/**
 * Let's build the site
 */
if (command === 'build') {
  emitter
    .on('content:files:processed', () => {
      console.log(chalk`{green Processed content files}`)
    })
    .on('pages:files:processed', () => {
      console.log(chalk`{green Processed pages}`)
    })
    .on('watcher', () => {
      console.log(chalk`{cyan Watching for file changes...}`)
    })
    .on('content:file:ignore', ({ message }) => {
      console.log(chalk`{yellow ${message}}`)
    })
    .on('content:menu:saved', (filePath) => {
      console.log(chalk`{green Saved menu file ${relativePath(filePath)}}`)
    })
    .on('file:add', (filePath) => {
      console.log(chalk`{green Add/Modified ${relativePath(filePath)}}`)
    })
    .on('file:change', (filePath) => {
      console.log(chalk`{yellow Modified ${relativePath(filePath)}}`)
    })
    .on('file:unlink', (filePath) => {
      console.log(chalk`{red Removed ${relativePath(filePath)}}`)
    })
    .on('error', (error) => {
      console.log(chalk.red(error.message))
      process.exit(1)
    })

  new Runner(process.cwd(), require(path.join(process.cwd(), 'chul.js')))
    .run(!!cli.flags.watch)
}
