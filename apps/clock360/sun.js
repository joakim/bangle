let sun = function (date, latitude, longitude, sunrise) {
  const ZENITH = 90.8333
  const DEGREES_PER_HOUR = 360 / 24

  let hoursFromMeridian = longitude / DEGREES_PER_HOUR
  let dayOfYear = getDayOfYear(date)
  let approxTimeOfEventInDays

  if (sunrise) {
    approxTimeOfEventInDays = dayOfYear + (6 - hoursFromMeridian) / 24
  } else {
    approxTimeOfEventInDays = dayOfYear + (18.0 - hoursFromMeridian) / 24
  }

  let sunMeanAnomaly = 0.9856 * approxTimeOfEventInDays - 3.289

  let sunTrueLongitude =
    sunMeanAnomaly +
    1.916 * sinDeg(sunMeanAnomaly) +
    0.02 * sinDeg(2 * sunMeanAnomaly) +
    282.634
  sunTrueLongitude = mod(sunTrueLongitude, 360)

  let ascension = 0.91764 * tanDeg(sunTrueLongitude)
  let rightAscension = (360 / (2 * Math.PI)) * Math.atan(ascension)
  rightAscension = mod(rightAscension, 360)

  let lQuadrant = Math.floor(sunTrueLongitude / 90) * 90
  let raQuadrant = Math.floor(rightAscension / 90) * 90
  rightAscension = rightAscension + (lQuadrant - raQuadrant)
  rightAscension /= DEGREES_PER_HOUR

  let sinDec = 0.39782 * sinDeg(sunTrueLongitude)
  let cosDec = cosDeg(asinDeg(sinDec))
  let cosLocalHourAngle =
    (cosDeg(ZENITH) - sinDec * sinDeg(latitude)) / (cosDec * cosDeg(latitude))

  let localHourAngle = acosDeg(cosLocalHourAngle)

  if (sunrise) {
    localHourAngle = 360 - localHourAngle
  }

  let localHour = localHourAngle / DEGREES_PER_HOUR

  let localMeanTime =
    localHour + rightAscension - 0.06571 * approxTimeOfEventInDays - 6.622

  let time = localMeanTime - longitude / DEGREES_PER_HOUR
  time = mod(time, 24)
  console.log(time)

  let milli = date.getTime() + time * 60 * 60 * 1000

  return milli
}

let getDayOfYear = function (date) {
  let onejan = new Date(date.getFullYear(), 0, 1)
  return Math.ceil((date - onejan) / 86400000)
}

let sinDeg = function (deg) {
  return Math.sin((deg * 2.0 * Math.PI) / 360.0)
}

let acosDeg = function (x) {
  return (Math.acos(x) * 360.0) / (2 * Math.PI)
}

let asinDeg = function (x) {
  return (Math.asin(x) * 360.0) / (2 * Math.PI)
}

let tanDeg = function (deg) {
  return Math.tan((deg * 2.0 * Math.PI) / 360.0)
}

let cosDeg = function (deg) {
  return Math.cos((deg * 2.0 * Math.PI) / 360.0)
}

let mod = function (a, b) {
  let result = a % b
  if (result < 0) {
    result += b
  }
  return result
}

exports.sunrise = (date, latitude, longitude) =>
  sun(date, latitude, longitude, true)

exports.sunset = (date, latitude, longitude) =>
  sun(date, latitude, longitude, false)
