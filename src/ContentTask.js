const _ = require('lodash')
const Metalsmith = require('metalsmith')
const util = require('util')
const path = require('path')
const fs = require('fs-extra')
const emitter = require('./emitter')
const ContentPlugins = require('./ContentPlugins')

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
    this.contentPlugins = new ContentPlugins()

    this._build = util.promisify(this.smith.build.bind(this.smith))

    this
      .smith
      .metadata(config)
      .source(config.directories.content)
      .destination(`${config.directories.build}/docs`)
      .use(this.contentPlugins.filterDrafts.bind(this.contentPlugins))
      .use(this.contentPlugins.compileDocs.bind(this.contentPlugins))
      .use(this.contentPlugins.generateMenu.bind(this.contentPlugins))
      .use(this.contentPlugins.generateHTML.bind(this.contentPlugins))
      .use(this.contentPlugins.rename.bind(this.contentPlugins))
      .use(this.contentPlugins.saveMenuFile.bind(this.contentPlugins))
      .clean(true)
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
      `${this.rootDir}/${this.config.directories.content}/**/*.adoc`,
      `${this.rootDir}/${this.config.directories.pages}/${this.config.edge.contentView}`
    ]
  }

  /**
   * First time build
   *
   * @method build
   */
  async build () {
    await this.validate()
    const files = await this._build()
    return files
  }

  /**
   * Validates the existence of directories and files before
   * proceeding.
   *
   * @method validate
   */
  async validate () {
    const contentDir = _.get(this.config, 'directories.content')
    const pagesDir = _.get(this.config, 'directories.pages')
    const buildDir = _.get(this.config, 'directories.build')
    const contentView = _.get(this.config, 'edge.contentView')

    if (!contentDir) {
      throw new Error('Make sure to define directories.content directory inside the chul.js file')
    }

    if (!pagesDir) {
      throw new Error('Make sure to define directories.pages directory inside the chul.js file')
    }

    if (!buildDir) {
      throw new Error('Make sure to define directories.build directory inside the chul.js file')
    }

    if (!contentView) {
      throw new Error('Make sure to define edge.contentView template name inside the chul.js file')
    }

    const hasContentDir = await fs.pathExists(path.join(this.rootDir, contentDir))
    if (!hasContentDir) {
      throw new Error(`${contentDir} is missing. Make sure to create one before proceeding`)
    }

    const hasContentView = await fs.pathExists(path.join(this.rootDir, pagesDir, contentView))
    if (!hasContentView) {
      throw new Error(`${contentView} is missing. Make sure to create one before proceeding`)
    }
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
    emitter.emit(`file:${event}`, filePath)
    const files = await this.build()
    return files
  }
}

module.exports = ContentTask
