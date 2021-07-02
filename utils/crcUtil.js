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
  console.log("vSum:",vSum);
  // 使用逗号分割
  let vC = InsertString(vSum, ",", 2).toUpperCase()
  // 高低为字节交换
  let result = vC.split(",").reverse().join('');

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


module.exports = {
  HexToCSU16:HexToCSU16,
}