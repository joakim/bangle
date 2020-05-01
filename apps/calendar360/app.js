const storage = require('Storage')
const calendar = require('calendar.js')

let now = new Date()
let date = calendar.convert(now)
let day = 'XABCD'[date.quarter] + date.dayOfQuarter

// Write to display
g.clear()
  .setFont('Vector', 50)
  .drawString(day, 64, 64 + 25)

// Save to storage for use by widget
let data = storage.readJSON('calendar360.json', 1) || { today: '…' }
data.date = date
data.today = day
storage.writeJSON('calendar360.json', data)
