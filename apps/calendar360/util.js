exports.expand = (date) => {
  date.quarter = Math.ceil(date.dayOfYear / 91) % 5

  if (date.quarter === 0) {
    date.transition = date.dayOfYear - 365
  } else {
    date.dayOfQuarter = date.dayOfYear - (date.quarter - 1) * 91 - 1

    if (date.dayOfQuarter > 0) {
      date.dayOfCalendarYear = date.dayOfYear - date.quarter
      date.octant =
        (date.quarter - 1) * 2 + Math.ceil(date.dayOfQuarter / 45) || 1
      date.dayOfOctant = date.dayOfQuarter % 45 || 45
      date.nonad = Math.ceil(date.dayOfCalendarYear / 9)
      date.dayOfNonad = date.dayOfCalendarYear % 9 || 9
    }
  }

  return date
}
