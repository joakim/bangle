const locale = require('locale')
const settings = require('Storage').readJSON('clock360.json', 1) || {
  sunTime: true,
  menuButton: 22,
}

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
  ticks: '#ff9500',
  degrees: '#00aaff',
  highlight: '#fafafa',
}

let midnight = 0
let degrees = -1
let ticks = -1
let minutes = -1

let get360Time = function (date) {
  // Work with a copy so as not to mutate the orignal date object
  let d = new Date(date.valueOf())

  // Divide conventional time into 360 degrees of 240 seconds each, offset
  // by 6 hours if the day starts around sunrise, then reduce the resulting
  // value to an object with properties "degrees" and "ticks"
  return (
    (d.getTime() - d.setHours(settings.sunTime ? 6 : 0, 0, 0, 0)) /
    240000
  )
    .toFixed(2) // Ignore milliticks
    .split('.') // Get the two parts (degrees and ticks)
    .reduce((obj, value, i) => {
      obj[['degrees', 'ticks'][i]] = parseInt(value)
      return obj
    }, {})
}

let getArcXY = function (centerX, centerY, radius, angle) {
  let s
  let r = []
  s = (2 * Math.PI * angle) / 360
  r.push(centerX + Math.round(Math.cos(s) * radius))
  r.push(centerY + Math.round(Math.sin(s) * radius))
  return r
}

let drawDegree = function (sections) {
  let offset = settings.sunTime ? 180 : 90
  rad = screen.height / 2 - 20
  r1 = getArcXY(screen.middle, screen.center, rad, sections - offset)
  r2 = getArcXY(screen.middle, screen.center, rad - 10, sections - offset)
  g.setColor((sections / 90) % 1 ? colors.degrees : colors.highlight).drawLine(
    r1[0],
    r1[1],
    r2[0],
    r2[1]
  )
}

let drawTick = function (sections) {
  let offset = settings.sunTime ? 180 : 90
  rad = screen.height / 2 - 37
  r1 = getArcXY(
    screen.middle,
    screen.center,
    rad,
    sections * (360 / 100) - offset
  )
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    sections * (360 / 100) - offset
  )
  g.setColor((sections / 25) % 1 ? colors.ticks : colors.highlight).drawLine(
    r1[0],
    r1[1],
    r2[0],
    r2[1]
  )
}

let drawOutlines = function () {
  g.setColor('#333333')
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 37 - 10 - 4)
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 20 - 10 - 4)
}

let writeDegree = function (degrees) {
  g.setColor('#000000')
    .fillRect(73, 80, 168, 125)
    .setColor(colors.degrees)
    .setFont('Vector', 45)
    .setFontAlign(0, 0)
    .drawString(
      String('00' + degrees).slice(-3),
      screen.center,
      screen.middle - 20
    )
}

let writeTick = function (ticks) {
  g.setColor('#000000')
    .fillRect(99, 135, 142, 167)
    .setColor(colors.ticks)
    .setFont('Vector', 30)
    .setFontAlign(0, 0)
    .drawString(
      String('0' + ticks).slice(-2),
      screen.center,
      screen.middle + 30
    )
}

let drawClock = function () {
  let now = new Date()
  let time = get360Time(now)

  if (time.ticks != ticks) {
    // If it's a new degree, reset ticks count and circles
    if (ticks > time.ticks) {
      ticks = -1

      g.setColor('#000000').fillCircle(
        screen.middle,
        screen.center,
        screen.height / 2 - (time.degrees === 0 ? 18 : 35)
      )

      drawOutlines()
    }

    // Add new degree(s)
    if (time.degrees != degrees) {
      // If it's a new day, reset degrees count and day variables
      if (degrees > time.degrees) {
        degrees = -1
        newDay()
      }

      for (i = degrees + 1; i <= time.degrees; i++) {
        drawDegree(i)
      }
    }

    // Add new tick(s)
    for (i = ticks + 1; i <= time.ticks; i++) {
      drawTick(i)
    }

    // Update counts
    degrees = time.degrees
    ticks = time.ticks

    writeDegree(degrees)
    writeTick(ticks)

    // Update 24 hour clock
    if (now.getMinutes() != minutes) {
      minutes = now.getMinutes()

      // Adjust local time for DST
      let localtime = new Date(now.valueOf())
      localtime.setHours(localtime.getHours() + 1)

      g.setColor('#000000')
        .fillRect(
          screen.width - 50,
          screen.height - 14,
          screen.width,
          screen.height
        )
        .setColor('#cccccc')
        .setFont('Vector', 12)
        .setFontAlign(1, -1)
        .drawString(
          locale.time(localtime, 1),
          screen.width - 15,
          screen.height - 13
        )
    }
  }

  // Run again on next tick
  timer = setTimeout(drawClock, compensatedTimeout(now))
}

// Compensates for accumulated error due to inaccurate timer
let compensatedTimeout = function (now) {
  let counted = (degrees * 100 + ticks) * 2400
  let offset = now - midnight - counted
  let result = 2400 - Math.max(offset, 0)
  return result
}

let newDay = function () {
  let now = new Date()

  // Update day variables
  midnight = now.setHours(0, 0, 0, 0)

  // Update calendar day fields
  g.setColor('#000000')
    .fillRect(15, screen.height - 14, screen.width - 50, screen.height)
    .setColor('#cccccc')
    .setFont('Vector', 12)
    .setFontAlign(-1, -1)
    .drawString(locale.dow(now), 15, screen.height - 13)
    .setFontAlign(0, -1)
    // Remove weekday and fix locale bug where it only supports %d (0-padded)
    .drawString(
      locale.date(now).replace(/\w+ /, '').replace(/^0/, ''),
      screen.middle,
      screen.height - 13
    )
}

Bangle.on('lcdPower', (on) => on && drawClock())

// Clean app screen
g.clear()
Bangle.loadWidgets()
Bangle.drawWidgets()

// Draw clock now
newDay()
drawOutlines()
drawClock()
