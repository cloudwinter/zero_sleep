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
    delta: 0
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
    this.notifyBLECharacteristicValueChange();
    //发码询问状态
    util.showLoading('查询中...');
    var cmd = 'FFFFFFFF010020140F000000000000000000'
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

  show: function () {
    // 设置当前的皮肤样式
    this.setData({
      skin: app.globalData.skin
    })
  },

  //点击断开连接
  connectTap(e) {
    var that = this
    let deviceType = e.currentTarget.dataset.type
    wx.showModal({
      title: '是否断开当前设备并返回首页?',
      success(res) {
        console.log(res)
        if (res.confirm) {
          var cmd = 'FFFFFFFF01002214' + deviceType + '000000000000000100'
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
    if (cmd.indexOf("FFFFFFFF01002114") > -1) {
      let diandongState = cmd.substr(18, 2) == '0A' ? true : false;
      let qinangState = cmd.substr(24, 2) == '0B' ? true : false;
      let lengnuanState = cmd.substr(30, 2) == '0C' ? true : false;
      that.setData({
        diandongState: diandongState,
        qinangState: qinangState,
        lengnuanState: lengnuanState
      })
    } else if (cmd.indexOf("FFFFFFFF01002214") > -1) {
      console.log("delta", that.data.delta)
      var delta = that.data.delta
      setTimeout(() => {
        wx.hideLoading()
        if (delta == 1) {
          wx.navigateBack({
            delta: 1
          });
        } else if (delta == 2) {
          wx.navigateBack({
            delta: 2
          });
        }else{
          wx.navigateBack();
        }
      }, 5000);
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
      },
      fail: function (res) {
        console.error("main->notifyBLECharacteristicValueChange error", res);
        util.showModal('开启监听失败，请重新进入');
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