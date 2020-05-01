(() => {
  var width = 25

  function draw() {
    var now = new Date()
    var date = joakim_from_gregorian([
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    ])

    var output = 'XABCDX'[date.quarter] + date.dayOfQuarter

    g.reset()
    g.setFont('Vector', 20)
    g.setFontAlign(0, 0)
    g.drawString(output, this.x + width / 2, this.y + 10)
  }

  setInterval(function() {
    WIDGETS['calendar360'].draw(WIDGETS['calendar360'])
  }, 60 * 60 * 1000)

  WIDGETS["calendar360"] = {
    area: 'tl',
    width: width,
    draw: draw
  }
})()
