;(function (back) {
  const util = require('clock360.util.js')

  function updateSettings() {
    storage.write('clock360.json', settings)
  }

  function resetSettings() {
    settings = util.defaults
    updateSettings()
  }

  let settings = storage.readJSON('clock360.json', 1)
  if (!settings) resetSettings()

  let origins = ['E', 'N', 'W', 'S']

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
        format: (v) => (v > 0 ? '+' + v : v) + '°',
        onchange: (v) => {
          settings.timezone = v || 0
          updateSettings()
        },
      },
      Hours: {
        min: 0,
        max: 24,
        value: 0 | settings.division,
        onchange: (v) => {
          // Skip divisions leaving a remainder
          while ((360 / v) % 1) {
            menu['Hours'].value = v = v + (v > settings.division ? 1 : -1)
          }

          settings.division = v || 0
          updateSettings()
        },
      },
      'Starting Point': {
        value: 0 | settings.origin,
        min: 0,
        max: 270,
        step: 90,
        format: (v) => origins[v / 90],
        onchange: (v) => {
          settings.origin = v || 0
          updateSettings()
        },
      },
      Digits: {
        value: settings.digits,
        format: (v) => (v ? 'On' : 'Off'),
        onchange: () => {
          settings.digits = !settings.digits
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
      'Find Location': () => {
        Bangle.setGPSPower(1)

        E.showPrompt('Waiting for GPS...', {
          title: 'Find Location',
          buttons: { Cancel: true },
        }).then(() => {
          Bangle.setGPSPower(0)
          showSettingsMenu()
        })

        Bangle.on('GPS', (fix) => {
          if (fix.lat && fix.lon) {
            settings.lat = fix.lat
            settings.lon = fix.lon
            settings.timezone = Math.floor(fix.lon)
            updateSettings()
            Bangle.setGPSPower(0)
            E.showMessage('Time Zone set')
            setTimeout(showSettingsMenu, 50)
          }
        })
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
