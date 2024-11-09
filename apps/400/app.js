const storage = require('Storage');

const settings = storage.readJSON('clock400.json', 1) || {
  timezone: 0,
  division: 0,
  origin: 300,
  digits: true,
  lat: 0,
  lon: 0,
  menuButton: 22,
};

const systemSettings = storage.readJSON('setting.json', 1) || {
  timezone: 0,
  log: 0,
};

function zeroPad(str, len) {
  return String(str).padStart('0', len);
}

function getMidnight(now) {
  let midnight = new Date(now).setHours(
    0, // In the midnight hour
    systemSettings.timezone * 60, // 24-hour timezone (in minutes)
    -(settings.timezone * 216), // 400-degree timezone (in seconds)
    0
  );

  // Correct the date if it's off by one calendar day
  if (now - midnight > 86400000) {
    midnight += 86400000;
  } else if (now - midnight < 0) {
    midnight -= 86400000;
  }

  return midnight;
}


setWatch(Bangle.showLauncher, settings.menuButton, {
  repeat: false,
  edge: 'falling',
});

const screen = {
  width: g.getWidth(),
  height: g.getHeight(),
  middle: g.getWidth() / 2,
  center: g.getHeight() / 2,
};

const colors = {
  outline: '#333333',
  major: '#00aaff',
  minor: '#ff9500',
  highlight: '#fafafa',
};

// Circular areas from the center outwards (in subtractions)
// 40 = inner circle
// 35 = ticks
// 18 = degrees
const areas = new Array(40, 35, 18);

let timer;
let midnight = 0;
let degrees = -1;
let ticks = -1;
let division = -1;

function getArcXY(centerX, centerY, radius, angle) {
  let s;
  let r = [];
  s = (2 * Math.PI * angle) / 400;
  r.push(centerX + Math.round(Math.cos(s) * radius));
  r.push(centerY + Math.round(Math.sin(s) * radius));
  return r;
}

function drawMajor(degree, color) {
  rad = screen.height / 2 - 20;
  r1 = getArcXY(
    screen.middle,
    screen.center,
    rad,
    degree - settings.origin
  );
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    degree - settings.origin
  );
  g.setColor(color).drawLineAA(r1[0], r1[1], r2[0], r2[1]);
}

function drawMinor(tick, color) {
  rad = screen.height / 2 - 37;
  r1 = getArcXY(
    screen.middle,
    screen.center,
    rad,
    tick * (400 / 100) - settings.origin
  );
  r2 = getArcXY(
    screen.middle,
    screen.center,
    rad - 10,
    tick * (400 / 100) - settings.origin
  );
  g.setColor(color).drawLineAA(r1[0], r1[1], r2[0], r2[1]);
}

function writeMajor(text) {
  g.setColor('#000000')
    .fillRect(73, 80, 168, 125)
    .setColor(colors.major)
    .setFont('Vector', 45)
    .setFontAlign(0, 0)
    .drawString(text, screen.center, screen.middle - 20);
}

function writeMinor(text) {
  g.setColor('#000000')
    .fillRect(71, 135, 170, 165)
    .setColor(colors.minor)
    .setFont('Vector', 25)
    .setFontAlign(0, 0)
    .drawString(text, screen.center, screen.middle + 30);
}

function drawOutlines(area) {
  g.setColor(colors.outline);

  // Reset minor band
  if (area > 0) {
    g.drawCircle(
      screen.middle,
      screen.center,
      screen.height / 2 - areas[1] - 2 - 10 - 4
    );

    // Draw minor markers
    drawMinor(0, colors.outline);
    drawMinor(25, colors.outline);
    drawMinor(50, colors.outline);
    drawMinor(75, colors.outline);
  }

  // Reset major band
  if (area > 1) {
    g.drawCircle(
      screen.middle,
      screen.center,
      screen.height / 2 - areas[2] - 2 - 10 - 4
    ).drawCircle(screen.middle, screen.center, screen.height / 2 - areas[2] + 2);

    // Draw major markers
    if (settings.division) {
      let degrees = 400 / settings.division;
      for (let i = 0; i < 400; i += degrees) {
        drawMajor(i, colors.outline);
      }
    }
  }
}

function drawClock() {
  let timestamp = Date.now();
  let time = getTime400(timestamp);

  // if (systemSettings.log) {
  //   let calculated = midnight + (time.degrees * 216000 + time.ticks * 2160)
  //   let diff = parseInt(timestamp - calculated)
  //   g.setColor('#000000')
  //     .fillRect(0, screen.height - 15, screen.width, screen.height)
  //     .setColor('#ffffff')
  //     .setFont('4x6', 2)
  //     .drawString(
  //       diff > -1 ? '+' + diff : diff,
  //       screen.middle,
  //       screen.height - 7
  //     )
  // }
  // Reset major + minor when it's a new day, only minor when it's a new major
  if ((settings.division && time.division < division) ||
    time.degrees < degrees) {
    newDay();
    resetArea(2);
    ticks = -1;
    degrees = -1;
    division = -1;
  } else if (degrees > -1 && (time.degrees > degrees || time.ticks < ticks)) {
    resetArea(1);
    ticks = -1;
  }

  if (settings.digits) {
    // Update major number
    if ((settings.division && time.division < division) ||
      time.degrees > degrees) {
      writeMajor(
        settings.division ? time.division : zeroPad(time.degrees, 3)
      );
    }

    // Update minor number
    if (time.ticks > ticks) {
      writeMinor(
        (settings.division ? `${zeroPad(time.minutes, 2)}.` : '') +
        zeroPad(time.ticks, 2)
      );
    }
  }

  // Draw major bars
  if (time.degrees > degrees) {
    for (i = degrees + 1; i <= time.degrees; i++) {
      drawMajor(
        i,
        i % (400 / (settings.division || 1))
          ? colors.major
          : colors.highlight
      );
    }

    degrees = time.degrees;
  }

  // Draw minor bars
  if (time.ticks > ticks) {
    for (i = ticks + 1; i <= time.ticks; i++) {
      drawMinor(i, (i / 25) % 1 ? colors.minor : colors.highlight);
    }

    ticks = time.ticks;
  }
}

function resetArea(area) {
  g.setColor('#000000').fillCircle(
    screen.middle,
    screen.center,
    screen.height / 2 - areas[area]
  );

  drawOutlines(area);
}

function newDay() {
  midnight = getMidnight(Date.now());
}

function getTime400(now) {
  // Divide 24-hour time into 400 gradians of 216 seconds each, then reduce
  // the resulting value to an object with properties "degrees" and "ticks"
  let time = ((now - midnight) / 216000)
    .toFixed(2) // Ignore milliticks
    .split('.') // Get the two parts (degrees and ticks)
    .reduce((obj, value, i) => {
      obj[['degrees', 'ticks'][i]] = parseInt(value);
      return obj;
    }, {});

  // Calculate division
  if (settings.division) {
    let length = 400 / settings.division;
    let part = time.degrees / length;
    time.division = Math.floor(part);
    time.minutes = (part - time.division) * length;
  }

  return time;
}

function startClock() {
  newDay();

  // Calibrate timer by calculating milliseconds until next tick
  let major = (Date.now() - midnight) / (2160 * 100);
  let minor = (major - Math.floor(major)) * 100;
  let nextTick = Math.max(0, 2160 - (minor - Math.floor(minor)) * 2160);

  setTimeout(() => {
    timer = setInterval(drawClock, 2160);
  }, nextTick);

  drawClock();
}

function stopClock() {
  if (timer) clearInterval(timer);
}

Bangle.on('lcdPower', (on) => (on ? startClock() : stopClock()));

// Clean app screen
g.clear();
Bangle.loadWidgets();
Bangle.drawWidgets();

drawOutlines(2);
startClock();
