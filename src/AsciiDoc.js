class AsciiDoc {
  constructor (config) {
    this.config = config
    this.asciidoctor = require('asciidoctor.js')()
  }

  /**
   * Converts adoc content to HTML and also
   * abstract the converts the front matter
   * to an object
   *
   * @method convert
   *
   * @param  {String} contents
   *
   * @return {Object}
   *         {String} html
   *         {String} docTitle
   */
  convert (contents) {
    const doc = this.asciidoctor.load(contents, this.config)
    const html = doc
      .convert()
      .replace(/<pre class="highlight">/g, () => '<pre class="highlight line-numbers">')

    return {
      html,
      docTitle: doc.getAttribute('doctitle')
    }
  }
}

module.exports = AsciiDoc
