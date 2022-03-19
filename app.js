//app.js
const configManager = require('./utils/configManager')
App({
  onLaunch: function () {
    configManager.init();
    // configManager.setSkin('dark');
    var skin = configManager.getSkin();
    this.globalData.skin = skin;

  },
  onShow: function () {
    wx.getSystemInfo({
      success: (res) => {
        console.info("app onShow->当前的设备信息：", res);
        // 设备品
        var brand = res.brand;
        var screenHeight = res.screenHeight;
        var screenWidth = res.screenWidth;
        var display = 'normal';
        if (brand.toLowerCase().indexOf('huawei') >= 0 ||
          brand.toLowerCase().indexOf('vivo') >= 0 ||
          brand.toLowerCase().indexOf('oppo') >= 0) {
          display = screenHeight > 690 ? 'high' : 'normal';
        } else {
          display = screenHeight > 790 ? 'high' : 'normal';
        }
        this.globalData.display = display
        this.globalData.screenHeight = screenHeight;
        this.globalData.screenWidth = screenWidth;
        console.info("app onShow->屏幕高度宽度：" + screenHeight, this.globalData.display, screenWidth);
      },
    })
  },
  globalData: {
    skin: 'dark',
    display: 'normal',
    screenHeight: '',
    screenWidth: '',
    navHeight:'',
    connected: {}, // 当前已连接的设备信息
    hasSleepInduction: false, // 智能睡眠感应开关
    zhinengShuimian:'00', // 智能睡眠状态
    sleepTimer: '00', // 智能睡眠定时
  }
})