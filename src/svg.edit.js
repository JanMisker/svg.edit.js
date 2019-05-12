import { Element, Line, Rect, Point, extend, regex, on, off } from '@svgdotjs/svg.js'

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
      // this.controlPoints.forEach(p => this._createElementForControlPoint(p))
      this.sync()
      on(window, 'mousemove', this._movePoint)
      on(window, 'mouseup', this._endPointDrag)
    }
  }

  done (options) {
    if (this.editElements) {
      this.editElements.forEach(ele => {
        off(ele)
        ele.remove()
      })
    }
    this._dragEle = undefined
    off(window, 'mousemove', this._movePoint)
    off(window, 'mouseup', this._endPointDrag)
    this.el.forget('_editHandler')
  }

  sync (options) {
    options = options || {}
    if (this.editElements) {
      if (!options.noRefresh) {
        this.controlPoints = this.el.controlPoints()
      }
      this.controlPoints.forEach((p, i) => {
        if (this.editElements[i]) {
          this.editElements[i].center(p.x, p.y)
        }
      })
      if (this.controlPoints.length < this.editElements.length) {
        this.editElements.splice(this.controlPoints.length).forEach(ele => {
          ele.remove()
        })
      }
      if (this.editElements.length < this.controlPoints.length) {
        // add elements
        this.controlPoints.slice(this.editElements.length).forEach(p => this._createElementForControlPoint(p)
        )
      }
    }
  }

  toggle (options) {
    if (this.controlPoints) {
      this.done(options)
    } else {
      this.start(options)
    }
  }

  _createElementForControlPoint (p) {
    var ele = this.parent.circle().center(p.x, p.y).size(10).fill('#ffffffee').stroke('#888888ff').addClass('SVG-Edit-Handle')
    on(ele, 'mousedown', (evt) => {
      this._dragEle = evt.currentTarget.instance
      evt.preventDefault()
      evt.stopPropagation()
    })
    this.editElements.push(ele)
  }

  _movePoint (evt) {
    if (!this._dragEle || !this.editElements) {
      return
    }
    evt.preventDefault()
    evt.stopPropagation()
    var idx = this.editElements.indexOf(this._dragEle)
    if (idx >= 0 && this.controlPoints[idx]) {
      this.controlPoints[idx].x = evt.offsetX
      this.controlPoints[idx].y = evt.offsetY
      this.controlPoints = this.el.controlPoints(this.controlPoints, idx)
      this.sync({ noRefresh: true })
      // this.controlPoints.forEach((p, i) => {
      //   if (this.editElements[i]) {
      //     this.editElements[i].center(p.x, p.y)
      //   }
      // })
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

extend(Line, {
  controlPoints: function (points, changedIdx) {
    let a = this.attr()
    if (points && points.length === 2) {
      this.plot(points[0].x, points[0].y, points[1].x, points[1].y)
    }
    return [new Point(a.x1, a.y1), new Point(a.x2, a.y2)]
  }
})

extend(Rect, {
  controlPoints: function (points, changedIdx) {
    let a = this.attr()
    if (points && points.length === 2) {
      let width = points[1].x - points[0].x
      let height = points[1].y - points[0].y
      let x = points[0].x
      let y = points[0].y
      if (width < 0) {
        x = points[1].x
        width = -width
      }
      if (height < 0) {
        y = points[1].y
        height = -height
      }
      this.move(x, y).size(width, height)
      return [points[0], points[1]]
    }
    return [new Point(a.x, a.y), new Point(a.x + a.width, a.y + a.height)]
  }
})
