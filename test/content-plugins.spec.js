const test = require('japa')
const dedent = require('dedent')
const ContentPlugins = require('../src/ContentPlugins')
const emitter = require('../src/emitter')

test.group('Content plugins', () => {
  test('filter all files that starts with _', (assert) => {
    assert.plan(2)

    const files = {
      'foo.adoc': {
        permalink: 'hello'
      },
      '_bar.adoc': {}
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc']
        }
      }
    }

    const contentPlugins = new ContentPlugins()

    emitter.once('content:file:ignore', ({ message }) => {
      assert.equal(message, 'Ignoring draft _bar.adoc')
    })

    contentPlugins.filterDrafts(files, metalsmith)

    assert.deepEqual(files, { 'foo.adoc': { permalink: 'hello' } })
  })

  test('filter when nested file name starts with _', (assert) => {
    assert.plan(2)

    const files = {
      'foo.adoc': {
        permalink: 'hello'
      },
      'intro/_bar.adoc': {}
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc']
        }
      }
    }

    const contentPlugins = new ContentPlugins()

    emitter.once('content:file:ignore', ({ message }) => {
      assert.equal(message, 'Ignoring draft intro/_bar.adoc')
    })

    contentPlugins.filterDrafts(files, metalsmith)

    assert.deepEqual(files, { 'foo.adoc': {
      permalink: 'hello'
    } })
  })

  test('filter when permalink doesn\'t exists', (assert) => {
    assert.plan(2)

    const files = {
      'foo.adoc': {},
      'intro/_bar.adoc': {}
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc']
        }
      }
    }

    const contentPlugins = new ContentPlugins()
    emitter.once('content:file:ignore', ({ message }) => {
      assert.equal(message, 'Ignoring foo.adoc, since permalink is missing')
    })
    contentPlugins.filterDrafts(files, metalsmith)
    assert.deepEqual(files, {})
  })

  test('ignore file when file extension is not allowed', (assert) => {
    assert.plan(2)

    const files = {
      'foo.md': {}
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc']
        }
      }
    }

    const contentPlugins = new ContentPlugins()
    emitter.once('content:file:ignore', ({ message }) => {
      assert.equal(message, 'Ignoring foo.md due to extension mis-match. Update contentExtensions inside config file (if required)')
    })
    contentPlugins.filterDrafts(files, metalsmith)
    assert.deepEqual(files, {})
  })

  test('compile file contents and merge to file node', (assert) => {
    const files = {
      'foo.adoc': {
        permalink: 'foo',
        contents: dedent`
        = Foo

        Welcome to the foo world
        `
      }
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc']
        }
      }
    }

    const contentPlugins = new ContentPlugins()
    contentPlugins.compileDocs(files, metalsmith)

    assert.equal(files['foo.adoc'].html, dedent`
    <div class="paragraph">
    <p>Welcome to the foo world</p>
    </div>
    `)

    assert.equal(files['foo.adoc'].docTitle, 'Foo')
  })

  test('generate menu and attach to metalsmith as a node', (assert) => {
    const files = {
      'foo.adoc': {
        permalink: 'foo'
      }
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc']
        }
      }
    }

    const contentPlugins = new ContentPlugins()
    contentPlugins.generateMenu(files, metalsmith)
    assert.deepEqual(metalsmith.menu, [
      {
        permalink: 'foo'
      }
    ])
  })

  test('rename the file to html', (assert) => {
    const files = {
      'foo.adoc': {
        permalink: 'foo'
      }
    }

    const contentPlugins = new ContentPlugins()
    contentPlugins.rename(files)
    assert.deepEqual(files, {
      'foo.html': {
        permalink: 'foo'
      }
    })
  })

  test('rename nested files to html', (assert) => {
    const files = {
      'intro/foo.adoc': {
        permalink: 'foo'
      }
    }

    const contentPlugins = new ContentPlugins()
    contentPlugins.rename(files)
    assert.deepEqual(files, {
      'foo.html': {
        permalink: 'foo'
      }
    })
  })

  test('use all meta data from file node except mode, content and stats', (assert) => {
    const files = {
      'intro/foo.adoc': {
        permalink: 'foo',
        content: 'foo',
        stats: {},
        description: 'foo'
      }
    }

    const metalsmith = {
      metadata () {
        return {
          contentExtensions: ['adoc'],
          edge: {
            contentView: 'foo'
          }
        }
      }
    }

    const contentPlugins = new ContentPlugins()
    contentPlugins.generateMenu(files, metalsmith)
    assert.deepEqual(metalsmith.menu, [{
      permalink: 'foo',
      content: 'foo',
      description: 'foo'
    }])
  })
})
