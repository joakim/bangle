const calendar = require('calendar.js')

let now = new Date()
let date = calendar.convert(now)
let output = 'XABCDX'[date.quarter] + date.dayOfQuarter

g.drawString(output, this.x + width / 2, this.y + 10)
