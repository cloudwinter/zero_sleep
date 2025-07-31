function InsertString(t, c, n) {
  var r = new Array();
  for (var i = 0; i * 2 < t.length; i++) {
    r.push(t.substr(i * 2, n));
  }
  return r.join(c);
}

function FillString(t, c, n, b) {
  if ((t == "") || (c.length != 1) || (n <= t.length)) {
    return t;
  }

  var l = t.length;
  for (var i = 0; i < n - l; i++) {
    if (b == true) {
      t = c + t;
    } else {
      t += c;
    }
  }
  return t;
}

/**
 * 累加和校验
 * @param {*} t 
 */
function HexToCSU16(t) {
  var pos = 0;
  t = t.replace(/\s+/g, "");
  var len = t.length;
  if (len % 2 != 0) {
    return "Error - Odd";
  }

  len /= 2;

  var hexA = new Array();
  var vSum = 0;
  for (var i = 0; i < len; i++) {
    var s = t.substr(pos, 2);
    var v = parseInt(s, 16);
    vSum += v;
    pos += 2;
  }

  vSum = vSum.toString(16).toUpperCase();
  vSum = FillString(vSum, "0", 4, true);
  console.log("vSum:", vSum);
  // 使用逗号分割
  let vC = InsertString(vSum, ",", 2).toUpperCase()
  // 高低为字节交换
  let result = vC.split(",").reverse().join('');

  return result;
}

/**
 * CRC校验
 * @param {*} p_dat 
 * @param {*} len 
 */
function crc16(hexString) {
  let crc = 0xFFFF;
  for (let i = 0; i < hexString.length; i += 2) {
    const byte = parseInt(hexString.substr(i, 2), 16);
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) === 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc = crc >> 1;
      }
    }
  }
  // console.log(crc.toString(16).toUpperCase())
  // crc =  (crc >> 8) | (crc << 8);
  // console.log(crc.toString(16).toUpperCase())
  return crc.toString(16).toUpperCase();
}

function swapHexByteOrder(hexValue) {
  // 将16进制字符串转换为数字
  let num = parseInt(hexValue, 16);

  // 使用位操作符交换字节的高低位
  let swapped = (num & 0x00FF) << 8 | (num & 0xFF00) >> 8;

  // 将数字转换回16进制字符串
  let result = swapped.toString(16).toUpperCase()

  if (result.length == 3) {
    result = '0' + result
  }
  return result;
}

function HexToCS(t) {
  var pos = 0;
  t = t.replace(/\s+/g, "");
  var len = t.length;
  if (len % 2 != 0) {
    return "Error - Odd";
  }
  len /= 2;
  var vSum = 0;
  for (var i = 0; i < len; i++) {
    var s = t.substr(pos, 2);
    var v = parseInt(s, 16);
    vSum += v;
    pos += 2;

  }

  vSum = vSum & 0xFF;
  vC = vSum.toString(16).toUpperCase();
  return vC;

}


/**
 * 定义一个函数用于将低字节在前的16进制值转换为10进制值
 * @param {*} hexValue 
 */
function hexToDec(hexStr) {
  // 按每两个字符分割16进制字符串，得到字节数组
  let bytes = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(hexStr.substr(i, 2));
  }
  // 反转字节顺序
  bytes.reverse();
  // 重新组合成高字节在前的16进制字符串
  let reversedHexStr = bytes.join('');
  // 将反转后的16进制字符串转换为10进制值
  return parseInt(reversedHexStr, 16);
}


module.exports = {
  HexToCSU16: HexToCSU16,
  crc16: crc16,
  swapHexByteOrder: swapHexByteOrder,
  hexToDec:hexToDec
}