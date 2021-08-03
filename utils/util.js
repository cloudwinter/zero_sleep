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

/**
 * 判断对象是否为空
 * @param {*} object 
 */
function isNotEmptyObject(object) {
  let result = false;
  if (object && Object.keys(object).length > 0) {
    result = true;
  }
  console.log('isNotEmptyObject object', object, result);
  return result;
}

/**
 * 判断字符是否为空
 * @param {*} str 
 */
function isNotEmptyStr(str) {
  if (str != '' && str != null && str != undefined) {
    return true;
  }
  return false;
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
    mask: true,
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
 * String->Array
 * @param {*} str 
 */
function str2abArray(str) {
  var array = new Uint8Array(str.length);
  for (var i = 0, l = str.length; i < l; i++) {
    array[i] = str.charCodeAt(i);
  }
  console.log(array);
  return array;
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
// function ab2hex(buffer) {
//   var hexArr = Array.prototype.map.call(
//     new Uint8Array(buffer),
//     function (bit) {
//       return ('00' + bit.toString(16)).slice(-2)
//     }
//   )
//   return hexArr.join('');
// }


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
  if (!str || str.length < 2) {
    return new ArrayBuffer(0);
  }
  var buffer = new ArrayBuffer(str.length / 2);
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
 * 16进制字符转2进制字符
 */
function str16To2(str16) {
  console.info('str16To2', str16);
  let result = parseInt(str16, 16).toString(2);
  let preNum = (str16.length * 4 - result.length);
  if (preNum > 0) {
    for (let i = 0; i < preNum; i++) {
      result = '0' + result;
    }
  }
  console.info('str16To2', result);
  return result;
}

/**
 * 二进制字符串转化为16进制
 * @param {}} str2 
 */
function str2To16(str2) {
  console.info('str2To16', str2);
  let result = parseInt(str2, 2).toString(16);
  let preNum = str2.length / 4 - result.length;
  if (preNum > 0) {
    for (let i = 0; i < preNum; i++) {
      result = '0' + result;
    }
  }
  console.info('str2To16', result);
  return result.toUpperCase();
}


/**
 * 将字符串每隔一定长度切分放入一个数组中
 * @param {*} str 原始字符
 * @param {*} length 每隔几个字符
 * return 返回数组
 */
function strToArray(str, itemLength) {
  if (!str || str.length % itemLength != 0) {
    console.error('strToArray 字符为空或长度异常', str, itemLength);
    return;
  }
  let array = [];
  for (let i = 0; i < str.length; i += itemLength) {
    array.push(str.substr(i, itemLength));
  }
  console.log('strToArray array', array);
  return array;
}


/**
 * 给蓝牙发送命令
 * @param {*} connected 
 * @param {*} cmd 
 * @param {*} option 
 */
function sendBlueCmd(connected, cmd, option) {
  console.info('sendBlueCmd', connected, cmd);
  let buf = hexStringToArrayBuffer(cmd);
  wx.writeBLECharacteristicValue({
    deviceId: connected.deviceId,
    serviceId: connected.serviceId,
    characteristicId: connected.writeCharacId,
    value: buf,
    success: function (res) {
      // 指令发送成功
      console.info('sendBlueCmd success');
      if (option) {
        option.success(res);
      }
    },
    fail: function (res) {
      // 指令发送失败
      console.error('sendBlueCmd fail', res);
      if (option) {
        option.fail(res);
      }
    },
  })
}


function transSpecialChar(name) {
  if (name) {
    name = name.replace(/:/g, 'A');
    name = name.replace(/;/g, 'B');
    name = name.replace(/</g, 'C');
    name = name.replace(/=/g, 'D');
    name = name.replace(/>/g, 'E');
    name = name.replace(/\?/g, 'F');
  }
  return name;
}




module.exports = {
  formatTime: formatTime,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  str2abArray,
  str2ab,
  ab2hex,
  hexStringToArrayBuffer,
  str16To2,
  str2To16,
  transSpecialChar,
  sendBlueCmd,
  isNotEmptyObject,
  isNotEmptyStr,
  strToArray,
}