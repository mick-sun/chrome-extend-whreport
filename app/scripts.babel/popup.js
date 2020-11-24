const $ = window.$
const ltc_id = $('#ltc_id').val()

if (!ltc_id) {
  $('#projectForm').hide()
}
$('.tips').show()
$('#success').hide()

function setValue (id, value) {
  $(`#${id}`).html(value)
}

function sumMax (obj, days) {
  let max
  if (!obj.max || obj.max > days.length) {
    max = days.length
  } else {
    max = obj.max
  }
  return max
}

function arrayToObject (array) {
  const obj = {}
  array.forEach(item => {
    obj[item.name] = item.value
  })
  return obj
}

chrome.tabs.getSelected(null, async function (tab) {
  const port = chrome.tabs.connect(tab.id)

  if (tab.url.includes('workhoursreport-my/task/?orderid')) {
    $('.tips').hide()
    $('.loading').show()
    port.postMessage({ type: 'getData' })
  }

  $('#submit').click(async function () {
    const data = $('#projectForm').serializeArray()
    const obj = arrayToObject(data)
    const errMsgEle = $('#errMsg')

    if (!obj.start || !obj.end || !obj.mark || !obj.hour) {
      errMsgEle.text('请填写完整信息再提交')
      return
    }

    if (new Date(obj.start) > new Date(obj.end)) {
      errMsgEle.text('开始时间不能大于结束时间')
      return
    }

    errMsgEle.text('')
    const hourArr = obj.hour.split('-')
    let hour

    for (let i = 0; i < hourArr.length; i++) {
      const item = hourArr[i]
      if (Number(item) === 0 || isNaN(Number(item))){
        return errMsgEle.text('花费工时填写错误')
      }
    }

    if (hourArr.length === 1){
      hour = hourArr[0]
    } else {
      hour = `随机${hourArr[0]}-${hourArr[1]}`
    }

    const days = await sumWorkDays(obj)
    let max = sumMax(obj, days)
    setValue('start_at', obj.start)
    setValue('end_at', obj.end)
    setValue('stage_val', obj.stage)
    setValue('mark_val', obj.mark)
    setValue('days', `${max}天`)
    setValue('hour_val', `${hour}小时`)
    $('#conformModal').modal()
  })

  $('#confirm').click(async function () {
    $(this).attr('disabled', true)
    const data = $('#projectForm').serializeArray()
    const obj = arrayToObject(data)
    const days = await sumWorkDays(obj)

    port.postMessage({ type: 'submit', data: obj, days })
  })

  port.onMessage.addListener((response) => {
    if (response.username) {
      $('#username').val(response.username)
    }
    if (response.project && response.project.length > 0) {
      $('.loading').hide()
      $('#projectForm').show()
      const { order_id } = response.project[0]
      $('#order_id').val(order_id)
    }

    if (response.map && response.map.deliver_stage) {
      let options = ''
      response.map.deliver_stage.forEach(stage => {
        options += `<option value="${stage.stage_name}">${stage.stage_name}</option>`
      })
      $('#stage').html(options)
    }

    if (response.errMsg) {
      const { code, message } = response.errMsg
      $('#confirm').attr('disabled', false)
      $('#conformModal').modal('hide')
      if (code === -1) {
        $('#errMsg').text(message)
      } else {
        $('#errMsg').text('')
        $('#success').show()
      }
    }
  })
})
