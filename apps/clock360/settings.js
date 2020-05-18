;(function (back) {
  function updateSettings() {
    storage.write('clock360.json', settings)
  }

  function resetSettings() {
    settings = {
      sunTime: true,
      menuButton: 22,
    }
    updateSettings()
  }

  let settings = storage.readJSON('clock360.json', 1)
  if (!settings) resetSettings()

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
    'Sun time': {
      value: settings.sunTime,
      format: boolFormat,
      onchange: () => {
        settings.sunTime = !settings.sunTime
        updateSettings()
      },
    },
    'Menu button': {
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
