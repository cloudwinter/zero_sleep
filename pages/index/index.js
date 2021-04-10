//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    },
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      skin: app.globalData.skin
    })

    var query = wx.createSelectorQuery();
    query.select('#navbar').boundingClientRect()
    query.exec((res) => {
      var navHeight = res[0].height; // 获取navHeight高度
      app.globalData.navHeight = navHeight;
      console.info("onLoad->nav高度：" + navHeight+" "+app.globalData.navHeight);
    })
  },

  /**
   * 显示时触发
   */
  onShow: function () {
    var skin = app.globalData.skin;
    this.setData({
      skin: skin
    })
    wx.getSystemInfo({
      success: (res) => {
        console.info("onShow->当前的设备信息：", res);
        // 设备品牌
        var brand = res.brand;
        var screenHeight = res.screenHeight;
        var display = 'normal';
        if (brand.toLowerCase().indexOf('huawei') >= 0 ||
          brand.toLowerCase().indexOf('vivo') >= 0 ||
          brand.toLowerCase().indexOf('oppo') >= 0) {
          display = screenHeight > 700 ? 'high' : 'normal';
        } else {
          display = screenHeight > 800 ? 'high' : 'normal';
        }
        app.globalData.display = display
        console.info("onShow->屏幕高度：" + screenHeight, app.globalData.display);
      },
    })
  },






  enter: function () {
    wx.navigateTo({
      url: '../search/search',
    })
  },


})