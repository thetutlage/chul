/*
|--------------------------------------------------------------------------
| Events names
|--------------------------------------------------------------------------
|
|  content:menu:saved
|  content:files:processed
|  content:file:ignore
|  pages:files:processed
|  watcher
|
*/
const EventEmitter = require('events')
module.exports = new EventEmitter()
