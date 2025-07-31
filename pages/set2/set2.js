// pages/mainv2/setting2/setting2.js
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
    diandongState: false,
    qinangState: false,
    lengnuanState: false,
    delta: 0,
    deviceType: "",//选择断开的设备
    deviceName: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      delta: option.delta,
      connected: connected
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
  },

  onShow() {
    if (this.data.delta != 2) {//非主界面过来，要注册蓝牙广播
      this.notifyBLECharacteristicValueChange();
    }

    // 设置当前的皮肤样式
    this.setData({
      skin: app.globalData.skin
    })
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


  /**
 * 生命周期函数--监听页面卸载
 */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },


  //点击断开连接
  connectTap(e) {
    var that = this
    let deviceType = e.currentTarget.dataset.type
    let deviceName = e.currentTarget.dataset.name
    wx.showModal({
      title: '确认断开当前设备?',
      success(res) {
        console.log(res)
        if (res.confirm) {
          that.setData({
            deviceType: deviceType,
            deviceName: deviceName
          })
          //断开MCU连接的设备
          var cmd = 'FFFFFFFF01002814' + deviceType + '000000000000000100'
          cmd = cmd.toUpperCase()
          cmd = cmd + crcUtil.HexToCSU16(cmd);
          that.sendBlueCmd(cmd)
          util.showLoading("设备断开中")

        }
      }
    })
  },


  /**
   * 发送蓝牙命令
   */
  sendBlueCmd(cmd, options) {
    util.hideLoading();
    var connected = this.data.connected;
    util.sendBlueCmd(connected, cmd, options);
  },

  /**
  * 蓝牙回复回调
  * @param {*} cmd 
  */
  blueReply(cmd) {
    var that = this;
    cmd = cmd.toUpperCase();
    console.error('set2->blueReply', cmd);
    if (cmd.indexOf("FFFFFFFF01002714") > -1) {
      // 总控板回复 APP/小程序 当前连接状态
      let diandongState = cmd.substr(18, 2) == '0A' ? true : false;
      let qinangState = cmd.substr(24, 2) == '0B' ? true : false;
      let lengnuanState = cmd.substr(30, 2) == '0C' ? true : false;
      that.setData({
        diandongState: diandongState,
        qinangState: qinangState,
        lengnuanState: lengnuanState
      })

      let pages = getCurrentPages()
      if (pages.length >= 2) {
        let curPage = pages[pages.length - 1]; // 当前页面
        let prePage = pages[pages.length - 2]; // 上一页面
        prePage.setData({
          cmd:cmd
        })
      }

    } else if (cmd.indexOf("FFFFFFFF01002814") > -1) {
      console.log("delta", that.data.delta)
      setTimeout(() => {
        wx.hideLoading()
        wx.navigateTo({
          url: '/pages/mainv2/searchv2/searchv2?type=' + that.data.deviceName,
        })
      }, 2000);
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
        util.showModal('蓝牙通讯不稳定，请重新进入');
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