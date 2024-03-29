// pages/nurseset/nurseset.js
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter');
const app = getApp();


Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {}, // 当前连接的设备
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    },
    anmoChecked: false,
    bbxhChecked: false,
    tbxhChecked: false,
    btxhChecked: false,
    time0700Checked: false,
    time1000Checked: false,
    time1400Checked: false,
    time1700Checked: false,
    time2000Checked: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      skin: 'dark',
      connected: connected
    })
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },


  anmoTap: function () {
    let anmoChecked = this.data.anmoChecked;
    this.setData({
      anmoChecked: !anmoChecked
    })
  },

  xunhuanTap: function (e) {
    var type = e.currentTarget.dataset.type;
    if (type == 'bbxh') {
      this.setData({
        bbxhChecked: !this.data.bbxhChecked,
        tbxhChecked: false,
        btxhChecked: false,
      })
    } else if (type == 'tbxh') {
      this.setData({
        tbxhChecked: !this.data.tbxhChecked,
        bbxhChecked: false,
        btxhChecked: false
      })
    } else if (type == 'btxh') {
      this.setData({
        btxhChecked: !this.data.btxhChecked,
        bbxhChecked: false,
        tbxhChecked: false,
      })
    }
  },

  timeTap: function (e) {
    var type = e.currentTarget.dataset.type;
    if (type == '0700') {
      this.setData({
        time0700Checked: !this.data.time0700Checked
      })
    } else if (type == '1000') {
      this.setData({
        time1000Checked: !this.data.time1000Checked
      })
    } else if (type == '1400') {
      this.setData({
        time1400Checked: !this.data.time1400Checked
      })
    } else if (type == '1700') {
      this.setData({
        time1700Checked: !this.data.time1700Checked
      })
    } else if (type == '2000') {
      this.setData({
        time2000Checked: !this.data.time2000Checked
      })
    }
  },


  saveTap: function () {
    let connected = this.data.connected;
    let cmd = 'FFFFFFFF01000511'
    let anmoChecked = this.data.anmoChecked;
    if (anmoChecked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }
    if (this.data.bbxhChecked) {
      cmd = cmd + '01'
    } else if (this.data.tbxhChecked) {
      cmd = cmd + '02'
    } else if (this.data.btxhChecked) {
      cmd = cmd + '03'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time0700Checked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time1000Checked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time1400Checked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time1700Checked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time2000Checked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }

    let cmdCrc = crcUtil.HexToCSU16(cmd);
    cmd = cmd + cmdCrc;

    // 发送蓝牙命令
    console.log('saveTap->', cmd);
    util.sendBlueCmd(connected, cmd);

    // 返回上一页
    wx.navigateBack({
      delta: 1,
    })
  }
})