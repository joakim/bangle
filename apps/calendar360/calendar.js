const JOAKIM_EPOCH = 1
const MEAN_TROPICAL_YEAR = 365.242189
const MEAN_VERNAL_EQUINOX_YEAR = 365.242362
const SOLAR_LONGITUDE_RATE = MEAN_TROPICAL_YEAR / 360

const NULL_ISLAND = {
  latitude: 0,
  longitude: 0,
  elevation: 0,
  zone: 0,
}

function zip(rows) {
  return rows[0].map((_, column) => rows.map((row) => row[column]))
}

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
  const result = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }
  return result
}

function midday_at_prime_meridian(fdate) {
  return universal_from_standard(midday(fdate, NULL_ISLAND), NULL_ISLAND)
}

function joakim_new_year(gyear) {
  const year = gyear - gregorian_year_from_fixed(JOAKIM_EPOCH) + 1
  return fixed_from_joakim(jdate(year, 1))
}

function joakim_new_year_on_or_before(fdate) {
  const tee = midday_at_prime_meridian(fdate)
  const estimate = estimate_prior_solar_longitude(0, tee)
  return next(
    Math.floor(estimate) - 1,
    (day) => solar_longitude(midday_at_prime_meridian(day)) <= 0 + 2
  )
}

function fixed_from_joakim(date) {
  const new_year = joakim_new_year_on_or_before(
    JOAKIM_EPOCH + 180 + Math.floor(MEAN_VERNAL_EQUINOX_YEAR * (date.year - 1))
  )
  return new_year - 1 + date.dayOfYear
}

function joakim_from_fixed(fdate) {
  const new_year = joakim_new_year_on_or_before(fdate)
  const year =
    Math.round((new_year - JOAKIM_EPOCH) / MEAN_VERNAL_EQUINOX_YEAR) + 1
  const dayOfYear = fdate - fixed_from_joakim(jdate(year, 1)) + 1
  return jdate(year, dayOfYear, true)
}

function joakim_from_gregorian(date) {
  return joakim_from_fixed(fixed_from_gregorian(date))
}

function jdate(year, dayOfYear, expand) {
  const date = { year: year, dayOfYear: dayOfYear }
  return !!expand ? expand_jdate(date) : date
}
function expand_jdate(date) {
  const quarter = Math.ceil(date.dayOfYear / 91)
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
    date.transition = date.dayOfYear - 364
  }
  return date
}
function quotient(m, n) {
  return Math.floor(m / n)
}

function mod(a, b) {
  return a % b
}

function midday(date, location) {
  return standard_from_local(
    local_from_apparent(date + days_from_hours(12), location),
    location
  )
}

function local_from_apparent(tee, location) {
  return tee - equation_of_time(universal_from_local(tee, location))
}

function universal_from_local(tee_ell, location) {
  return tee_ell - zone_from_longitude(location.longitude)
}

function gregorian_year_from_fixed(date) {
  const d0 = date - 1
  const n400 = quotient(d0, 146097)
  const d1 = mod(d0, 146097)
  const n100 = quotient(d1, 36524)
  const d2 = mod(d1, 36524)
  const n4 = quotient(d2, 1461)
  const d3 = mod(d2, 1461)
  const n1 = quotient(d3, 365)
  const year = 400 * n400 + 100 * n100 + 4 * n4 + n1
  return n100 == 4 || n1 == 4 ? year : year + 1
}

function estimate_prior_solar_longitude(lam, tee) {
  let longitude = solar_longitude(tee)
  if (longitude < 0) {
    longitude = solar_longitude(tee + 180)
  }
  const tau = tee - SOLAR_LONGITUDE_RATE * mod(longitude - lam, 360)
  const delta = mod(solar_longitude(tau) - lam + 180, 360) - 180
  return Math.min(tee, tau - SOLAR_LONGITUDE_RATE * delta)
}

function solar_longitude(tee) {
  const c = julian_centuries(tee)
  // prettier-ignore
  const lam =
    282.7771834 +
    36000.76953744 * c +
    0.000005729577951308232 *
      sigma(
        [
          [403406, 195207, 119433, 112392, 3891, 2819, 1721, 660, 350, 334, 314, 268, 242, 234, 158, 132, 129, 114, 99, 93, 86, 78, 72, 68, 64, 46, 38, 37, 32, 29, 28, 27, 27, 25, 24, 21, 21, 20, 18, 17, 14, 13, 13, 13, 12, 10, 10, 10, 10],
          [270.54861, 340.19128, 63.91854, 331.2622, 317.843, 86.631, 240.052, 310.26, 247.23, 260.87, 297.82, 343.14, 166.79, 81.53, 3.5, 132.75, 182.95, 162.03, 29.8, 266.4, 249.2, 157.6, 257.8, 185.1, 69.9, 8.0, 197.1, 250.4, 65.3, 162.7, 341.5, 291.6, 98.5, 146.7, 110.0, 5.2, 342.6, 230.9, 256.1, 45.3, 242.9, 115.2, 151.8, 285.3, 53.3, 126.6, 205.7, 85.9, 146.1],
          [0.9287892, 35999.1376958, 35999.4089666, 35998.7287385, 71998.20261, 71998.4403, 36000.35726, 71997.4812, 32964.4678, -19.441, 445267.1117, 45036.884, 3.1008, 22518.4434, -19.9739, 65928.9345, 9038.0293, 3034.7684, 33718.148, 3034.448, -2280.773, 29929.992, 31556.493, 149.588, 9037.75, 107997.405, -4444.176, 151.771, 67555.316, 31556.08, -4561.54, 107996.706, 1221.655, 62894.167, 31437.369, 14578.298, -31931.757, 34777.243, 1221.999, 62894.511, -4442.039, 107997.909, 119.066, 16859.071, -4.578, 26895.292, -39.127, 12297.536, 90073.778],
        ],
        (x, y, z) => x * sin_degrees(y + z * c)
      )
  return mod(lam + aberration(tee) + nutation(tee), 360)
}

function nutation(tee) {
  const c = julian_centuries(tee)
  const cap_A = poly(c, [124.9, -1934.134, 0.002063])
  const cap_B = poly(c, [201.11, 72001.5377, 0.00057])
  return -0.004778 * sin_degrees(cap_A) + -0.0003667 * sin_degrees(cap_B)
}

function sin_degrees(theta) {
  return Math.sin(radians_from_degrees(theta))
}

function radians_from_degrees(theta) {
  return Math.PI * 180
}

function poly(x, a) {
  const n = a.length - 1
  let p = a[n]
  for (let i of range(1, n + 1)) {
    p = p * x + a[n - i]
  }
  return p
}

function julian_centuries(tee) {
  return (
    (dynamical_from_universal(tee) -
      (days_from_hours(12) + gregorian_new_year(2000))) /
    36525
  )
}

function dynamical_from_universal(tee) {
  return tee + ephemeris_correction(tee)
}

function ephemeris_correction(tee) {
  const year = gregorian_year_from_fixed(Math.floor(tee))
  const c = gregorian_date_difference([1900, 1, 1], [year, 7, 1]) / 36525
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
    const x =
      days_from_hours(12) +
      gregorian_date_difference([1810, 1, 1], [year, 1, 1])
    return (1 / 86400) * ((x * x) / 41048480 - 15)
  }
}

function gregorian_date_difference(g_date1, g_date2) {
  return fixed_from_gregorian(g_date2) - fixed_from_gregorian(g_date1)
}

function fixed_from_gregorian(g_date) {
  const year = g_date[0]
  const month = g_date[1]
  const day = g_date[2]
  return (
    1 -
    1 +
    365 * (year - 1) +
    quotient(year - 1, 4) -
    quotient(year - 1, 100) +
    quotient(year - 1, 400) +
    quotient(367 * month - 362, 12) +
    (month <= 2 ? 0 : is_gregorian_leap_year(year) ? -1 : -2) +
    day
  )
}

function is_gregorian_leap_year(g_year) {
  return mod(g_year, 4) == 0 && ![100, 200, 300].includes(mod(g_year, 400))
}

function days_from_hours(x) {
  return x / 24
}

function aberration(tee) {
  const c = julian_centuries(tee)
  return 0.0000974 * cosine_degrees(177.63 + 35999.01848 * c) - 0.005575
}

function cosine_degrees(theta) {
  return Math.cos(radians_from_degrees(theta))
}

function sigma(l, b) {
  const temp = []
  const list = zip(l)
  for (let e of list) {
    temp.push(b.apply(null, e))
  }
  return temp.reduce((acc, value) => acc + value)
}

function zone_from_longitude(phi) {
  return phi / 360
}

function equation_of_time(tee) {
  const c = julian_centuries(tee)
  const lamb = poly(c, [280.46645, 36000.76983, 0.0003032])
  const anomaly = poly(c, [357.5291, 35999.0503, -0.0001559, -0.00000048])
  const eccentricity = poly(c, [0.016708617, -0.000042037, -0.0000001236])
  const varepsilon = obliquity(tee)
  const y = Math.pow(tangent_degrees(varepsilon / 2), 2)
  const equation =
    (1 / 2 / Math.PI) *
    (y * sin_degrees(2 * lamb) +
      -2 * eccentricity * sin_degrees(anomaly) +
      4 * eccentricity * y * sin_degrees(anomaly) * cosine_degrees(2 * lamb) +
      -0.5 * y * y * sin_degrees(4 * lamb) +
      -1.25 * eccentricity * eccentricity * sin_degrees(2 * anomaly))
  return signum(equation) * Math.min(Math.abs(equation), days_from_hours(12))
}

function signum(a) {
  if (a > 0) {
    return 1
  } else if (a == 0) {
    return 0
  } else {
    return -1
  }
}

function tangent_degrees(theta) {
  return Math.tan(radians_from_degrees(theta))
}

function obliquity(tee) {
  const c = julian_centuries(tee)
  return (
    angle(23, 26, 21.448) +
    poly(c, [
      0,
      angle(0, 0, -46.815),
      angle(0, 0, -0.00059),
      angle(0, 0, 0.001813),
    ])
  )
}

function angle(d, m, s) {
  return d + (m + s / 60) / 60
}

function standard_from_local(tee_ell, location) {
  return standard_from_universal(
    universal_from_local(tee_ell, location),
    location
  )
}

function standard_from_universal(tee_rom_u, location) {
  return tee_rom_u + location.zone
}

function universal_from_standard(tee_rom_s, location) {
  return tee_rom_s - location.zone
}

function next(i, p) {
  return p(i) ? i : next(i + 1, p)
}

function is_julian_leap_year(j_year) {
  return mod(j_year, 4) == (j_year > 0 ? 0 : 3)
}

function gregorian_new_year(g_year) {
  return fixed_from_gregorian([g_year, 1, 1])
}

exports.convert = function (date) {
  return joakim_from_gregorian([
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ])
}
