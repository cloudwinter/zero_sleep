// pages/smart/smart.js
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
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
    openSmart: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      skin: app.globalData.skin,
      connected: connected
    })
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

  smartSet:function(e) {
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

})