const test = require('japa')
const PagesPlugins = require('../src/PagesPlugins')

test.group('Pages plugins', () => {
  test('do not process contentView template', (assert) => {
    const files = {
      'doc.edge': {}
    }

    const metalsmith = {
      metadata () {
        return {
          edge: {
            contentView: 'doc.edge'
          }
        }
      }
    }

    const pagesPlugins = new PagesPlugins()
    pagesPlugins.filterContentView(files, metalsmith)

    assert.deepEqual(files, {})
  })

  test('do not process nested templates', (assert) => {
    const files = {
      'partials/foo.edge': {}
    }

    const metalsmith = {
      metadata () {
        return {
          edge: {
            contentView: 'doc.edge'
          }
        }
      }
    }

    const pagesPlugins = new PagesPlugins()
    pagesPlugins.filterContentView(files, metalsmith)

    assert.deepEqual(files, {})
  })

  test('do not process files that doesnt ends with .edge', (assert) => {
    const files = {
      'foo': {}
    }

    const metalsmith = {
      metadata () {
        return {
          edge: {
            contentView: 'doc.edge'
          }
        }
      }
    }

    const pagesPlugins = new PagesPlugins()
    pagesPlugins.filterContentView(files, metalsmith)

    assert.deepEqual(files, {})
  })

  test('process .edge files on root', (assert) => {
    const files = {
      'index.edge': {},
      'home.edge': {}
    }

    const metalsmith = {
      metadata () {
        return {
          edge: {
            contentView: 'doc.edge'
          }
        }
      }
    }

    const pagesPlugins = new PagesPlugins()
    pagesPlugins.filterContentView(files, metalsmith)

    assert.deepEqual(files, {
      'index.edge': {},
      'home.edge': {}
    })
  })

  test('rename files to .html', (assert) => {
    const files = {
      'index.edge': {},
      'home.edge': {}
    }

    const pagesPlugins = new PagesPlugins()
    pagesPlugins.rename(files)

    assert.deepEqual(files, {
      'index.html': {},
      'home.html': {}
    })
  })

  test('rename nested files to .html', (assert) => {
    const files = {
      'home/index.edge': {}
    }

    const pagesPlugins = new PagesPlugins()
    pagesPlugins.rename(files)

    assert.deepEqual(files, {
      'home/index.html': {}
    })
  })
})
