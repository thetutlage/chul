const _ = require('lodash')
const path = require('path')
const debug = require('debug')('chul:metalsmith')
const { edge } = require('./edge')

class ContentPlugins {
  /**
   * Do not process the contentView
   *
   * @method filterContentView
   *
   * @param {Object} files
   * @param {Object} metalsmith
   */
  filterContentView (files, metalsmith) {
    const meta = metalsmith.metadata()

    _.each(files, (file, name) => {
      const extension = path.extname(name)
      const baseName = path.basename(name)
      if (name === meta.edge.contentView || name !== baseName || extension !== '.edge') {
        debug('ignoring content view template %s', name)
        delete files[name]
      }
    })
  }

  /**
   * Generates the HTML content using the edge view
   *
   * @method compilePages
   *
   * @param {Object} files
   */
  compilePages (files) {
    _.each(files, (file, name) => {
      file.contents = edge.render(name)
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
      const htmlName = name.replace(/\.edge$/, '.html')
      files[htmlName] = file

      debug('renamed %s to %s', name, htmlName)
      delete files[name]
    })
  }
}

module.exports = ContentPlugins
