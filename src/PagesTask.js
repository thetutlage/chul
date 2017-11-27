const Metalsmith = require('metalsmith')
const util = require('util')
const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const debug = require('debug')('chul:pages')

const emitter = require('./emitter')
const PagesPlugin = require('./PagesPlugins')

/**
 * Metalsmith content task. It will convert all asciidoc files
 * to HTML.
 *
 * @class ContentTask
 */
class ContentTask {
  constructor (rootDir, config) {
    this.rootDir = rootDir
    this.config = config
    this.smith = Metalsmith(rootDir)
    this.pagesPlugin = new PagesPlugin()

    this._build = util.promisify(this.smith.build.bind(this.smith))
    this._lastPages = {}

    this
      .smith
      .metadata(config)
      .source(config.directories.pages)
      .destination(config.directories.build)
      .use(this.pagesPlugin.filterContentView.bind(this.pagesPlugin))
      .use(this.pagesPlugin.compilePages.bind(this.pagesPlugin))
      .use(this.pagesPlugin.rename.bind(this.pagesPlugin))
      .clean(false)
  }

  /**
   * The tree to be watched for file changes
   *
   * @attribute watchGlob
   *
   * @returns Array
   */
  get watchGlob () {
    return [
      `${this.rootDir}/${this.config.directories.pages}/**/*.edge`
    ]
  }

  /**
   * First time build
   *
   * @method build
   */
  async build () {
    const files = await this._build()
    this._lastPages = Object.keys(files)
    debug('recent build pages %j', this._lastPages)
    return files
  }

  /**
   * Since this task drops files to the root of the build folder,
   * we cannot clean the entir folder, instead we keep a
   * reference of last processed files and remove them
   * before proceeding.
   *
   * @method clean
   */
  async clean () {
    await Promise.all(_.map(this._lastPages, (page) => {
      return fs.remove(path.join(this.config.directories.build, page))
    }))
  }

  /**
   * Fired when file are added, deleted or changed
   * that matches watchGlob.
   *
   * @method onChange
   *
   * @param {Object} event
   * @param {String} filePath
   */
  async onChange (event, filePath) {
    /**
     * Only process when the file changed is not the content
     * views
     */
    if (!filePath.endsWith(this.config.edge.contentView)) {
      emitter.emit(`file:${event}`, filePath)
      await this.clean()
      const files = await this.build()
      return files
    }
  }
}

module.exports = ContentTask
