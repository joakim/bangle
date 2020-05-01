setWatch(
  (e) => {
    let duration = e.time - e.lastTime
    if (duration >= 0.15) Bangle.showLauncher()
  },
  BTN2,
  { repeat: false, edge: 'falling' }
)

const calendar = require('calendar.js')

let now = new Date()
let date = calendar.convert(now)
let output = 'XABCDX'[date.quarter] + date.dayOfQuarter

g.setFont('Vector', 50)
g.drawString(output, 64, 64 + 25)
