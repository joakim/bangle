{
  // var locale = require('locale')
  var degrees = -1
  var ticks = -1
  //var time24 = ""

  const screen = {
    width: g.getWidth(),
    height: g.getWidth(),
    middle: g.getWidth() / 2,
    center: g.getHeight() / 2,
  }

  // Settings
  const settings = {
    time: {
      offset: 60,
      color: '#f0af00',
      shadow: '#CF7500',
      font: 'Vector',
      size: 40,
      middle: screen.middle - 45,
      center: screen.center - 43,
    },
    date: {
      color: '#ffffff',
      shadow: '#CF7500',
      font: 'Vector',
      size: 10,
      middle: screen.height - 15, // at bottom of screen
    },
    circle: {
      colormin: '#00a8ff',
      colorsec: '#339900',
      width: 10,
      middle: screen.middle,
      center: screen.center,
      height: screen.height,
    },
  }

  const getTime = function (date) {
    var keys = ['degrees', 'ticks']

    // Work with a copy so as not to mutate the orignal date object
    var d = new Date(date.valueOf())

    return ((d.getTime() - d.setHours(0, 0, 0, 0)) / 240000)
      .toFixed(2)
      .split('.')
      .reduce((obj, value, i) => {
        obj[keys[i]] = parseInt(value)
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
    g.setColor((sections / 90) % 1 ? settings.circle.colormin : '#ffffff')
    rad = settings.circle.height / 2 - 20
    r1 = getArcXY(
      settings.circle.middle,
      settings.circle.center,
      rad,
      sections - 90
    )
    //g.setPixel(r[0],r[1]);
    r2 = getArcXY(
      settings.circle.middle,
      settings.circle.center,
      rad - settings.circle.width,
      sections - 90
    )
    //g.setPixel(r[0],r[1]);
    g.drawLine(r1[0], r1[1], r2[0], r2[1])
  }

  const drawTick = function (sections) {
    g.setColor((sections / 25) % 1 ? settings.circle.colorsec : '#ffffff')
    rad = settings.circle.height / 2 - 37
    r1 = getArcXY(
      settings.circle.middle,
      settings.circle.center,
      rad,
      sections * (360 / 100) - 90
    )
    //g.setPixel(r[0],r[1]);
    r2 = getArcXY(
      settings.circle.middle,
      settings.circle.center,
      rad - settings.circle.width,
      sections * (360 / 100) - 90
    )
    //g.setPixel(r[0],r[1]);
    g.drawLine(r1[0], r1[1], r2[0], r2[1])
  }

  const drawOutlines = function () {
    g.setColor('#333333')
    g.drawCircle(
      settings.circle.middle,
      settings.circle.center,
      settings.circle.height / 2 - 37 - settings.circle.width - 4
    )
    g.drawCircle(
      settings.circle.middle,
      settings.circle.center,
      settings.circle.height / 2 - 20 - settings.circle.width - 4
    )
  }

  const writeDegree = function (degrees) {
    g.setColor('#000000')
    g.fillRect(75, 80, 165, 122)
    g.setFont(settings.time.font, settings.time.size)
    g.setColor(settings.circle.colormin)
    g.drawString(degrees, settings.time.center, settings.time.middle)
  }

  const writeTick = function (ticks) {
    g.setColor('#000000')
    g.fillRect(
      settings.time.center + 10,
      settings.time.middle + 45,
      settings.time.center + 75,
      settings.time.middle + 90
    )
    g.setFont(settings.time.font, 30)
    g.setColor(settings.circle.colorsec)
    g.drawString(
      String('0' + ticks).slice(-2),
      settings.time.center + 22,
      settings.time.middle + 50
    )
  }

  const drawClock = function () {
    var now = new Date()
    var time = getTime(now)

    if (time.ticks != ticks) {
      // Empty the circles when ticks pass zero
      if (ticks > time.ticks) {
        ticks = -1

        g.setColor('#000000')
        g.fillCircle(
          settings.circle.middle,
          settings.circle.center,
          settings.circle.height / 2 - (time.degrees === 0 ? 20 : 35)
        )

        drawOutlines()
      }

      // Add new degree(s)
      if (time.degrees != degrees) {
        if (degrees > time.degrees) degrees = -1

        for (i = degrees + 1; i <= time.degrees; i++) {
          drawDegree(i)
        }
      }

      // Add new tick(s)
      for (i = ticks + 1; i <= time.ticks; i++) {
        drawTick(i)
      }

      degrees = time.degrees
      ticks = time.ticks

      writeDegree(degrees)
      writeTick(ticks)
    }

    //writeConventionalTime(now)
  }

  /*
  const writeConventionalTime = function (now) {
    var localTime = locale.time(now, 1)
    if (time24 !== localTime) {
      time24 = localTime

      // Reset
      g.setColor('#000000')
      g.fillRect(0, settings.date.middle, g.getWidth(), g.getHeight())

      // Draw
      g.setColor(settings.date.color)
      g.setFont(settings.date.font, settings.date.size)
      g.drawString(locale.date(now, 1), screen.center - 120, settings.date.middle)
      g.drawString(localTime, screen.center + 85, settings.date.middle)
    }
  }
*/

  Bangle.on('lcdPower', function (on) {
    if (on) drawClock()
  })

  // Clean app screen
  g.clear()
  g.setFontAlign(0, 0, 0)
  Bangle.loadWidgets()
  Bangle.drawWidgets()

  drawOutlines()
  setInterval(drawClock, 2400)

  // Draw clock now
  drawClock()

  // Show launcher when middle button pressed
  setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: 'falling' })
}
