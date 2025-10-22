// pages/bedstead/bedstead.js
const util = require('../../../utils/util')
const time = require('../../../utils/time');
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil')
const app = getApp()



Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: app.globalData.skin, //当前皮肤样式
    display: app.globalData.display,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      set: true,
      animated: false,
      showRSSI: false
    }, // 导航栏
    title: '智能床架',
    cmd: '',
    nowIndex: 1,
    nowPage: 'diandong',
    connected: {},
    tabBarShow: true,
    tabBar: [{
      "selectedIconPath": "../../../images/" + app.globalData.skin + "/tab_diandong_selected@2x.png",
      "iconPath": "../../../images/" + app.globalData.skin + "/tab_diandong_normal@2x.png",
      "text": "智能床",
      "tapFunction": "toDianDongChuang",
      "active": "active",
      "show": true
    },
    {
      "selectedIconPath": "../../../images/" + app.globalData.skin + "/tab_qinang_selected@2x.png",
      "iconPath": "../../../images/" + app.globalData.skin + "/tab_qinang_normal@2x.png",
      "text": "气囊",
      "tapFunction": "toQiNang",
      "active": "",
      "show": true
    },
    {
      "selectedIconPath": "../../../images/" + app.globalData.skin + "/tab_lengnuan_selected@2x.png",
      "iconPath": "../../../images/" + app.globalData.skin + "/tab_lengnuan_normal@2x.png",
      "text": "冷暖",
      "tapFunction": "toLengNuan",
      "active": "active",
      "show": true
    }
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    if (option && option.cmd) {
      let connected = configManager.getCurrentConnected();
      var cmd = option.cmd;
      var type = option.type
      var nowIndex = this.data.nowIndex
      var title = this.data.title
      if (type == 'diandong') {
        nowIndex = 0
        title = "智能床架"
      } else if (type == 'qinang') {
        nowIndex = 1
        title = "舒适按摩"
      } else if (type == 'lengnuan') {
        nowIndex = 2
        title = "温度调节"
      }

      this.setData({
        cmd: cmd,
        connected: connected,
        nowPage: type,
        nowIndex: nowIndex,
        title: title
      })

      this.notifyBLECharacteristicValueChange();
    }
  },

  onShow() {
    var cmd = this.data.cmd
    let bedState = cmd.substr(18, 2) == '0A' ? true : false;
    let m1State = cmd.substr(24, 2) == '0B' ? true : false;
    let m2State = cmd.substr(30, 2) == '0C' ? true : false;
    var tabbar = this.data.tabBar
    var tabBarShow = this.data.tabBarShow
    var tabBarNum = 0;
    if (!bedState) {
      tabbar[0].show = false;
      tabBarNum++;
    }
    if (!m1State) {
      tabbar[1].show = false;
      tabBarNum++;
    }
    if (!m2State) {
      tabbar[2].show = false;
      tabBarNum++;
    }

    //判断是否超过2个页面不显示
    if (tabBarNum >= 2) {
      tabBarShow = false
    }

    this.setData({
      tabBar: tabbar,
      tabBarShow: tabBarShow
    })
  },

  /**
  * 开启监听
  */
  notifyBLECharacteristicValueChange: function () {
    var that = this;
    var connected = this.data.connected;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能  
      deviceId: connected.deviceId,
      serviceId: connected.serviceId,
      characteristicId: connected.notifyCharacId,
      success: function () {
        console.info("notifyBLECharacteristicValueChange->success");
        // 初始化通知
        that.executeInitCmdTasks();
      },
      fail: function (res) {
        console.error("main->notifyBLECharacteristicValueChange error", res);
        util.showModal('蓝牙通讯不稳定，请重新进入');
      }
    });
    wx.onBLECharacteristicValueChange((res) => {
      console.info('main->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received', received);
      that.blueReply(received, connected);
      WxNotificationCenter.postNotificationName('BLUEREPLY', received);
    });
  },


  /**
   * 延时知悉
   */
  delay: function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  executeInitCmdTasks: async function () {
    let currentTime = new Date().getTime();

    // await this.delay(150);
    // 发送时间校验指令
    // console.warn("main->sendInitCmd 发送时间校验初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');

    // await this.delay(150);
    // 发送页面初始化指令
    // console.warn("main->sendInitCmd 发送页面初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.postInit(this.data.connected);
  },

  /**
  * 页面初始化操作
  * @param {*} connected 
  */
  postInit: function (connected) {
    console.info('main->sendInitCmd 发送个页面指令 time ', new Date().getTime());
    WxNotificationCenter.postNotificationName('INIT', connected);
  },



  /******------>tab切换 start */

  toDianDongChuang() {
    this.setData({
      nowPage: "diandong",
      nowIndex: 0,
      title: "智能床架"
    })
  },
  toQiNang() {
    this.setData({
      nowPage: "qinang",
      nowIndex: 1,
      title: "舒适按摩"
    })
  },
  toLengNuan() {
    // 冷暖合并询问码
    var cmd = 'FFFFFFFFFE1000000000000000AA';
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    console.log(cmd)
    this.sendBlueCmd(cmd);
    this.setData({
      nowPage: "lengnuan",
      nowIndex: 2,
      title: "温度调节"
    })
  },

  /**
   * 发送蓝牙命令
   * @param {*} cmd 
   */
  sendBlueCmd(cmd) {
    util.sendBlueCmd(this.data.connected, cmd);
  },


  /**
   * 蓝牙回复
   * @param {*} received 
   */
  blueReply: function (received, connected) {
    console.info('main->blueReply-->received', received, connected);
    if (!received) {
      return;
    }
    received = received.toUpperCase();
    if (received.indexOf("FFFFFFFF01002714") > -1) {
      this.setData({
        cmd: received
      })
    }
  },

})