const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const debug = require('debug')('chul:metalsmith')
const AsciiDoc = require('./AsciiDoc')
const emitter = require('./emitter')
const { edge } = require('./edge')

class ContentPlugins {
  constructor () {
    this.adoc = null
  }

  /**
   * Returns the correct message based upon why the file was ignored.
   *
   * @method _getIgnoreMessage
   *
   * @param {String} name
   * @param {Boolean} extensionNotAllowed
   * @param {Boolean} isDraft
   *
   * @private
   */
  _getIgnoreMessage (name, extensionNotAllowed, isDraft) {
    if (extensionNotAllowed) {
      return `Ignoring ${name} due to extension mis-match. Update contentExtensions inside config file (if required)`
    }

    if (isDraft) {
      return `Ignoring draft ${name}`
    }

    return `Ignoring ${name}, since permalink is missing`
  }

  /**
   * Removes files starting with `_`
   *
   * @method filterDrafts
   *
   * @param {Object} files
   * @param {Object} metalsmith
   */
  filterDrafts (files, metalsmith) {
    const meta = metalsmith.metadata()

    _.each(files, (file, name) => {
      const isDraft = path.basename(name).startsWith('_')
      const extension = path.extname(name).replace(/^\./, '')
      const extensionNotAllowed = !_.includes(meta.contentExtensions, extension)

      if (extensionNotAllowed || isDraft || !file.permalink) {
        const message = this._getIgnoreMessage(name, extensionNotAllowed, isDraft)
        emitter.emit('content:file:ignore', { message })
        debug(message)
        delete files[name]
      }
    })
  }

  /**
   * Compiles all docs and set `html` and `docTitle`
   * properties on the file node.
   *
   * @method compileDocs
   *
   * @param {Object} files
   * @param {Object} metalsmith
   */
  compileDocs (files, metalsmith) {
    const meta = metalsmith.metadata()
    this.adoc = this.adoc || new AsciiDoc(meta.asciidoctor)

    _.each(files, (file, name) => {
      debug('compiling %s', name)
      Object.assign(file, this.adoc.convert(file.contents.toString('utf-8')))
    })
  }

  /**
   * Generates the menu node, based upon the
   * generated contents.
   *
   * @method generateMenu
   *
   * @param {Object} files
   * @param {Object} metalsmith
   */
  generateMenu (files, metalsmith) {
    metalsmith.menu = []

    _.each(files, (file, name) => {
      const node = _.omit(file, ['contents', 'stats', 'mode'])
      const existingNode = _.find(metalsmith.menu, (item) => item.name === name)

      /**
       * If node already existing, simply merge new values to it.
       */
      existingNode ? _.merge(existingNode, node) : metalsmith.menu.push(node)
    })

    /**
     * Update menu order
     */
    metalsmith.menu = _.orderBy(metalsmith.menu, 'name')
  }

  /**
   * Generates the HTML content using the edge view
   *
   * @method generateHTML
   *
   * @param {Object} files
   * @param {Object} metalsmith
   */
  generateHTML (files, metalsmith) {
    const meta = metalsmith.metadata()

    _.each(files, (file, name) => {
      const view = file.layout || meta.edge.contentView
      debug('using %s as content view', view)

      file.contents = edge.render(view, {
        html: file.html,
        menu: metalsmith.menu,
        meta: _.omit(file, ['contents', 'stats', 'mode', 'html'])
      })
    })
  }

  /**
   * Renames all adoc file to .html
   *
   * @method rename
   *
   * @param {Object} files
   */
  rename (files) {
    _.each(files, (file, name) => {
      const htmlName = `${file.permalink}.html`
      files[htmlName] = file

      debug('renamed %s to %s', name, htmlName)
      delete files[name]
    })
  }

  /**
   * Saves the menu file to the user defined location
   *
   * @method saveMenuFile
   *
   * @param {Object} files
   * @param {Object} metalsmith
   * @param {Function} done
   */
  saveMenuFile (files, metalsmith, done) {
    const meta = metalsmith.metadata()
    if (!meta.menuFile) {
      done()
      return
    }

    const menuFile = path.join(meta.baseDir, meta.menuFile)

    emitter.emit('content:menu:saved', menuFile)
    debug('generating menu file at %s location', menuFile)

    fs.outputFile(menuFile, JSON.stringify(metalsmith.menu, null, 2), done)
  }
}

module.exports = ContentPlugins
