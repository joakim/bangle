;(() => {
  const util = require('cal360.util.js')

  // More RAM and CPU efficient calendar calculation using a lookup table
  const YEAR_12020 = 15846624
  const YEAR_TABLE = new Uint32Array([
    3156192, // 12030
    2839968, // 12029
    2524608, // 12028
    2209248, // 12027
    1893888, // 12026
    1577664, // 12025
    1262304, // 12024
    946944, // 12023
    631584, // 12022
    315360, // 12021
    0, // 12020
  ])

  let timer
  let size = 18

  function date360(ts) {
    let yearIndex = YEAR_TABLE.findIndex((newyear) => {
      return ts > (YEAR_12020 + newyear) * 100000
    })

    return yearIndex > -1
      ? util.expand({
          year: 2030 - yearIndex + 10000,
          dayOfYear: Math.ceil(
            (ts - (YEAR_12020 + YEAR_TABLE[yearIndex]) * 100000) / 86400000
          ),
        })
      : {}
  }

  function startTimer() {
    let now = Date.now()
    // todo Adjust for 360 timezone
    let midnight = new Date(now).setHours(24, 0, 0, 0)

    // Redraw at midnight
    timer = setTimeout(() => {
      draw(WIDGETS['cal360qrt'], midnight)
      draw(WIDGETS['cal360oct'], midnight)
    }, midnight - now)

    // Draw now
    draw(WIDGETS['cal360qrt'], now)
    draw(WIDGETS['cal360oct'], now)
  }

  function draw(widget, ts) {
    let date = date360(ts || Date.now())

    g.reset()
      .setFont('Vector', size)
      .setFontAlign(0, 0)
      .setColor('#00aaff')
      .drawString(
        date.year ? widget.format(date) : '...',
        this.x + widget.width / 2,
        this.y + size / 2
      )
  }

  Bangle.on('lcdPower', (on) => {
    if (timer) timer = clearTimeout(timer)
    if (on) startTimer()
  })

  WIDGETS['cal360oct'] = {
    area: 'bl',
    width: 30,
    draw: draw,
    format: (date) => `${date.dayOfOctant}/${date.octant}`,
  }

  WIDGETS['cal360qrt'] = {
    area: 'br',
    width: 25,
    draw: draw,
    format: (date) => `${'XABCD'[date.quarter]}${date.dayOfQuarter}`,
  }
})()
