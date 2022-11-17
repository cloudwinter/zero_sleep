// pages/network/network.js
const configManager = require('../../utils/configManager');
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const WxNotificationCenter = require('../../utils/WxNotificationCenter');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {},
    status: '已连接',
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    },
    connectStatus: 0, // 当前连接状态 0待配网，1 配网中，2 配网失败，3 配网成功，4 配网成功 连接失败
    hasRemeberPwd: true,
    wifiSSID: '',
    wifiPwd: '',
    wifiShow: true,
    location: {
      latitude: '',
      longitude: '',
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let connected = configManager.getCurrentConnected();
    // connected = {
    //   deviceId: '111',
    //   serviceId: '111',
    //   writeCharacId: '111',
    // }
    this.setData({
      skin: app.globalData.skin,
      connected: connected
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    this.getConnected();
    this.getLocation();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },

  /**
   * 蓝牙回复回调
   * @param {*} cmd 
   */
  blueReply(cmd) {
    console.info('blueReply',cmd);
    if(cmd == undefined) {
        return;
    }
    let cmdCopy = cmd.toUpperCase();
    if (cmdCopy.indexOf('FFFFFFFF02001913') >= 0) {
      let status = cmdCopy.substr(18, 2);
      let connectStatus = 1;
      if (status == '00') {
        connectStatus = 2;
      } else if (status == '01') {
        connectStatus = 4;
      } else if (status == '0F') {
        connectStatus = 3;
      }
      this.setData({
        connectStatus: connectStatus
      })
      let sendCmd = 'FFFFFFFF02000A0A1204';
      let connected = this.data.connected;
      util.sendBlueCmd(connected, sendCmd);
    }
  },



  /**
   * 获取位置信息
   */
  getLocation() {
    let that = this;
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        console.info("location获取成功:", res);
        const latitude = res.latitude
        const longitude = res.longitude
        that.setData({
          location: {
            latitude: latitude,
            longitude: longitude
          }
        })
      },
      fail(e) {
        console.info("location获取失败:", e);
      }
    })

  },

  /**
   * 获取当前连接的WIFI信息
   */
  getConnected() {
    let that = this;
    wx.getConnectedWifi({
      success: function (e) {
        let pwd = configManager.getWifiPwd(e.wifi.SSID);
        console.log(e.wifi, pwd, 'wifi获取成功')
        that.setData({
          wifiSSID: e.wifi.SSID,
          wifiPwd: pwd
        })
      },
      fail: function (e) {
        console.log(e, 'wifi获取失败')
      }
    })
  },


  /**
   * 记住密码
   */
  remeberPwd() {
    let hasRemeberPwd = this.data.hasRemeberPwd;
    this.setData({
      hasRemeberPwd: !hasRemeberPwd
    });
  },


  showHide() {
    let wifiShow = this.data.wifiShow;
    this.setData({
      wifiShow: !wifiShow
    })
  },

  /**
   * 下一步
   */
  next() {
    // TODO
    let wifiSSID = this.data.wifiSSID;
    let wifiPwd = this.data.wifiPwd;
    if (wifiSSID == '' || wifiPwd == '') {
      util.showToast('WI-FI或密码不能为空');
      return;
    }
    configManager.putWifiPwd(wifiSSID, wifiPwd);
    this.sendNetwork();
  },




  /**
   * 重试
   */
  retry() {
    this.sendNetwork();
  },

  /**
   * 发送配网信息
   */
  sendNetwork() {
    this.setData({
      connectStatus: 1
    })
    let cmdPre = 'FFFFFFFF02001813';
    let wifiSSIDhex = util.strTo16Hex(this.data.wifiSSID);
    let wifiPwdHex = util.strTo16Hex(this.data.wifiPwd);
    let locationHex = util.floatTo16Hex(this.data.location.longitude) + util.floatTo16Hex(this.data.location.latitude);
    let cmdWifiSSID01 = cmdPre + "01";
    let cmdWifiSSID02 = cmdPre + "02";
    let cmdWifiSSID03 = cmdPre + "03";
    let cmdWifiSSID04 = cmdPre + "04";
    let cmdWifiPwd01 = cmdPre + "05";
    let cmdWifiPwd02 = cmdPre + "06";
    let cmdWifiLocation = cmdPre + "07" + locationHex;
    cmdWifiLocation = cmdWifiLocation + crcUtil.HexToCSU16(cmdWifiLocation);

    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        if (wifiSSIDhex.length - 1 >= i) {
          cmdWifiSSID01 = cmdWifiSSID01 + wifiSSIDhex.charAt(i);
        } else {
          cmdWifiSSID01 = cmdWifiSSID01 + 'F';
        }
        if (i == 15) {
          cmdWifiSSID01 = cmdWifiSSID01 + crcUtil.HexToCSU16(cmdWifiSSID01);
        }
      } else if (16 <= i && i < 32) {
        if (wifiSSIDhex.length - 1 >= i) {
          cmdWifiSSID02 = cmdWifiSSID02 + wifiSSIDhex.charAt(i);
        } else {
          cmdWifiSSID02 = cmdWifiSSID02 + 'F';
        }
        if (i == 31) {
          cmdWifiSSID02 = cmdWifiSSID02 + crcUtil.HexToCSU16(cmdWifiSSID02);
        }
      } else if (32 <= i && i < 48) {
        if (wifiSSIDhex.length - 1 >= i) {
          cmdWifiSSID03 = cmdWifiSSID03 + wifiSSIDhex.charAt(i);
        } else {
          cmdWifiSSID03 = cmdWifiSSID03 + 'F';
        }
        if (i == 47) {
          cmdWifiSSID03 = cmdWifiSSID03 + crcUtil.HexToCSU16(cmdWifiSSID03);
        }
      } else {
        if (wifiSSIDhex.length - 1 >= i) {
          cmdWifiSSID04 = cmdWifiSSID04 + wifiSSIDhex.charAt(i);
        } else {
          cmdWifiSSID04 = cmdWifiSSID04 + 'F';
        }
        if (i == 63) {
          cmdWifiSSID04 = cmdWifiSSID04 + crcUtil.HexToCSU16(cmdWifiSSID04);
        }
      }
    }

    for (let j = 0; j < 32; j++) {
      if (j < 16) {
        if (wifiPwdHex.length - 1 >= j) {
          cmdWifiPwd01 = cmdWifiPwd01 + wifiPwdHex.charAt(j);
        } else {
          cmdWifiPwd01 = cmdWifiPwd01 + 'F';
        }
        if (j == 15) {
          cmdWifiPwd01 = cmdWifiPwd01 + crcUtil.HexToCSU16(cmdWifiPwd01);
        }
      } else {
        if (wifiPwdHex.length - 1 >= j) {
          cmdWifiPwd02 = cmdWifiPwd02 + wifiPwdHex.charAt(j);
        } else {
          cmdWifiPwd02 = cmdWifiPwd02 + 'F';
        }
        if (j == 31) {
          cmdWifiPwd02 = cmdWifiPwd02 + crcUtil.HexToCSU16(cmdWifiPwd02);
        }
      }
    }
    let connected = this.data.connected;
    util.sendBlueCmd(connected, cmdWifiSSID01);
    setTimeout(() => {
      util.sendBlueCmd(connected, cmdWifiSSID02);
    }, 200);
    setTimeout(() => {
      util.sendBlueCmd(connected, cmdWifiSSID03);
    }, 400);
    setTimeout(() => {
      util.sendBlueCmd(connected, cmdWifiSSID04);
    }, 600);
    setTimeout(() => {
      util.sendBlueCmd(connected, cmdWifiPwd01);
    }, 800);
    setTimeout(() => {
      util.sendBlueCmd(connected, cmdWifiPwd02);
    }, 1000);
    setTimeout(() => {
      util.sendBlueCmd(connected, cmdWifiLocation);
    }, 1200);


    // setTimeout(()=>{
    //   this.blueReply('FFFFFFFF02001913010FFFFFFFF');
    // }, 6000)
  },


  /**
   * 取消
   */
  cancel() {
    this.setData({
      connectStatus: 0
    })
  },

  /**
   * 完成
   */
  finish() {
    // 返回上一页
    wx.navigateBack({
      delta: 1,
    })
  }
})