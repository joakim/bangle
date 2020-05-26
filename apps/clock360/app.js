const storage = require('Storage')

const settings = storage.readJSON('clock360.json', 1) || {
  timezone: 0,
  hours: 0,
  offset: 270,
  menuButton: 22,
}

const timezone = (storage.readJSON('setting.json', 1) || {}).timezone || 0

setWatch(Bangle.showLauncher, settings.menuButton, {
  repeat: false,
  edge: 'falling',
})

const screen = {
  width: g.getWidth(),
  height: g.getWidth(),
  middle: g.getWidth() / 2,
  center: g.getHeight() / 2,
}

const colors = {
  outline: '#333333',
  ticks: '#ff9500',
  degrees: '#00aaff',
  highlight: '#fafafa',
}

// Circular areas from the center outwards (in subtractions)
// 40 = inner circle
// 35 = ticks
// 18 = degrees
const areas = new Array(40, 35, 18)

let timer
let midnight = 0
let degrees = -1
let ticks = -1

let zeroPad = function (str, len) {
  return String('0'.repeat(len - 1) + str).slice(-len)
}

let getArcXY = function (centerX, centerY, radius, angle) {
  let s
  let r = []
  s = (2 * Math.PI * angle) / 360
  r.push(centerX + Math.round(Math.cos(s) * radius))
  r.push(centerY + Math.round(Math.sin(s) * radius))
  return r
}

let drawDegree = function (degree, color) {
  rad = screen.height / 2 - 20
  r1 = getArcXY(screen.middle, screen.center, rad, degree - settings.offset)
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    degree - settings.offset
  )
  g.setColor(color).drawLine(r1[0], r1[1], r2[0], r2[1])
}

let drawTick = function (tick, color) {
  rad = screen.height / 2 - 37
  r1 = getArcXY(
    screen.middle,
    screen.center,
    rad,
    tick * (360 / 100) - settings.offset
  )
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    tick * (360 / 100) - settings.offset
  )
  g.setColor(color).drawLine(r1[0], r1[1], r2[0], r2[1])
}

let drawOutlines = function (area) {
  g.setColor(colors.outline)

  // Reset ticks band
  if (area > 0) {
    g.drawCircle(
      screen.middle,
      screen.center,
      screen.height / 2 - areas[1] - 2 - 10 - 4
    )

    // Draw tick markers
    drawTick(0, colors.outline)
    drawTick(25, colors.outline)
    drawTick(50, colors.outline)
    drawTick(75, colors.outline)
  }

  // Reset degrees band
  if (area > 1) {
    g.drawCircle(
      screen.middle,
      screen.center,
      screen.height / 2 - areas[2] - 2 - 10 - 4
    )
    g.drawCircle(screen.middle, screen.center, screen.height / 2 - areas[2] + 2)

    // Draw hour markers
    if (settings.hours) {
      let degrees = 360 / settings.hours
      for (let i = 0; i < 360; i += degrees) {
        drawDegree(i, colors.outline)
      }
    }
  }
}

let resetArea = function (area) {
  g.setColor('#000000').fillCircle(
    screen.middle,
    screen.center,
    screen.height / 2 - areas[area]
  )

  drawOutlines(area)
}

let newDay = function () {
  // Update the timestamp for midnight, first converting to UTC (in minutes)
  // before applying the current 360 timezone (in seconds)
  midnight = new Date().setHours(
    0,
    -(timezone * 60),
    settings.timezone * 240,
    0
  )
}

let get360Time = function (date) {
  // Divide conventional time into 360 degrees of 240 seconds each, then reduce
  // the resulting value to an object with properties "degrees" and "ticks"
  let time = ((date.getTime() - midnight) / 240000)
    .toFixed(2) // Ignore milliticks
    .split('.') // Get the two parts (degrees and ticks)
    .reduce((obj, value, i) => {
      obj[['degrees', 'ticks'][i]] = parseInt(value)
      return obj
    }, {})

  // Calculate hours
  if (settings.hours) {
    let length = 360 / settings.hours
    let hour = time.degrees / length
    time.hour = Math.floor(hour)
    time.minute = (hour - time.hour) * length
  }

  return time
}

let drawClock = function () {
  let now = new Date()

  let time = get360Time(now)

  // Reset ticks + degrees when it's a new day, ticks when it's a new degree
  if (time.degrees < degrees) {
    newDay()
    resetArea(2)
    ticks = -1
    degrees = -1
  } else if (degrees > -1 && (time.degrees > degrees || time.ticks < ticks)) {
    resetArea(1)
    ticks = -1
  }

  // Update degrees number
  if (time.degrees > degrees) {
    g.setColor('#000000')
      .fillRect(73, 80, 168, 125)
      .setColor(colors.degrees)
      .setFont('Vector', 45)
      .setFontAlign(0, 0)
      .drawString(
        settings.hours ? time.hour : zeroPad(time.degrees, 3),
        screen.center,
        screen.middle - 20
      )
  }

  // Update ticks number
  if (time.ticks > ticks) {
    g.setColor('#000000')
      .fillRect(71, 135, 170, 165)
      .setColor(colors.ticks)
      .setFont('Vector', 25)
      .setFontAlign(0, 0)
      .drawString(
        (settings.hours ? `${zeroPad(time.minute, 2)}.` : '') +
          zeroPad(time.ticks, 2),
        screen.center,
        screen.middle + 30
      )
  }

  // Render new degree(s)
  if (time.degrees > degrees) {
    for (i = degrees + 1; i <= time.degrees; i++) {
      drawDegree(
        i,
        i % (360 / (settings.hours || 1)) ? colors.degrees : colors.highlight
      )
    }

    degrees = time.degrees
  }

  // Render new tick(s)
  if (time.ticks > ticks) {
    for (i = ticks + 1; i <= time.ticks; i++) {
      drawTick(i, (i / 25) % 1 ? colors.ticks : colors.highlight)
    }

    ticks = time.ticks
  }
}

let startClock = function () {
  newDay()

  // Calibrate timer by calculating milliseconds until next tick
  let now = new Date()
  let degree = (now.getTime() - midnight) / 240000
  let tick = (degree - Math.floor(degree)) * 100
  let nextTick = (tick - Math.floor(tick)) * 2400

  // Start interval timer at the next tick
  setTimeout(() => {
    timer = setInterval(drawClock, 2400)
  }, Math.max(0, 2400 - nextTick))

  // Draw clock immediately
  drawClock()
}

let stopClock = function () {
  clearInterval(timer)
}

Bangle.on('lcdPower', (on) => (on ? startClock() : stopClock()))

// Clean app screen
g.clear()
Bangle.loadWidgets()
Bangle.drawWidgets()

// Draw clock
drawOutlines(2)
startClock()
