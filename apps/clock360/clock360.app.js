// Show launcher when middle button pressed
setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: 'falling' })

var degrees = -1
var ticks = -1
var midnight = new Date().setHours(0, 0, 0, 0)

// Compensates for accumulated error due to inaccurate timer
const compensatedTimeout = function (now) {
  var counted = (degrees * 100 + ticks) * 2400
  var offset = now - midnight - counted
  var result = 2400 - Math.max(offset, 0)
  console.log(result)
  return result
}

const screen = {
  width: g.getWidth(),
  height: g.getWidth(),
  middle: g.getWidth() / 2,
  center: g.getHeight() / 2,
}

const settings = {
  colors: {
    ticks: '#ff9500',
    degrees: '#00aaff',
    highlight: '#eeeeee',
  },
}

const get360Time = function (date) {
  // Work with a copy so as not to mutate the orignal date object
  var d = new Date(date.valueOf())

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

const getArcXY = function (centerX, centerY, radius, angle) {
  var s
  var r = []
  s = (2 * Math.PI * angle) / 360
  r.push(centerX + Math.round(Math.cos(s) * radius))
  r.push(centerY + Math.round(Math.sin(s) * radius))
  return r
}

const drawDegree = function (sections) {
  rad = screen.height / 2 - 20
  r1 = getArcXY(screen.middle, screen.center, rad, sections - 90)
  r2 = getArcXY(screen.middle, screen.center, rad - 10, sections - 90)
  //g.setPixel(r1[0],r1[1])
  g.setColor(
    (sections / 90) % 1 ? settings.colors.degrees : settings.colors.highlight
  ).drawRect(r1[0], r1[1], r2[0], r2[1])
}

const drawTick = function (sections) {
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

const drawOutlines = function () {
  g.setColor('#333333')
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 37 - 10 - 4)
    .drawCircle(screen.middle, screen.center, screen.height / 2 - 20 - 10 - 4)
}

const writeDegree = function (degrees) {
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

const writeTick = function (ticks) {
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

const drawClock = function () {
  var now = new Date()
  var time = get360Time(now)

  if (time.ticks != ticks) {
    // If it's a new degree, reset ticks count and circles
    if (ticks > time.ticks) {
      ticks = -1

      g.setColor('#000000').fillCircle(
        screen.middle,
        screen.center,
        screen.height / 2 - (time.degrees === 0 ? 20 : 35)
      )

      drawOutlines()
    }

    // Add new degree(s)
    if (time.degrees != degrees) {
      // If it's a new day, reset degrees count and update midnight mark
      if (degrees > time.degrees) {
        degrees = -1
        midnight = new Date().setHours(0, 0, 0, 0)
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
  }

  // Run again on next tick
  setTimeout(drawClock, compensatedTimeout(now))
}

Bangle.on('lcdPower', function (on) {
  if (on) drawClock()
})

// Clean app screen
g.clear().setFontAlign(0, 0, 0)
Bangle.loadWidgets()
Bangle.drawWidgets()

// Draw clock now
drawOutlines()
drawClock()
