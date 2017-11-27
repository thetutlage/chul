const edge = require('edge.js')
const _ = require('lodash')
const debug = require('debug')('chul:edge')
let configuredEdge = null

module.exports = function (viewsDir, theme, globals) {
  if (configuredEdge) {
    return
  }

  edge.global('themePartial', (partial) => `../themes/${theme}/${partial}`)
  edge.global('permalink', (meta) => meta.permalink)
  debug('added themePartial and permalink view globals')

  /**
   * Apply user globals to edge
   */
  _.each(globals, (fn, name) => {
    debug('applied view global %s', name)
    edge.global(name, fn)
  })

  /**
   * Register the views directory
   */
  edge.registerViews(viewsDir)
  debug('registered %s as views dir', viewsDir)

  configuredEdge = true
}

module.exports.edge = edge
