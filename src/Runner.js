const chokidar = require('chokidar')
const anymatch = require('anymatch')
const debug = require('debug')('chul:runner')
const path = require('path')

const emitter = require('./emitter')
const ContentTask = require('./ContentTask')
const PagesTask = require('./PagesTask')
const DEFAULTS = require('../config')
const edge = require('./edge')

class Runner {
  constructor (rootDir, config) {
    this.rootDir = rootDir
    this.config = Object.assign({}, DEFAULTS, config)
    debug('config', this.config)

    this.contentTask = new ContentTask(rootDir, this.config)
    this.pagesTask = new PagesTask(rootDir, this.config)
    this.contentMatcher = anymatch(this.contentTask.watchGlob)
    this.pagesMatcher = anymatch(this.pagesTask.watchGlob)

    /**
     * Setting up edge
     */
    edge(path.join(rootDir, this.config.directories.pages), this.config.theme, this.config.edge.globals)
  }

  /**
   * Run the content task using metalsmith
   *
   * @method runContentTask
   *
   * @returns {Promise}
   */
  async runContentTask () {
    const files = await this.contentTask.build()
    emitter.emit('content:files:processed', files)
  }

  /**
   * Run the content task using metalsmith
   *
   * @method runPagesTask
   *
   * @returns {Promise}
   */
  async runPagesTask () {
    const files = await this.pagesTask.build()
    emitter.emit('pages:files:processed', files)
  }

  /**
   * Watch for files for incremental builds
   *
   * @method watchFiles
   */
  watchFiles () {
    chokidar
      .watch(this.rootDir, {
        ignored: [
          /node_modules/,
          (file) => {
            return file !== this.rootDir && (!this.contentMatcher(file) && !this.pagesMatcher(file))
          }
        ]
      })
      .on('all', async (eventName, filePath) => {
        debug('received %s event on %s', eventName, filePath)
        await this.runOnFileChange(eventName, filePath)
      })
  }

  /**
   * Runs the tasks when a file changes.
   *
   * @method runOnFileChange
   *
   * @param {String} eventName
   * @param {String} filePath
   */
  async runOnFileChange (eventName, filePath) {
    if (this.pagesMatcher(filePath)) {
      try {
        await this.pagesTask.onChange(eventName, filePath)
      } catch (error) {
        emitter.emit('error', error)
      }
    }

    if (this.contentMatcher(filePath)) {
      try {
        await this.contentTask.onChange(eventName, filePath)
      } catch (error) {
        emitter.emit('error', error)
      }
    }
  }

  /**
   * Watch for file changes or not
   *
   * @method run
   *
   * @param {Boolean} watch
   */
  async run (watch = true) {
    try {
      await Promise.all([this.runContentTask(), this.runPagesTask()])
      if (watch) {
        debug('watching for file changes')
        emitter.emit('watcher', {
          content: this.contentTask.watchGlob
        })
        this.watchFiles()
      }
    } catch (error) {
      emitter.emit('error', error)
    }
  }
}

module.exports = Runner
