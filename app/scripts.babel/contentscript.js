'use strict'
const request = axios.create({
  baseUrl: 'https://redcs.tencent.com'
})

request.interceptors.request.use(request => {
  return request
})

request.interceptors.response.use(response => {
  return response.data
})

function getMap () {
  return request.get('/deliver/timesheet/map')
}

function getProject (params) {
  return request.get('/deliver/timesheet/orderList', {
    params
  })
}

function submitReport (data) {
  return request.post('/deliver/timesheet', data)
}

function getInputValue (no) {
  return document.querySelector(`.page-panel-main .el-form-item:nth-child(${no}) input`).value
}

function randomNum (minNum, maxNum) {
  minNum = parseInt(minNum)
  maxNum = parseInt(maxNum)
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10)
      break
    case 2:
      return parseInt(Math.random() * (
        maxNum - minNum + 1
      ) + minNum, 10)
      break
    default:
      return 0
      break
  }
}

let project = {}
let map = {}
let username = ''
chrome.runtime.onConnect.addListener(async (port) => {
  port.onMessage.addListener(async (msg) => {
    if (msg.type === 'getData') {
      await getData(port)
    }

    if (msg.type === 'submit') {
      await submit(port, msg.data, msg.days)
    }
  })
})

async function getData (port) {
  const projectId = getInputValue(4)
  username = getInputValue(5)

  const mapRes = await getMap()
  const projectRes = await getProject({
    value: projectId,
    name: username
  })

  project = projectRes.data
  map = mapRes.data

  port.postMessage({
    project,
    map,
    username
  })
}

async function submit (port, data, days) {

  console.log(days)
  project = Object.assign(project[0], {
    data: [],
    spent_person: username,
    type: '1',
    sub_type: ''
  })

  const stage = map.deliver_stage.find(item => item.stage_name === data.stage)
  const hourArr = data.hour.split('-')
  console.log(hourArr)
  days.forEach(day => {
    let hour
    if (hourArr.length === 1) {
      hour = randomNum(hourArr[0], hourArr[0])
    } else {
      hour = randomNum(parseInt(hourArr[0]), parseInt(hourArr[1]))
    }
    project.data.push({
      spent_date: dayjs(day.date).format('YYYY-MM-DD'),
      deliver_stage: stage.stage_name,
      spent_length: hour,
      mark: data.mark,
      stage_desc: stage.stage_desc,
      spent_desc: stage.spent_desc
    })
  })

  const res = await submitReport(project)
  port.postMessage({
    errMsg: res
  })
}

