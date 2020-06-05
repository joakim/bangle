;(() => {
  let size = 18
  let width = 30
  let timer

  const NEWYEAR_TABLE = [
    1900281600000, // 2030
    1868659200000, // 2029
    1837123200000, // 2028
    1805587200000, // 2027
    1774051200000, // 2026
    1742428800000, // 2025
    1710892800000, // 2024
    1679356800000, // 2023
    1647820800000, // 2022
    1616198400000, // 2021
    1584662400000, // 2020
  ]

  function date360(ts) {
    let yearIndex = NEWYEAR_TABLE.findIndex((newyear) => ts > newyear)
    let date = {
      year: 2030 - yearIndex,
      dayOfYear: Math.ceil((ts - NEWYEAR_TABLE[yearIndex]) / 86400000),
    }
    let quarter = Math.ceil(date.dayOfYear / 91)
    if (quarter < 5) {
      date.quarter = quarter
      date.dayOfQuarter = date.dayOfYear - (quarter - 1) * 91 - 1
      if (date.dayOfQuarter > 0) {
        date.dayOfCalendarYear = date.dayOfYear - date.quarter
        date.octant = (quarter - 1) * 2 + Math.ceil(date.dayOfQuarter / 45) || 1
        date.dayOfOctant = date.dayOfQuarter % 45 || 45
        date.nonad = Math.ceil(date.dayOfCalendarYear / 9)
        date.dayOfNonad = date.dayOfCalendarYear % 9 || 9
      }
    } else {
      date.quarter = 0
      date.transition = date.dayOfYear - 364
    }
    return date
  }

  function draw() {
    let now = new Date().getTime()
    let midnight = new Date(now).setHours(24, 0, 0, 0)

    // Redraw at midnight
    timer = setTimeout(() => {
      draw()
    }, midnight - now)

    let date = date360(now)

    g.reset()
      .setFont('Vector', size)
      .setFontAlign(0, 0)
      .setColor('#00aaff')
      .drawString(
        `${date.dayOfOctant}/${date.octant}`,
        this.x + width / 2,
        this.y + size / 2
      )
  }

  Bangle.on('lcdPower', (on) => {
    if (timer) timer = clearTimeout(timer)
    if (on) draw()
  })

  WIDGETS['calendar360'] = {
    area: 'tl',
    width: width,
    draw: draw,
  }

  if (Bangle.isLCDOn) draw()
})()
