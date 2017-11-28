const boxen = require('boxen')
const serveStatic = require('serve-static')
const http = require('http')
const getPort = require('get-port')
const path = require('path')
const finalhandler = require('finalhandler')
const chalk = require('chalk')
const build = require('./build')
const emitter = require('../../src/emitter')

module.exports = async function (rootDir, name, flags) {
  const configFile = require(path.join(rootDir, 'chul.js'))
  const serve = serveStatic(path.join(rootDir, configFile.directories.build), {
    extensions: ['html']
  })

  const port = await getPort({ port: flags.port })
  const server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res))
  })

  server.listen(port, async function () {
    emitter.on('watcher', () => {
      const messages = []
      messages.push(chalk`{green Watching for file changes}`)
      messages.push(chalk`{magenta Started server on} http://localhost:${port}`)
      console.log(boxen(messages.join('\n'), {
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

    flags.watch = true
    await build(rootDir, name, flags, true)
  })
}
