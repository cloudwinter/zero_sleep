// pages/smart/smart.js
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter');
const time = require('../../utils/time')
const app = getApp();
const preCMD = 'FFFFFFFF050000';
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
    OZItems: [{
        key: '00',
        value: '20:00'
      },
      {
        key: '01',
        value: '21:00'
      },
      {
        key: '02',
        value: '22:00'
      },
      {
        key: '03',
        value: '23:00'
      },
      {
        key: '04',
        value: '24:00'
      },
    ],
    OZ: {
      key: '00',
      value: '20:00'
    },
    rushuiSelectRadio: '',
    rushuiDialogShow: false,
    openSmart: false,
    showShishishuju: false,
  },

  onReady: function (options) {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    let showShishishuju = configManager.getShishiSwitch();
    this.setData({
      skin: app.globalData.skin,
      connected: connected,
      showShishishuju: showShishishuju
    })

    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    this.sendInitCmd();
  },



  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },



  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },


  /**
   * 发送初始化命令
   */
  sendInitCmd() {
    let cmd = '';
    let end = '';
    cmd = 'FFFFFFFF0200160B00';
    end = crcUtil.HexToCSU16(cmd);
    this.sendBlueCmd(cmd + end);
  },

  /**
   * 蓝牙回复回调
   * @param {*} cmd 
   */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    if (cmd.indexOf('FFFFFFFF0200160B') >= 0) {
      let OZkey = cmd.substr(16, 2);
      let rushuiSelectRadio = OZkey;
      let rushuiSelectValue;
      this.data.OZItems.forEach(obj => {
        if (rushuiSelectRadio == obj.key) {
          rushuiSelectValue = obj.value;
        }
      });
      this.setData({
        rushuiDialogShow: false,
        ['OZ.value']: rushuiSelectValue,
        ['OZ.key']: rushuiSelectRadio,
      })
    }
  },


  /**
   * 发送蓝牙命令
   * @param {*} cmd 
   */
  sendBlueCmd(cmd) {
    var connected = this.data.connected;
    util.sendBlueCmd(connected, cmd);
  },

  /**
   * 智能睡眠感应开关
   */
  smartSwitch: function () {
    var connected = this.data.connected;
    var openSmart = this.data.openSmart;
    if (openSmart) {
      // 发送关的命令
      util.sendBlueCmd(connected, preCMD + 'F03FD310');
    } else {
      // 发送开的命令
      util.sendBlueCmd(connected, preCMD + '003F9710');
    }
    this.setData({
      openSmart: !openSmart
    })
  },



  /**
   * 跳转到睡眠报告页面
   */
  report: function (event) {
    let pageType = event.currentTarget.dataset.type;
    console.log('report:' + pageType);
    wx.navigateTo({
      url: '/pages/report/report?pageType=' + pageType
    })
  },

  smartSet: function (e) {
    wx.navigateTo({
      url: '/pages/smart/smart'
    })
  },

  /**
   * 跳转到睡眠报告页面
   */
  wmreport: function (event) {
    let pageType = event.currentTarget.dataset.type;
    console.log('wmreport:' + pageType);
    wx.navigateTo({
      url: '/pages/wmreport/wmreport?pageType=' + pageType
    })
  },

  /**
   * 点击入睡时间
   */
  rushui: function () {
    this.setData({
      rushuiDialogShow: true
    })
  },


  /**
   * 模式选择
   * @param {*} e 
   */
  rushuiRadioChange: function (e) {
    this.setData({
      rushuiSelectRadio: e.detail.value
    })
  },

  /**
   * 模式选择点击
   * @param {*} e 
   */
  onModalRushuiClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        rushuiDialogShow: false
      })
      return;
    }
    let rushuiSelectRadio = this.data.rushuiSelectRadio;
    let rushuiSelectValue;
    this.data.OZItems.forEach(obj => {
      if (rushuiSelectRadio == obj.key) {
        rushuiSelectValue = obj.value;
      }
    });
    this.setData({
      rushuiDialogShow: false,
      ['OZ.value']: rushuiSelectValue,
      ['OZ.key']: rushuiSelectRadio,
    })
    let cmd = 'FFFFFFFF0200150B' + this.data.OZ.key;
    let end = crcUtil.HexToCSU16(cmd);
    this.sendBlueCmd(cmd + end);
  },



  /**
   * 点击日期时候触发的事件
   * bind:getdate
   */
  getdate(e) {
    let currentDate = time.getCurrentDate();
    let selectedDate = e.detail.datestr;
    let differDays = time.getDifferDate(selectedDate, currentDate) - 1;
    if (differDays > 30) {
      util.showToast('您选择的日期暂无数据');
      return;
    }
    let UV = util.str10To16(differDays);
    console.log(currentDate, e.detail, differDays);
    let OZkey = this.data.OZ.key;
    wx.navigateTo({
      url: '/pages/report/report?pageType=1&UV=' + UV + '&OZ=' + OZkey + '&selectedDate=' + selectedDate
    })
  },

  /**
   * 点击标题顶部
   */
  longTap() {
    let showShishishuju = this.data.showShishishuju;
    configManager.putShishiSwitch(!showShishishuju);
    this.setData({
      showShishishuju: !showShishishuju
    })
    
  },

})