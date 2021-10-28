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


module.exports = {
  getDateInfo,
}