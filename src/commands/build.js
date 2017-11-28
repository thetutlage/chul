const boxen = require('boxen')
const _ = require('lodash')
const path = require('path')
const chalk = require('chalk')
const Runner = require('../../src/Runner')
const emitter = require('../../src/emitter')
const intercept = require('intercept-stdout')

/**
 * Returns relative path to a file
 *
 * @param {String} rootDir
 * @param {String} absPath
 *
 * @returns {String}
 */
function relativePath (rootDir, absPath) {
  return absPath.replace(rootDir, '').replace(path.sep, '')
}

module.exports = function (rootDir, name, flags, disableWatcherEvent) {
  /**
   * Asciidoctor gives nasty warning on stdout, so we just
   * filter them
   */
  intercept((txt) => {
    return txt.startsWith('asciidoctor: WARNING') ? '' : txt
  })

  emitter
  .on('content:files:processed', (files) => {
    const docs = _.size(files) === 1 ? `1 doc` : `${_.size(files)} docs`
    console.log(chalk`    {magenta Processed} ${docs}`)
  })
  .on('pages:files:processed', (files) => {
    const pages = _.size(files) === 1 ? `1 page` : `${_.size(files)} pages`
    console.log(chalk`    {magenta Processed} ${pages}`)
  })
  .on('content:file:ignore', ({ message }) => {
    console.log(chalk`     {yellow ${message}}`)
  })
  .on('content:menu:saved', (filePath) => {
    console.log(chalk`    {green Saved menu file ${relativePath(rootDir, filePath)}}`)
  })
  .on('file:add', (filePath) => {
    console.log(chalk`    {green Add/Modified} ${relativePath(rootDir, filePath)}`)
  })
  .on('file:change', (filePath) => {
    console.log(chalk`    {yellow Modified} ${relativePath(rootDir, filePath)}`)
  })
  .on('file:unlink', (filePath) => {
    console.log(chalk`    {red Removed} ${relativePath(rootDir, filePath)}`)
  })
  .on('error', (error) => {
    console.log(chalk.red(error.message))
  })

  console.log('')

  if (!disableWatcherEvent) {
    emitter.on('watcher', () => {
      console.log(boxen(chalk`{green Watching for file changes}`, {
        padding: {
          top: 1,
          bottom: 1,
          left: 3,
          right: 3
        },
        margin: {
          left: 3
        },
        dimBorder: true,
        borderStyle: 'double'
      }))
    })
  }

  new Runner(rootDir, require(path.join(rootDir, 'chul.js')))
  .run(!!flags.watch)
}
