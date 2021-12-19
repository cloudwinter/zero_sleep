/**
 * 获取时间对象
 * @param {当前时间} currentDate 
 */
function getDateInfo(currentDate) {
  var date = {};
  var year = currentDate.getFullYear()+'';
  date.year = year.substr(2,4)+'';
  var month = currentDate.getMonth() + 1
  date.month = (month > 9 ? month : '0' + month)+'';
  var day = currentDate.getDate()
  date.day = (day > 9 ? day : '0' + day)+'';
  var week = currentDate.getDay();
  date.week = week == '0'?'07':'0'+week;

  var hour = currentDate.getHours()
  date.hour = (hour > 9 ? hour : '0' + hour)+'';
  var minute = currentDate.getMinutes()
  date.minute = (minute > 9 ? minute : '0' + minute)+'';
  var second = currentDate.getSeconds()
  date.second = (second > 9 ? second : '0' + second)+'';
  console.log('getDateInfo:'+date);
  return date;
}

/**
 * 获取当前日期
 * yyyy-MM-dd
 */
function getCurrentDate() {
  let currentDate = new Date();
  let dateInfo = getDateInfo(new Date());
  return currentDate.getFullYear()+'-'+dateInfo.month+'-'+dateInfo.day;
}

/**
 * 两个日期相差的天数
 * @param {*} firstDate 
 * @param {*} secondDate 
 */
function getDifferDate(firstDate, secondDate) {
  //1)将两个日期字符串转化为日期对象
  var startDate = new Date(firstDate);
  var endDate = new Date(secondDate);
  //2)计算两个日期相差的毫秒数
  var msecNum = endDate.getTime() - startDate.getTime();
  //3)计算两个日期相差的天数
  var differScale = parseFloat(24 * 60 * 60 * 1000);
  var dayNum = Math.floor(msecNum / differScale);
  return dayNum;
}


module.exports = {
  getDateInfo,
  getDifferDate,
  getCurrentDate
}