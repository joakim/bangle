// Show launcher on BTN2 long-press
setWatch(
  (e) => {
    let duration = e.time - e.lastTime
    if (duration >= 0.15) Bangle.showLauncher()
  },
  BTN2,
  { repeat: false, edge: 'falling' }
)

const storage = require('Storage')
const calendar = require('calendar.js')

let now = new Date()
let date = calendar.convert(now)
let day = 'XABCDX'[date.quarter] + date.dayOfQuarter

// Write to display
g.clear()
  .setFont('Vector', 50)
  .drawString(day, 64, 64 + 25)

// Save to storage for use by widget
let settings = storage.readJSON('calendar360.json', 1) || {}
settings.today = day
storage.writeJSON('calendar360.json', settings)
