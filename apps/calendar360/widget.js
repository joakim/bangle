;(() => {
  const calendar = require('calendar.js')

  let width = 25

  function draw() {
    let now = new Date()
    let date = calendar.convert(now)
    let output = 'XABCDX'[date.quarter] + date.dayOfQuarter

    g.reset()
    g.setFont('Vector', 20)
    g.setFontAlign(0, 0)
    g.drawString(output, this.x + width / 2, this.y + 10)

    // Redraw next midnight
    let tomorrow = new Date()
    tomorrow.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setTimeout(function () {
      WIDGETS['calendar360'].draw(WIDGETS['calendar360'])
    }, tomorrow - now)
  }

  WIDGETS['calendar360'] = {
    area: 'tl',
    width: width,
    draw: draw,
  }
})()
