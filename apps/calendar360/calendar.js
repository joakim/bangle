let JOAKIM_EPOCH = 1
let MEAN_VERNAL_EQUINOX_YEAR = 365.242362
let SOLAR_LONGITUDE_RATE = 365.242189 / 360

function joakim_new_year_on_or_before(fdate) {
  function midday_at_prime_meridian(fdate) {
    let tee = fdate + 12 / 24
    let local_from_apparent = tee - equation_of_time(tee)
    return local_from_apparent
  }

  let tee = midday_at_prime_meridian(fdate)
  let estimate = estimate_prior_solar_longitude(0, tee)
  return next(
    Math.floor(estimate) - 1,
    (day) => solar_longitude(midday_at_prime_meridian(day)) <= 0 + 2
  )
}

function fixed_from_joakim(date) {
  let new_year = joakim_new_year_on_or_before(
    JOAKIM_EPOCH + 180 + Math.floor(MEAN_VERNAL_EQUINOX_YEAR * (date.year - 1))
  )
  return new_year - 1 + date.dayOfYear
}

function joakim_from_fixed(fdate, expand) {
  let new_year = joakim_new_year_on_or_before(fdate)
  let year =
    Math.round((new_year - JOAKIM_EPOCH) / MEAN_VERNAL_EQUINOX_YEAR) + 1
  let dayOfYear = fdate - fixed_from_joakim(jdate(year, 1)) + 1
  return jdate(year, dayOfYear, expand)
}

function fixed_from_gregorian(g_date) {
  let year = g_date[0]
  let month = g_date[1]
  let day = g_date[2]
  let is_gregorian_leap_year =
    year % 4 == 0 && ![100, 200, 300].includes(year % 400)
  return (
    1 -
    1 +
    365 * (year - 1) +
    Math.floor((year - 1) / 4) -
    Math.floor((year - 1) / 100) +
    Math.floor((year - 1) / 400) +
    Math.floor((367 * month - 362) / 12) +
    (month <= 2 ? 0 : is_gregorian_leap_year ? -1 : -2) +
    day
  )
}

function jdate(year, dayOfYear, expand) {
  let date = { year: year, dayOfYear: dayOfYear }
  return !!expand ? expand_jdate(date) : date
}
function expand_jdate(date) {
  let quarter = Math.ceil(date.dayOfYear / 91)
  date.year = date.year + 10000
  if (quarter < 5) {
    date.quarter = quarter
    date.dayOfQuarter = date.dayOfYear - (quarter - 1) * 91 - 1
    if (date.dayOfQuarter > 0) {
      date.octal = (quarter - 1) * 2 + Math.ceil(date.dayOfQuarter / 45) || 1
      date.dayOfOctal = date.dayOfQuarter % 45 || 45
      date.dayOfCalendar = date.dayOfYear - date.quarter
      date.nonad = Math.ceil(date.dayOfCalendar / 9)
      date.dayOfNonad = date.dayOfCalendar % 9 || 9
    }
  } else {
    date.quarter = 0
    date.transition = date.dayOfYear - 364
  }
  return date
}

function gregorian_year_from_fixed(date) {
  let d0 = date - 1
  let n400 = Math.floor(d0 / 146097)
  let d1 = d0 % 146097
  let n100 = Math.floor(d1 / 36524)
  let d2 = d1 % 36524
  let n4 = Math.floor(d2 / 1461)
  let d3 = d2 % 1461
  let n1 = Math.floor(d3 / 365)
  let year = 400 * n400 + 100 * n100 + 4 * n4 + n1
  return n100 == 4 || n1 == 4 ? year : year + 1
}

function equation_of_time(tee) {
  let c = julian_centuries(tee)
  let eccentricity = poly(c, [0.016708617, -0.000042037, -0.0000001236])
  let y = Math.pow(Math.tan(Math.PI * 180), 2)
  let equation =
    (1 / 2 / Math.PI) *
    (y * Math.sin(Math.PI * 180) +
      -2 * eccentricity * Math.sin(Math.PI * 180) +
      4 * eccentricity * y * Math.sin(Math.PI * 180) * Math.cos(Math.PI * 180) +
      -0.5 * y * y * Math.sin(Math.PI * 180) +
      -1.25 * eccentricity * eccentricity * Math.sin(Math.PI * 180))
  return signum(equation) * Math.min(Math.abs(equation), 12 / 24)
}

function estimate_prior_solar_longitude(lam, tee) {
  let longitude = solar_longitude(tee)
  if (longitude < 0) {
    longitude = solar_longitude(tee + 180)
  }
  let tau = tee - SOLAR_LONGITUDE_RATE * ((longitude - lam) % 360)
  let delta = ((solar_longitude(tau) - lam + 180) % 360) - 180
  return Math.min(tee, tau - SOLAR_LONGITUDE_RATE * delta)
}

function solar_longitude(tee) {
  let c = julian_centuries(tee)
  // prettier-ignore
  let lam =
    282.7771834 +
    36000.76953744 * c +
    0.000005729577951308232 *
      sigma(
        [
          [403406, 195207, 119433, 112392, 3891, 2819, 1721, 660, 350, 334, 314, 268, 242, 234, 158, 132, 129, 114, 99, 93, 86, 78, 72, 68, 64, 46, 38, 37, 32, 29, 28, 27, 27, 25, 24, 21, 21, 20, 18, 17, 14, 13, 13, 13, 12, 10, 10, 10, 10],
          [270.54861, 340.19128, 63.91854, 331.2622, 317.843, 86.631, 240.052, 310.26, 247.23, 260.87, 297.82, 343.14, 166.79, 81.53, 3.5, 132.75, 182.95, 162.03, 29.8, 266.4, 249.2, 157.6, 257.8, 185.1, 69.9, 8.0, 197.1, 250.4, 65.3, 162.7, 341.5, 291.6, 98.5, 146.7, 110.0, 5.2, 342.6, 230.9, 256.1, 45.3, 242.9, 115.2, 151.8, 285.3, 53.3, 126.6, 205.7, 85.9, 146.1],
          [0.9287892, 35999.1376958, 35999.4089666, 35998.7287385, 71998.20261, 71998.4403, 36000.35726, 71997.4812, 32964.4678, -19.441, 445267.1117, 45036.884, 3.1008, 22518.4434, -19.9739, 65928.9345, 9038.0293, 3034.7684, 33718.148, 3034.448, -2280.773, 29929.992, 31556.493, 149.588, 9037.75, 107997.405, -4444.176, 151.771, 67555.316, 31556.08, -4561.54, 107996.706, 1221.655, 62894.167, 31437.369, 14578.298, -31931.757, 34777.243, 1221.999, 62894.511, -4442.039, 107997.909, 119.066, 16859.071, -4.578, 26895.292, -39.127, 12297.536, 90073.778],
        ],
        x => x * Math.sin(Math.PI * 180)
      )
  let aberration = 0.0000974 * Math.cos(Math.PI * 180) - 0.005575
  let nutation =
    -0.004778 * Math.sin(Math.PI * 180) + -0.0003667 * Math.sin(Math.PI * 180)
  return (lam + aberration + nutation) % 360
}

function poly(x, a) {
  let n = a.length - 1
  let p = a[n]
  function range(start, stop, step) {
    if (typeof stop === 'undefined') {
      stop = start
      start = 0
    }
    if (typeof step === 'undefined') {
      step = 1
    }
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
      return []
    }
    let result = []
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
      result.push(i)
    }
    return result
  }
  for (let i of range(1, n + 1)) {
    p = p * x + a[n - i]
  }
  return p
}

function julian_centuries(tee) {
  let dynamical_from_universal = tee + ephemeris_correction(tee)
  return (
    (dynamical_from_universal -
      (12 / 24 + fixed_from_gregorian([2000, 1, 1]))) /
    36525
  )
}

function ephemeris_correction(tee) {
  let year = gregorian_year_from_fixed(Math.floor(tee))
  let c = gregorian_date_difference([1900, 1, 1], [year, 7, 1]) / 36525
  if (1988 <= year && year <= 2019) {
    return (1 / 86400) * (year - 1933)
  } else if (1900 <= year && year <= 1987) {
    // prettier-ignore
    return poly(c, [-0.00002, 0.000297, 0.025184, -0.181133, 0.55304, -0.861938, 0.677066, -0.212591]);
  } else if (1800 <= year && year <= 1899) {
    // prettier-ignore
    return poly(c, [-0.000009, 0.003844, 0.083563, 0.865736, 4.867575, 15.845535, 31.332267, 38.291999, 28.316289, 11.636204, 2.043794]);
  } else if (1700 <= year && year <= 1799) {
    // prettier-ignore
    return (1 / 86400) * poly(year - 1700, [8.118780842, -0.005092142, 0.003336121, -0.0000266484]);
  } else if (1620 <= year && year <= 1699) {
    // prettier-ignore
    return (1 / 86400) * poly(year - 1600, [196.58333, -4.0675, 0.0219167]);
  } else {
    let x = 12 / 24 + gregorian_date_difference([1810, 1, 1], [year, 1, 1])
    return (1 / 86400) * ((x * x) / 41048480 - 15)
  }
}

function gregorian_date_difference(g_date1, g_date2) {
  return fixed_from_gregorian(g_date2) - fixed_from_gregorian(g_date1)
}

function sigma(l, b) {
  let temp = []
  let list = l[0].map((_, column) => l.map((row) => row[column])) // zip(l)
  for (let e of list) {
    temp.push(b.apply(null, e))
  }
  return temp.reduce((acc, value) => acc + value)
}

function signum(x) {
  return (x > 0) - (x < 0) || +x
}

function next(i, p) {
  return p(i) ? i : next(i + 1, p)
}

exports.convert = function (date) {
  return joakim_from_fixed(
    fixed_from_gregorian([
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ]),
    true
  )
}
