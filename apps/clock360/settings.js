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

  let offsets = ['E', 'N', 'W', 'S']

  let buttons = [
    [24, 'BTN1'],
    [22, 'BTN2'],
    [23, 'BTN3'],
    [11, 'BTN4'],
    [16, 'BTN5'],
  ]

  let showSettingsMenu = function () {
    let menu = {
      '': { title: '360 Clock' },
      '< Back': back,
      'Time Zone': {
        value: 0 | settings.timezone,
        min: -180,
        max: 180,
        step: 1,
        format: (v) => (v > 0 ? '+' : '-') + `${v}°`,
        onchange: (v) => {
          settings.timezone = v || 0
          updateSettings()
        },
      },
      'Hours Per Day': {
        min: 0,
        max: 24,
        value: 0 | settings.hours,
        onchange: (v) => {
          // Skip divisons leaving a remainder
          if ((360 / v) % 1) {
            menu['Hours Per Day'].value = v += v > settings.hours ? 1 : -1
          }

          settings.hours = v || 0
          updateSettings()
        },
      },
      'Starting Point': {
        value: 0 | settings.offset,
        min: 0,
        max: 270,
        step: 90,
        format: (v) => offsets[v / 90],
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
      'Reset Settings': () => {
        E.showPrompt('Reset Settings?').then((v) => {
          if (v) {
            E.showMessage('Resetting')
            resetSettings()
          }
          setTimeout(showSettingsMenu, 50)
        })
      },
    }

    return E.showMenu(menu)
  }

  showSettingsMenu()
})
