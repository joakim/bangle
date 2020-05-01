setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: 'falling' })

const locale = require('locale')

let midnight = 0
let degrees = -1
let ticks = -1
let minutes = -1

let screen = {
  width: g.getWidth(),
  height: g.getWidth(),
  middle: g.getWidth() / 2,
  center: g.getHeight() / 2,
}

let settings = {
  colors: {
    ticks: '#ff9500',
    degrees: '#00aaff',
    highlight: '#fafafa',
  },
}

let get360Time = function (date) {
  // Work with a copy so as not to mutate the orignal date object
  let d = new Date(date.valueOf())

  // Divide conventional time into 360 degrees of 240 seconds each and
  // reduce the value to an object with properties "degrees" and "ticks"
  return ((d.getTime() - d.setHours(0, 0, 0, 0)) / 240000)
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
  rad = screen.height / 2 - 20
  r1 = getArcXY(screen.middle, screen.center, rad, sections - 90)
  r2 = getArcXY(screen.middle, screen.center, rad - 10, sections - 90)
  //g.setPixel(r1[0],r1[1])
  g.setColor(
    (sections / 90) % 1 ? settings.colors.degrees : settings.colors.highlight
  ).drawLine(r1[0], r1[1], r2[0], r2[1])
}

let drawTick = function (sections) {
  rad = screen.height / 2 - 37
  r1 = getArcXY(screen.middle, screen.center, rad, sections * (360 / 100) - 90)
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    sections * (360 / 100) - 90
  )
  g.setColor(
    (sections / 25) % 1 ? settings.colors.ticks : settings.colors.highlight
  ).drawLine(r1[0], r1[1], r2[0], r2[1])
}

let drawOutlines = function () {
  g.setColor('#333333')
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 37 - 10 - 4)
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 20 - 10 - 4)
}

let writeDegree = function (degrees) {
  g.setColor('#000000')
    .fillRect(73, 83, 168, 126)
    .setColor(settings.colors.degrees)
    .setFont('Vector', 45)
    .drawString(
      String('00' + degrees).slice(-3),
      screen.center - 48,
      screen.middle - 40
    )
}

let writeTick = function (ticks) {
  g.setColor('#000000')
    .fillRect(97, 137, 140, 166)
    .setColor(settings.colors.ticks)
    .setFont('Vector', 30)
    .drawString(
      String('0' + ticks).slice(-2),
      screen.center - 23,
      screen.middle + 15
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
      if (isDST(localtime)) localtime.setHours(localtime.getHours() + 1)

      g.setColor('#000000')
        .fillRect(
          screen.width - 50,
          screen.height - 14,
          screen.width,
          screen.height
        )
        .setColor('#fafafa')
        .setFont('Vector', 10)
        .drawString(
          locale.time(localtime, 1),
          screen.width - 45,
          screen.height - 13
        )
    }
  }

  // Run again on next tick
  setTimeout(drawClock, compensatedTimeout(now))
}

// Compensates for accumulated error due to inaccurate timer
let compensatedTimeout = function (now) {
  let counted = (degrees * 100 + ticks) * 2400
  let offset = now - midnight - counted
  let result = 2400 - Math.max(offset, 0)
  return result
}

let isDST = function (date) {
  let jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset()
  let jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset()
  return Math.max(jan, jul) != date.getTimezoneOffset()
}

let newDay = function () {
  let now = new Date()

  // Update day variables
  midnight = now.setHours(0, 0, 0, 0)

  // Update calendar day fields
  g.setColor('#000000')
    .fillRect(15, screen.height - 14, screen.width - 50, screen.height)
    .setColor('#fafafa')
    .setFont('Vector', 10)
    .drawString(
      locale.date(now).replace(/ 0/, ' '), // Fix locale bug where it only supports %d (0-padded)
      15,
      screen.height - 13
    )
}

Bangle.on('lcdPower', function (on) {
  if (on) drawClock()
})

// Clean app screen
g.clear(true)
Bangle.loadWidgets()
Bangle.drawWidgets()

// Draw clock now
newDay()
drawOutlines()
drawClock()
