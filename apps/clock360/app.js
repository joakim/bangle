const locale = require('locale')
const settings = require('Storage').readJSON('clock360.json', 1) || {
  offset: -90,
  hours: false,
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

let timer
let midnight = 0
let degrees = -1
let ticks = -1

// Compensates for accumulated error due to inaccurate timer
let compensatedTimeout = function (now) {
  let counted = (degrees * 100 + ticks) * 2400
  let offset = now - midnight - counted
  let result = 2400 - Math.max(offset, 0)
  return result
}

let get360Time = function (date) {
  // Work with a copy so as not to mutate the orignal date object
  let d = new Date(date.valueOf())

  // Divide conventional time into 360 degrees of 240 seconds each,
  // then reduce the resulting value to an object with properties "degrees" and "ticks"
  let time = ((d.getTime() - d.setHours(0, 0, 0, 0)) / 240000)
    .toFixed(2) // Ignore milliticks
    .split('.') // Get the two parts (degrees and ticks)
    .reduce((obj, value, i) => {
      obj[['degrees', 'ticks'][i]] = parseInt(value)
      return obj
    }, {})

  if (settings.hours) {
    let hour = time.degrees / 15
    time.hour = Math.floor(hour)
    time.fifteenth = Math.floor((hour - time.hour) * 15)
  }

  return time
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
  rad = screen.height / 2 - 20
  r1 = getArcXY(screen.middle, screen.center, rad, sections - settings.offset)
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    sections - settings.offset
  )
  g.setColor((sections / 90) % 1 ? colors.degrees : colors.highlight).drawLine(
    r1[0],
    r1[1],
    r2[0],
    r2[1]
  )
}

let drawTick = function (sections) {
  rad = screen.height / 2 - 37
  r1 = getArcXY(
    screen.middle,
    screen.center,
    rad,
    sections * (360 / 100) - settings.offset
  )
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    sections * (360 / 100) - settings.offset
  )
  g.setColor((sections / 25) % 1 ? colors.ticks : colors.highlight).drawLine(
    r1[0],
    r1[1],
    r2[0],
    r2[1]
  )
}

let resetArea = function (area) {
  // 35 = ticks
  // 18 = degrees + ticks
  g.setColor('#000000')
    .fillCircle(screen.middle, screen.center, screen.height / 2 - area)
    .setColor('#333333')
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 37 - 10 - 4)
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 20 - 10 - 4)
}

let newDay = function () {
  // Update day variables
  midnight = new Date()
  midnight.setHours(0, 0, 0, 0)

  // Update calendar day fields
  g.setColor('#000000')
    .fillRect(15, screen.height - 14, screen.width - 50, screen.height)
    .setColor('#cccccc')
    .setFont('Vector', 12)
    .setFontAlign(-1, -1)
    .drawString(locale.dow(midnight), 15, screen.height - 13)
    .setFontAlign(0, -1)
    // Remove weekday and fix locale bug where it only supports %d (0-padded)
    .drawString(
      locale.date(midnight, 1),
      //locale.date(midnight).replace(/\w+ /, '').replace(/^0/, ''),
      screen.middle,
      screen.height - 13
    )
}

let newMinute = function () {
  // Hack: Adjust for DST (as long as it lasts)
  let now = new Date()
  now.setHours(now.getHours() + 1)

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
    .drawString(locale.time(now, 1), screen.width - 15, screen.height - 13)
}

let zeroPad = function (str, len) {
  return String('0'.repeat(len - 1) + str).slice(-len)
}

let drawClock = function () {
  let now = new Date()
  let time = get360Time(now)

  // Reset ticks + degrees when it's a new day, ticks only when it's a new degree
  if (time.degrees < degrees) {
    degrees = -1
    resetArea(18)
    newDay()
  } else if (time.degrees > degrees || time.ticks < ticks) {
    ticks = -1
    resetArea(35)
  }

  // Draw new degree(s)
  if (time.degrees > degrees) {
    let text = settings.hours
      ? `${zeroPad(time.hour, 2)}/${zeroPad(time.fifteenth, 2)}`
      : zeroPad(time.degrees, 3)

    g.setColor('#000000')
      .fillRect(73, 80, 168, 125)
      .setColor(colors.degrees)
      .setFont('Vector', settings.hours ? 35 : 45)
      .setFontAlign(0, 0)
      .drawString(text, screen.center, screen.middle - 20)

    for (i = degrees + 1; i <= time.degrees; i++) {
      drawDegree(i)
    }

    degrees = time.degrees
  }

  // Draw new tick(s)
  if (time.ticks > ticks) {
    for (i = ticks + 1; i <= time.ticks; i++) {
      drawTick(i)
    }

    ticks = time.ticks

    g.setColor('#000000')
      .fillRect(99, 135, 142, 167)
      .setColor(colors.ticks)
      .setFont('Vector', 30)
      .setFontAlign(0, 0)
      .drawString(zeroPad(ticks, 2), screen.center, screen.middle + 30)

    // Update 24 hour clock every minute (25 ticks)
    if (ticks % 25 === 0) {
      newMinute()
    }
  }

  // Run again on next tick
  timer = setTimeout(drawClock, compensatedTimeout(now))
}

Bangle.on('lcdPower', (on) => (on ? drawClock() : clearTimeout(timer)))

// Clean app screen
g.clear()
Bangle.loadWidgets()
Bangle.drawWidgets()

// Draw clock
newDay()
newMinute()
drawClock()
