const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function showToast(msg) {
  wx.showToast({
    title: msg,
    icon: 'none',
    duration: 3000
  })
}

function showLoading(title) {
  wx.showLoading({
    title: title,
    mask:true,
  });
}


function hideLoading() {
  wx.hideLoading({
    complete: (res) => {},
  })
}

function showModal(content) {
  wx.showModal({
    title: '零睡眠',
    content: content, // + that.data.connectedDeviceId,
    showCancel: false
  })
}


/**
 * String->ArrayBuffer
 * @param {*} str 
 */
function str2ab(str) {
  var array = new Uint8Array(str.length);
  for (var i = 0, l = str.length; i < l; i++) {
    array[i] = str.charCodeAt(i);
  }
  console.log(array);
  return array.buffer;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}


/**
 * ArrayBuffer转16进度字符串示例
 * @param {*} buffer 
 */
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

/**
 * 16进制字符串返回buff
 * @param {*} str 
 */
function hexStringToArrayBuffer(str) {  
  if (!str || str.length<2) {
    return new ArrayBuffer(0);
  }
  var buffer = new ArrayBuffer(str.length/2);
  let dataView = new DataView(buffer)
  let ind = 0;    
  for (var i = 0, len = str.length; i < len; i += 2) {
    let code = parseInt(str.substr(i, 2), 16)    
    // console.log(str.substr(i, 2));
    // console.log(ind);
    dataView.setUint8(ind, code)
    ind++
  }  
  //console.log("长度"+buffer);
  return buffer;
}

/**
 * 给蓝牙发送命令
 * @param {*} connected 
 * @param {*} cmd 
 * @param {*} option 
 */
function sendBlueCmd(connected,cmd,option){
  console.info('sendBlueCmd',connected,cmd);
  let buf = hexStringToArrayBuffer(cmd);
  wx.writeBLECharacteristicValue({
    deviceId: connected.deviceId,
    serviceId: connected.serviceId,
    characteristicId: connected.writeCharacId,
    value: buf,
    success: function (res) {
      // 指令发送成功
      console.info('sendBlueCmd success');
      if(option) {
        option.success(res);
      }
    },
    fail: function (res) {
      // 指令发送失败
      console.error('sendBlueCmd fail',res);
      if(option) {
        option.fail(res);
      }
    },
  })
}


function transSpecialChar(name) {
  if(name){
    name = name.replace(/:/g,'A');
    name = name.replace(/;/g,'B');
    name = name.replace(/</g,'C');
    name = name.replace(/=/g,'D');
    name = name.replace(/>/g,'E');
    name = name.replace(/\?/g,'F');
  }
  return name;
}




module.exports = {
  formatTime: formatTime,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  str2ab,
  ab2hex,
  hexStringToArrayBuffer,
  transSpecialChar,
  sendBlueCmd,

}
