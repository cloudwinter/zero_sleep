// pages/nurseset/nurseset2.js
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
    anmoItemShow:false,
    anmoChecked: false,
    bbxhChecked: false,
    tbxhChecked: false,
    btxhChecked: false,
    fsxh1Checked: false,
    fsxh2Checked: false,
    time0600Checked: false,
    time1000Checked: false,
    time1400Checked: false,
    time1800Checked: false,
    time2200Checked: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      skin: app.globalData.skin, //当前皮肤样式
      connected: connected
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    let cmd = 'FFFFFFFF01000E0B00';
    let cmdCrc = crcUtil.HexToCSU16(cmd);
    cmd = cmd + cmdCrc;
    this.sendFullBlueCmd(cmd);
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },

  /**
   * 蓝牙回复回调
   * @param {*} cmd 
   */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    if (cmd.indexOf('FFFFFFFF01000E14') >= 0) {
      let ammoCmd = cmd.substr(16, 2);
      let anmoChecked = ammoCmd == '01' ? true : false;
      let xuhuanCmd = cmd.substr(18, 2);
      let bbxhChecked = false;
      let tbxhChecked = false;
      let btxhChecked = false;
      let fsxh1Checked = false;
      let fsxh2Checked = false;
      if (xuhuanCmd == '03') {
        btxhChecked = true;
      } else if (xuhuanCmd == '02') {
        tbxhChecked = true;
      } else if (xuhuanCmd == '01') {
        bbxhChecked = true;
      } else if (xuhuanCmd == '04') {
        fsxh1Checked = true;
      } else if (xuhuanCmd == '05') {
        fsxh2Checked = true;
      }
      let time0600Cmd = cmd.substr(20, 2);
      let time0600Checked = time0600Cmd == '01' ? true : false;

      let time1000Cmd = cmd.substr(22, 2);
      let time1000Checked = time1000Cmd == '01' ? true : false;

      let time1400Cmd = cmd.substr(24, 2);
      let time1400Checked = time1400Cmd == '01' ? true : false;

      let time1800Cmd = cmd.substr(26, 2);
      let time1800Checked = time1800Cmd == '01' ? true : false;

      let time2200Cmd = cmd.substr(28, 2);
      let time2200Checked = time2200Cmd == '01' ? true : false;

      this.setData({
        anmoChecked: anmoChecked,
        bbxhChecked: bbxhChecked,
        tbxhChecked: tbxhChecked,
        btxhChecked: btxhChecked,
        fsxh1Checked: fsxh1Checked,
        fsxh2Checked: fsxh2Checked,
        time0600Checked: time0600Checked,
        time1000Checked: time1000Checked,
        time1400Checked: time1400Checked,
        time1800Checked: time1800Checked,
        time2200Checked: time2200Checked
      })
    }
  },


  /**
   * 发送完整蓝牙命令
   */
  sendFullBlueCmd(cmd, options) {
    var connected = this.data.connected;
    util.sendBlueCmd(connected, cmd, options);
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
        fsxh1Checked: false,
        fsxh2Checked: false
      })
    } else if (type == 'tbxh') {
      this.setData({
        tbxhChecked: !this.data.tbxhChecked,
        bbxhChecked: false,
        btxhChecked: false,
        fsxh1Checked: false,
        fsxh2Checked: false
      })
    } else if (type == 'btxh') {
      this.setData({
        btxhChecked: !this.data.btxhChecked,
        bbxhChecked: false,
        tbxhChecked: false,
        fsxh1Checked: false,
        fsxh2Checked: false
      })
    } else if (type == 'fsxh1') {
      this.setData({
        btxhChecked: false,
        bbxhChecked: false,
        tbxhChecked: false,
        fsxh1Checked: !this.data.fsxh1Checked,
        fsxh2Checked: false,
      })
    } else if (type == 'fsxh2') {
      this.setData({
        btxhChecked: false,
        bbxhChecked: false,
        tbxhChecked: false,
        fsxh1Checked: false,
        fsxh2Checked: !this.data.fsxh2Checked,
      })
    }
  },

  timeTap: function (e) {
    var type = e.currentTarget.dataset.type;
    if (type == '0600') {
      this.setData({
        time0600Checked: !this.data.time0600Checked
      })
    } else if (type == '1000') {
      this.setData({
        time1000Checked: !this.data.time1000Checked
      })
    } else if (type == '1400') {
      this.setData({
        time1400Checked: !this.data.time1400Checked
      })
    } else if (type == '1800') {
      this.setData({
        time1800Checked: !this.data.time1800Checked
      })
    } else if (type == '2200') {
      this.setData({
        time2200Checked: !this.data.time2200Checked
      })
    }
  },


  saveTap: function () {
    let connected = this.data.connected;
    let cmd = 'FFFFFFFF01000D14'
    // let anmoChecked = this.data.anmoChecked;
    // if (anmoChecked) {
    //   cmd = cmd + '01'
    // } else {
    //   cmd = cmd + '00'
    // }
    // 按摩功能固定00
    cmd = cmd + '00'

    if (this.data.bbxhChecked) {
      cmd = cmd + '01'
    } else if (this.data.tbxhChecked) {
      cmd = cmd + '02'
    } else if (this.data.btxhChecked) {
      cmd = cmd + '03'
    } else if (this.data.fsxh1Checked) {
      cmd = cmd + '04'
    } else if (this.data.fsxh2Checked) {
      cmd = cmd + '05'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time0600Checked) {
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

    if (this.data.time1800Checked) {
      cmd = cmd + '01'
    } else {
      cmd = cmd + '00'
    }

    if (this.data.time2200Checked) {
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