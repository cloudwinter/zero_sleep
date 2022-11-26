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
    let menuButtonObject = wx.getMenuButtonBoundingClientRect();
    wx.getSystemInfo({
      success: (res) => {
        console.info("app onShow->当前的设备信息：", res);
        // 设备品
        var brand = res.brand;
        var screenHeight = res.screenHeight;
        var screenWidth = res.screenWidth;
        var navHeight = res.statusBarHeight+menuButtonObject.height+(menuButtonObject.top - res.statusBarHeight)*2;
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
        this.globalData.navHeight = navHeight;
        console.info("app onShow->屏幕高度宽度：" + screenHeight, this.globalData.display, screenWidth,navHeight);


        const patt = /ios/i
        const isIos = patt.test(res.system) //判断设备是否为苹果手机
        // 得到安全区域高度res.safeArea.top
        if (res.safeArea.top > 20 && isIos ){ //IPhoneX 等刘海手机底部横条高度大约为68rpx 
          this.globalData.hasBottonLine = true
        }else{
          this.globalData.hasBottonLine = false
        }

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
    hasBottonLine: false, // ios是否有底部横线
  }
})