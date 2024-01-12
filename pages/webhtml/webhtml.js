// pages/nurseset/nurseset2.js
const util = require('../../utils/util');
const configManager = require('../../utils/configManager')
const app = getApp();


Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {}, // 当前连接的设备
    skin: app.globalData.skin,
    webUrl:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var webUrl = decodeURIComponent(options.webUrl);
    console.info('webUrl',webUrl);
    let connected = configManager.getCurrentConnected();
    this.setData({
      skin: app.globalData.skin, //当前皮肤样式
      connected: connected,
      webUrl: webUrl
    })
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },


})