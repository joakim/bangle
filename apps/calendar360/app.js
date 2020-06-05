function cos(deg) {
  return Math.cos((deg * Math.PI) / 180)
}

function getEquinox(year) {
  let Y = (year - 2000) / 1000
  // prettier-ignore
  let JDE0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Math.pow(Y, 2) - 0.00411 * Math.pow(Y, 3) - 0.00057 * Math.pow(Y, 4)
  let T = (JDE0 - 2451545.0) / 36525
  let W = 35999.373 * T - 2.47
  let dL = 1 + 0.0334 * cos(W) + 0.0007 * cos(2 * W)
  // prettier-ignore
  let A = new Array(485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8)
  // prettier-ignore
  let B = new Array(324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02, 247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45)
  // prettier-ignore
  let C = new Array(1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443, 65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226, 29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029, 31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074)
  let S = 0
  for (let i = 0; i < 24; i++) {
    S += A[i] * cos(B[i] + C[i] * T)
  }
  let JDE = JDE0 + (0.00001 * S) / dL

  let TDT = fromJDtoUTC(JDE)

  let fullYear = TDT.getFullYear()
  let t = (fullYear - 2000) / 100
  let deltaT = 102 + 102 * t + 25.3 * Math.pow(t, 2) + 0.37 * (fullYear - 2100)
  return new Date(TDT.getTime() - deltaT * 1000)
}

function fromJDtoUTC(JDE) {
  let A, alpha
  let Z = Math.floor(JDE + 0.5)
  let F = JDE + 0.5 - Z
  if (Z < 2299161) {
    A = Z
  } else {
    alpha = Math.floor((Z - 1867216.25) / 36524.25)
    A = Z + 1 + alpha - Math.floor(alpha / 4)
  }
  let B = A + 1524
  let C = Math.floor((B - 122.1) / 365.25)
  let D = Math.floor(365.25 * C)
  let E = Math.floor((B - D) / 30.6001)
  let DT = B - D - Math.floor(30.6001 * E) + F
  let Mon = E - (E < 13.5 ? 1 : 13)
  let Yr = C - (Mon > 2.5 ? 4716 : 4715)
  let Day = Math.floor(DT)
  let H = 24 * (DT - Day)
  let Hr = Math.floor(H)
  let M = 60 * (H - Hr)
  let Min = Math.floor(M)
  let Sec = Math.floor(60 * (M - Min))

  // todo UTC adjust
  let date = new Date(0)
  date.setFullYear(Yr, Mon - 1, Day)
  date.setHours(Hr, Min, Sec)
  return date
}

function date360(now) {
  let year = new Date(now).getFullYear()
  let newyear = getEquinox(year)
  if (now < newyear) {
    year = year - 1
    newyear = getEquinox(year)
  }

  let date = {
    year: year,
    dayOfYear: Math.ceil((now - newyear) / 86400000),
  }

  let quarter = Math.ceil(date.dayOfYear / 91)

  if (quarter < 5) {
    date.quarter = quarter
    date.dayOfQuarter = date.dayOfYear - (quarter - 1) * 91 - 1
    if (date.dayOfQuarter > 0) {
      date.dayOfCalendarYear = date.dayOfYear - date.quarter
      date.octant = (quarter - 1) * 2 + Math.ceil(date.dayOfQuarter / 45) || 1
      date.dayOfOctant = date.dayOfQuarter % 45 || 45
      date.nonad = Math.ceil(date.dayOfCalendarYear / 9)
      date.dayOfNonad = date.dayOfCalendarYear % 9 || 9
    }
  } else {
    date.quarter = 0
    date.transition = date.dayOfYear - 364
  }

  return date
}

function ordinal(n) {
  return (
    n +
    (n > 0
      ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
      : '')
  )
}

let date = date360(Date.now())

// Write to display
g.reset().clear().setFontAlign(0, 0).setFont('Vector', 55)

if (date.octant) {
  g.drawString(
    `${date.dayOfOctant}/${date.octant}`,
    g.getWidth() / 2,
    g.getHeight() / 2
  )
    .setFont('Vector', 14)
    .drawString(
      `Day ${date.dayOfNonad} of ${ordinal(date.nonad)} nonad`,
      g.getWidth() / 2,
      g.getHeight() / 2 - 60
    )
    .setFont('Vector', 25)
  g.drawString(
    `${'XABCD'[date.quarter]}${date.dayOfQuarter}   ${date.year}`,
    g.getWidth() / 2,
    g.getHeight() / 2 + (date.octant ? 65 : 0)
  )
} else {
  g.drawString(
    `${'XABCD'[date.quarter]}${date.dayOfQuarter}`,
    g.getWidth() / 2,
    g.getHeight() / 2 + (date.octant ? 65 : 0)
  )
}


