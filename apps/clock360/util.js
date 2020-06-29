const storage = require('Storage')

exports.defaults = {
  timezone: 0,
  division: 0,
  origin: 270,
  digits: true,
  lat: 0,
  lon: 0,
  menuButton: 22,
}

exports.settings = storage.readJSON('clock360.json', 1) || exports.defaults

exports.systemSettings = storage.readJSON('setting.json', 1) || {
  timezone: 0,
  log: 0,
}

exports.getMidnight = (now) => {
  let midnight = new Date(now).setHours(
    0, // In the midnight hour
    systemSettings.timezone * 60, // 24-hour timezone (in minutes)
    -(settings.timezone * 240), // 360-degree timezone (in seconds)
    0
  )

  // Correct the date if it's off by one calendar day
  if (now - midnight > 86400000) {
    midnight += 86400000
  } else if (now - midnight < 0) {
    midnight -= 86400000
  }

  return midnight
}
