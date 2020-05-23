;(function (back) {
  function updateSettings() {
    storage.write('clock360.json', settings)
  }

  function resetSettings() {
    settings = {
      timezone: 0,
      hours: 0,
      offset: 270,
      menuButton: 22,
    }
    updateSettings()
  }

  let settings = storage.readJSON('clock360.json', 1)
  if (!settings) resetSettings()

  let hours = [0, 4, 6, 8, 10, 12, 24]

  let offsets = []
  offsets[0] = 'E'
  offsets[90] = 'N'
  offsets[180] = 'W'
  offsets[270] = 'S'

  let buttons = [
    [24, 'BTN1'],
    [22, 'BTN2'],
    [23, 'BTN3'],
    [11, 'BTN4'],
    [16, 'BTN5'],
  ]

  let boolFormat = (v) => (v ? 'On' : 'Off')

  let menu = {
    '': { title: '360 Clock' },
    'Time Zone': {
      value: settings.timezone,
      min: 0,
      max: 359,
      step: 1,
      onchange: (v) => {
        settings.timezone = v || 0
        updateSettings()
      },
    },
    'Hours Per Day': {
      value: settings.hours,
      format: (v) => hours[v] || 0,
      onchange: (v) => {
        settings.hours = hours[v]
        updateSettings()
      },
    },
    'Starting Point': {
      value: settings.offset,
      min: 0,
      max: 270,
      step: 90,
      format: (v) => offsets[v],
      onchange: (v) => {
        settings.offset = v || 0
        updateSettings()
      },
    },
    'Menu Button': {
      value: 1 | buttons[settings.menuButton],
      min: 0,
      max: 4,
      format: (v) => buttons[v][1],
      onchange: (v) => {
        settings.menuButton = buttons[v][0]
        updateSettings()
      },
    },
    '< back': back,
  }

  E.showMenu(menu)
})
