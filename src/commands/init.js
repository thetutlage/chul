const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

module.exports = async function (rootDir) {
  await fs.copy(path.join(__dirname, '../../config/index.js'), path.join(rootDir, 'chul.js'))
  console.log(chalk`{green Created chul.js}`)

  await fs.ensureDir(path.join(rootDir, 'content'))
  console.log(chalk`{green Created content}`)

  await fs.ensureDir(path.join(rootDir, 'themes'))
  console.log(chalk`{green Created themes}`)

  await fs.ensureDir(path.join(rootDir, 'pages'))
  console.log(chalk`{green Created pages}`)
}
