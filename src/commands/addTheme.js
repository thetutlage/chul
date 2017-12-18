const chalk = require('chalk')
const path = require('path')
const themes = ['slate']
const fs = require('fs-extra')

module.exports = async function (rootDir, name) {
  if (!name) {
    console.log(chalk`{red Define theme name}`)
    return
  }

  if (themes.indexOf(name) === -1) {
    console.log(chalk`{red Invalid theme ${name}}`)
    return
  }

  await fs.copy(path.join(__dirname, '../../themes', name), path.join(rootDir, 'themes', name))
  console.log(chalk`{green Added themes/${name}}`)
}
