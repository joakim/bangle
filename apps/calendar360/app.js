const calendar = require('calendar.js')

let now = new Date()
let date = calendar.convert(now)
let output = 'XABCDX'[date.quarter] + date.dayOfQuarter

g.setFont('Vector', 50)
g.setFontAlign(0, 0)
g.drawString(output, g.getWidth(), g.getHeight())
