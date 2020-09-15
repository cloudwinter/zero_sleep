// pages/set.js
const configManager = require('../../utils/configManager')
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    },
    items: [
      { value: 'dark', name: '深黑', checked: 'true' },
      { value: 'orange', name: '紫色' },
    ],
    dialogShow: false,
    selectedRadio: 'drak'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      skin: app.globalData.skin,
      selectedRadio: app.globalData.skin
    })
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },





  /******----------------->自定义函数 */

  /**
   * 设置
   * @param {}} e 
   */
  set: function (e) {
    wx.navigateBack({
      delta: 2,
      complete: (res) => {
        console.info('返回蓝牙搜索界面')
      },
    })
  },

  /**
   * 换肤
   * @param {*} e 
   */
  changeSkip: function (e) {
    // var skin = e.target.dataset.flag;
    // console.log(skin);
    // configManager.setSkin(skin);
    this.setData({
      dialogShow: true
    })
  },

  /**
   * 单选时间
   * @param {*} e 
   */
  radioChange: function (e) {
    console.info('radioChange', e);
    this.setData({
      selectedRadio: e.detail.value
    })
  },

  onModalClick: function (e) {
    var ctype = e.target.dataset.ctype;
    var selectedRadio = this.data.selectedRadio;
    this.setData({
      dialogShow: false
    })
    if (ctype == 'confirm') {
      // 确认
      configManager.setSkin(selectedRadio);
      app.globalData.skin = selectedRadio;
      this.setData({
        skin: selectedRadio
      })
    } else {
      // 取消
      this.setData({
        selectedRadio: this.data.skin
      })
    }
  }
})