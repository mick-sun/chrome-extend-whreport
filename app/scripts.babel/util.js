const dayjs = window.dayjs
dayjs.extend(window.dayjs_plugin_isoWeek)

function getAllDate (start, end) {
  const dateArr = []
  const startArr = start.split('-')
  const endArr = end.split('-')
  const db = new Date()
  db.setUTCFullYear(startArr[0], startArr[1] - 1, startArr[2])
  const de = new Date()
  de.setUTCFullYear(endArr[0], endArr[1] - 1, endArr[2])
  const unixDb = db.getTime()
  const unixDe = de.getTime()
  let stamp
  const oneDay = 24 * 60 * 60 * 1000
  for (stamp = unixDb; stamp <= unixDe;) {
    dateArr.push(dayjs(new Date(parseInt(stamp))).format('YYYYMMDD'))
    stamp = stamp + oneDay
  }
  return dateArr
}

async function sumWorkDays ({ start, end }) {
  const festival = await axios.get('https://pc.suishenyun.net/peacock/api/h5/festival')

  const holidays = festival.data.holidays.cn
  let days = []
  getAllDate(start, end).forEach(date => {
    const status = [6, 7].includes(dayjs(date).isoWeekday()) ? 0 : 1
    days.push({
      date,
      status: status
    })
  })

  days.forEach(day => {
    holidays.forEach(holiday => {
      if (day.date === holiday.date.toString()) {
        day.status = holiday.status
      }
    })
  })

  days = days.filter(day => day.status === 1)
  return days
}
