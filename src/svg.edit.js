import { Element, extend, regex } from '@svgdotjs/svg.js'

let editPlugins = {}

// Our Object which manages editing
class EditHandler {

}

export function registerPlugin (name, obj) {
  var plugins = {}
  if (typeof name === 'string') {
    plugins[name] = obj
  } else {
    plugins = name
  }

  for (var shapes in plugins) {
    var shapesArr = shapes.trim().split(regex.delimiter)

    for (var i in shapesArr) {
      editPlugins[shapesArr[i]] = plugins[shapes]
    }
  }
}

extend(Element, {
  // Draw element with mouse
  draw (event, options, value) {

    // sort the parameters
    if (!(event instanceof window.Event || typeof event === 'string')) {
      options = event
      event = null
    }

    // get the old Handler or create a new one from event and options
    var editHandler = this.remember('_editHandler') || new EditHandler(this, event, options || {})

    // When we got an event we have to start/continue drawing
    if (event instanceof window.Event) {
      editHandler['start'](event)
    }

    // if event is located in our editHandler we handle it as method
    if (editHandler[event]) {
      editHandler[event](options, value)
    }

    return this
  }

})
