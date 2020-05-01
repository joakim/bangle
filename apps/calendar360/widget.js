;(() => {
  const storage = require('Storage')

  let width = 25

  function redraw() {
    WIDGETS['calendar360'].draw(WIDGETS['calendar360'])
  }

  function draw() {
    let settings = storage.readJSON('calendar360.json', 1) || { today: '...' }

    g.reset()
    g.setFont('Vector', 20)
    g.setFontAlign(0, 0)
    g.drawString(settings.today, this.x + width / 2, this.y + 10)

    // Redraw every 10 minutes
    setInterval(redraw, 10 * 60 * 1000)

    // and why not next midnight
    let tomorrow = new Date()
    tomorrow.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setTimeout(redraw, tomorrow - now)
  }

  WIDGETS['calendar360'] = {
    area: 'tl',
    width: width,
    draw: draw,
  }
})()
