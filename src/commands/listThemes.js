const chalk = require('chalk')
const themes = ['slate']

module.exports = function () {
  themes.forEach((theme) => (console.log(chalk`{yellow - ${theme}}`)))
}
