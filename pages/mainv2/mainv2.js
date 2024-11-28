// pages/mainv2/mainv2.js
const util = require('../../utils/util')
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter')
const crcUtil = require('../../utils/crcUtil');
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
    cmd: '',//当前设备的状态码集合
    connected: {},
    isFirst: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    if (option && option.connected) {
      console.info("mainV2.onLoad option", option);
      var connected = JSON.parse(option.connected);
      var first = option.first
      console.info("mainV2->onLoad connected:", connected);
      this.setData({
        connected: connected,
        isFirst:first
      })
    }
  },

  onShow() {
    this.notifyBLECharacteristicValueChange();
    //发码询问状态
    util.showLoading('查询中...');
    // APP/小程序 询问总控板当前连接状态
    var cmd = 'FFFFFFFF010026140F000000000000000000'
    cmd = cmd + crcUtil.HexToCSU16(cmd);
    console.log("cmd", cmd)
    this.sendBlueCmd(cmd, ({
      success: (res) => {
        console.info('tapNetwork->发送成功');
      },
      fail: (res) => {
        console.error('tapNetwork->发送失败', res);
      }
    }));
  },

  onHide() {
    var connected = this.data.connected;
    wx.notifyBLECharacteristicValueChange({
      state: false, // 启用 notify 功能  
      deviceId: connected.deviceId,
      serviceId: connected.serviceId,
      characteristicId: connected.notifyCharacId,
      success: function () {
        console.info("notifyBLECharacteristicValueChange->success");
      },
      fail: function (res) {
        console.error("main->notifyBLECharacteristicValueChange error", res);
        util.showModal('关闭监听失败，请重新进入');
      }
    });
    wx.offBLECharacteristicValueChange();
  },

  /**
   * 点击智能床架、气囊床垫、冷暖床垫
   * @param {类型} type 
   */
  tapSearch(e) {
    let type = e.currentTarget.dataset.type
    var connectedStr = JSON.stringify(this.data.connected);
    var cmd = this.data.cmd
    // this.data.isFirst = false
    if (type == 'diandong') {
      let bedState = cmd.substr(18, 2) == '0A' ? true : false;
      if (!bedState) {
        wx.navigateTo({
          url: '/pages/mainv2/searchv2/searchv2?type=' + type + '&connected=' + connectedStr,
        })
        return
      }
    } else if (type == 'qinang') {
      let m1State = cmd.substr(24, 2) == '0B' ? true : false;
      if (!m1State) {
        wx.navigateTo({
          url: '/pages/mainv2/searchv2/searchv2?type=' + type + '&connected=' + connectedStr,
        })
        return
      }
    } else if (type == 'lengnuan') {
      let m2State = cmd.substr(30, 2) == '0C' ? true : false;
      if (!m2State) {
        wx.navigateTo({
          url: '/pages/mainv2/searchv2/searchv2?type=' + type + '&connected=' + connectedStr,
        })
        return
      }
    }
    var connected = this.data.connected;
    var connectedStr = JSON.stringify(connected);
    wx.navigateTo({
      url: '/pages/mainv2/bedstead/bedstead?type=' + type + '&connected=' + connectedStr + "&cmd=" + cmd,
    })
  },

  /**
   * 发送询问联网状态命令
   * @param {}} cmd 
   */
  sendBlueCmd(cmd, options) {
    var connected = this.data.connected;
    util.sendBlueCmd(connected, cmd, options);
  },

  /**
    * 蓝牙回复回调
    * @param {*} cmd 
    */
  blueReply(cmd) {
    util.hideLoading();
    console.error('search->blueReply', cmd);
    cmd = cmd.toUpperCase();
    this.setData({
      cmd: cmd
    })

    let bedState = cmd.substr(18, 2) == '0A' ? true : false;
    let m1State = cmd.substr(24, 2) == '0B' ? true : false;
    let m2State = cmd.substr(30, 2) == '0C' ? true : false;

    var type = ''
    if (bedState) {
      type = 'diandong'
    } else if (m1State) {
      type = 'qinang'
    } else if (m2State) {
      type = 'lengnuan'
    }

    var isFirst = this.data.isFirst
    if (type && isFirst) {
      this.data.isFirst = false
      var connected = this.data.connected;
      var connectedStr = JSON.stringify(connected);
      wx.navigateTo({
        url: '/pages/mainv2/bedstead/bedstead?type=' + type + '&connected=' + connectedStr + "&cmd=" + cmd,
      })
    }
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
        // that.executeInitCmdTasks();

      },
      fail: function (res) {
        console.error("main->notifyBLECharacteristicValueChange error", res);
        util.showModal('开启监听失败，请重新进入');
        util.hideLoading();
      }
    });
    wx.onBLECharacteristicValueChange((res) => {
      console.info('main->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received', received);
      that.blueReply(received, connected);
    });
  },
})