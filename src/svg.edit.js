import { Element, extend, regex, on, off } from '@svgdotjs/svg.js'

let editPlugins = {}

// Our Object which manages editing
class EditHandler {

  constructor (el, action, options) {
    this.el = el
    el.remember('_editHandler', this)
    this.parent = el.parent()
    this._movePoint = this._movePoint.bind(this)
    this._endPointDrag = this._endPointDrag.bind(this)
  }

  start (options) {
    if (this.controlPoints) {
      // already started, return
      return
    }
    if (this.el.controlPoints) {
      this.controlPoints = this.el.controlPoints()
      // create an element for each point, attach mouse drag to them
      this.editElements = []
      this.controlPoints.forEach(p => {
        var ele = this.parent.circle().center(p.x, p.y).size(10).fill('#ffffffee').stroke('#888888ff')
        on(ele, 'mousedown', (evt) => {
          this._dragEle = evt.currentTarget.instance
          evt.preventDefault()
          evt.stopPropagation()
        })
        this.editElements.push(ele)
      })
      on(window, 'mousemove', this._movePoint)
      on(window, 'mouseup', this._endPointDrag)
    }
  }

  done (options) {
    this.editElements.forEach(ele => {
      off(ele)
      ele.remove()
    })
    this._dragEle = undefined
    off(window, 'mousemove', this._movePoint)
    off(window, 'mouseup', this._endPointDrag)
  }

  toggle (options) {
    if (this.controlPoints) {
      this.done(options)
    } else {
      this.start(options)
    }
  }

  _movePoint (evt) {
    if (!this._dragEle || !this.editElements) {
      return
    }
    evt.preventDefault()
    evt.stopPropagation()
    var idx = this.editElements.indexOf(this._dragEle)
    if (idx >= 0) {
      this.controlPoints[idx].x = evt.offsetX
      this.controlPoints[idx].y = evt.offsetY
      this.controlPoints = this.el.controlPoints(this.controlPoints, idx)
      this.controlPoints.forEach((p, i) => {
        this.editElements[i].center(p.x, p.y)
      })
    }
  }
  _endPointDrag (evt) {
    if (this._dragEle) {
      evt.preventDefault()
      evt.stopPropagation()
      this._dragEle = false
      return false
    }
  }

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
  edit (action, options, value) {

    // sort the parameters
    if (!(typeof action === 'string')) {
      options = action
      action = 'start'
    }

    // get the old Handler or create a new one from event and options
    var editHandler = this.remember('_editHandler') || new EditHandler(this, action, options || {})

    // if action is located in our editHandler we handle it as method
    if (editHandler[action]) {
      editHandler[action](options, value)
    }

    return this
  }

})
