#!/usr/bin/env node

const meow = require('meow')
const chalk = require('chalk')
const init = require('./src/commands/init')
const listThemes = require('./src/commands/listThemes')
const addTheme = require('./src/commands/addTheme')
const build = require('./src/commands/build')
const serve = require('./src/commands/serve')

const help = chalk`
{yellow Usage}
  {dim $} {cyan init}               Init project structure
  {dim $} {cyan build}              Build project
  {dim $} {cyan theme:list}         List of available themes
  {dim $} {cyan theme:add} <name>   Add theme to your project source
  {dim $} {cyan serve}              Build and serve project

{yellow Options}
  {cyan --watch, -w}          Watch files during build
  {cyan --port, -p}           Serve project on a given port
`

const commands = {
  'init': init,
  'theme:list': listThemes,
  'theme:add': addTheme,
  'build': build,
  'serve': serve
}

const cli = meow(help, { description: false, version: false })
const [command, value] = cli.input

if (commands[command]) {
  (async function () {
    await commands[command](process.cwd(), value, cli.flags)
  })()
}
