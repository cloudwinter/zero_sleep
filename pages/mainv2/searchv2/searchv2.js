// pages/searchv2/searchv2.js
const util = require('../../../utils/util')
const configManager = require('../../../utils/configManager')
const crcUtil = require('../../../utils/crcUtil');
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const app = getApp()
const defaultTime = 3;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: app.globalData.skin, //当前皮肤样式
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false
    }, // 导航栏
    time: defaultTime, // 倒计时默认3S
    type: '',//搜索的设备类型 
    connected: {}, // 已连接
    devices: [], // 搜索到的蓝牙列表,
    timeStop: false, // 倒计时中止
    startTime: '',
    endTime: '',
    showRSSI: false,
    deviceType: '',//设备类型 0A 0B 0C
    isIos: app.globalData.isIos,//设备类型
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    var connected = JSON.parse(options.connected);
    this.setData({
      type: options.type,
      connected: connected
    })

    if (this.data.type == 'diandong') {
      this.setData({
        deviceType: '0A'
      })
    } else if (this.data.type == 'qinang') {
      this.setData({
        deviceType: '0B'
      })
    } else if (this.data.type == 'lengnuan') {
      this.setData({
        deviceType: '0C'
      })
    }
    this.notifyBLECharacteristicValueChange();
    // 1、检查蓝牙是否打开
    this.openBluetoothAdapter();
  },

  /**
 * 页面显示时加载
 */
  onShow: function () {
    console.info("search-->onShow")
    // 设置当前的皮肤样式
    this.setData({
      skin: app.globalData.skin
    })
  },

  onUnload: function () {
    console.info("search2-->onUnload");
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
   * 倒计时
   */
  countDown: function (count) {
    if (this.data.timeStop) {
      // 中止
      this.setData({
        time: defaultTime
      })
      return;
    }
    this.setData({
      time: count - 1
    })
    if ((count - 1) == 0) {
      // 重置时间
      setTimeout(() => {
        this.setData({
          time: defaultTime
        })
      }, 500);
      return;
    }
    setTimeout(this.countDown, 1000, count - 1);
  },



  /**
   * 打开蓝牙适配器
   */
  openBluetoothAdapter: function () {
    var cur = this;
    wx.openBluetoothAdapter({
      success: (res) => {
        console.info('openBluetoothAdapter.success');
        cur.startDevicesDiscovery();
      },
      fail: (res) => {
        console.info('openBluetoothAdapter.fail', res);
        util.showToast(res.errCode === 10001 ? '请开启手机蓝牙功能' : res.errMsg);
        console.error('openBluetoothAdapter', res);
        if (res.errCode === 10001) {
          // 监听蓝牙状态
          wx.onBluetoothAdapterStateChange(function (res) {
            console.error('onBluetoothAdapterStateChange', res);
            if (res.available && cur.data.firstBlueStateChange) {
              cur.setData({
                firstBlueStateChange: false
              })
              cur.startDevicesDiscovery();
            }
          })
        }
      },
      complete: (res) => { },
    })
  },

  /**
   * 开始搜索蓝牙
   */
  startDevicesDiscovery: function () {
    var cur = this;
    util.showLoading("正在搜索");
    setTimeout(function () {
      cur.stopDevicesDiscovery();
    }, 1000 * defaultTime) //搜索3S
    this.countDown(defaultTime + 1); // 倒计时3S
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      powerLevel: 'high',
      success: (res) => {
        cur.onBluetoothDeviceFound();
        // cur.getBluetoothDevices();
      },
    })
  },

  /**
  * 停止搜索
  */
  stopDevicesDiscovery: function () {
    wx.hideLoading();
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log(res)
      },
      fail: function () {
        util.showToast('停止搜索失败');
      }
    })
  },


  /**
   * 搜索到蓝牙设备
   */
  onBluetoothDeviceFound: function () {
    var that = this;
    wx.onBluetoothDeviceFound(function (res) {
      if (res.devices[0]) {
        var mac = util.ab2hex(res.devices[0].advertisData);
        var sn = mac.slice(4, 8);
        if (sn == '88a0') {
          var isexist = false;
          var devs = that.data.devices;
          mac = mac.slice(8, 20); //取MAC
          devs.forEach(function (row, index) {
            if (mac == row.mac) {
              console.log("找到");
              isexist = true;
            }
          })
          if (!isexist && res.devices[0].localName) {
            var name = util.transSpecialChar(res.devices[0].localName);
            console.log("res.devices[0]", res.devices[0])
            console.log("deviceId",res.devices[0].deviceId,mac)
            console.error('蓝牙名称hex:' + res.devices[0].localName)
            console.error('蓝牙名称装换hex:' + name)
            if (devs.length >= 40) {
              console.error('蓝牙列表已超过10个', name);
            } else {
              if (!that.isValidBlueName(name)) {
                console.error('不是有效的蓝牙名称', name);
              } else {
                console.log("isValidBlueName", res.devices[0])
                if (res.devices[0].RSSI < -95) {
                  console.error('蓝牙强度小于-80', res.devices[0].RSSI);
                } else {
                  devs.push({
                    name: name,
                    mac: mac,
                    RSSI: res.devices[0].RSSI,
                    deviceId: res.devices[0].deviceId
                  })
                  console.log("当前 devicesList", devs);
                  that.setData({
                    devices: devs
                  });
                }
              }
            }
          }
        }
      }
    })
  },

  /**
   * 断开蓝牙连接
   */
  closeBLEConnection: function (deviceId) {
    var that = this;
    var connected = this.data.connected;
    if (!connected) {
      console.error('closeBLEConnection 断开异常,当前没有连接成功的对象', connected, deviceId);
      util.hideLoading();
      return;
    }
    if (!connected.deviceId) {
      console.error('closeBLEConnection 断开异常,当前没有连接成功的对象', connected, deviceId);
      util.hideLoading();
      return;
    }

    if (connected.deviceId != deviceId) {
      console.error('closeBLEConnection 断开异常:', connected, deviceId);
      util.hideLoading();
      return;
    }
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function () {
        console.info('closeBLEConnection 端口连接成功');
        // 清空连接状态
        that.setData({
          connected: {}
        })
      },
      fail: function (e) {
        util.showToast('断开连接失败,请重试');
        console.error('断开连接失败:', e);
      },
      complete: function () {
        console.info('closeBLEConnection complete完成');
        util.hideLoading();
      }
    })
  },

  /**
   * 断开蓝牙，释放资源，只有在onUpload时使用
   */
  closeBluetoothAdapter: function () {
    wx.closeBluetoothAdapter({
      success: (res) => {
        console.info("closeBluetoothAdapter sucess")
      },
      fail: (res) => {
        console.error("closeBluetoothAdapter", res)
      },
      complete: (res) => { },
    })

  },



  /******************------->页面函数操作---------华丽的分割线———————————————————— */

  /**
* 蓝牙搜索
*/
  search: function () {
    // 搜索前先clear设备列表
    this.setData({
      devices: []
    });
    this.startDevicesDiscovery();
  },


  /**
   * 发送连接蓝牙指令
   * @param {} e 
   */
  connect: function (e) {
    const device = e.currentTarget.dataset.device;
    var deviceId;
    if (this.data.isIos) {
      deviceId = device.mac.toUpperCase()
    } else {
      deviceId = device.deviceId.replaceAll(":","")
      deviceId = deviceId.toUpperCase()
    }
    console.log(deviceId)
    // APP/小程序下发下位设备的MAC地址
    var cmd = 'FFFFFFFF01002814' + this.data.deviceType + deviceId + '000000'
    cmd = cmd.toUpperCase()
    cmd = cmd + crcUtil.HexToCSU16(cmd);

    this.sendBlueCmd(cmd)

    util.showLoading("设备连接中")
  },


  /**
 * 是否是有效的蓝牙名称
 * @param {*} name 
 */
  isValidBlueName(name) {
    if (name) {
      if (this.data.type == 'diandong') {
        console.log("diandong", name.indexOf('TL-B'))
        if (name.indexOf('TL-B') > -1) {
          return true;
        }
      } else if (this.data.type == 'qinang') {
        if (name.indexOf('TL-A') > -1) {
          return true;
        }
      } else if (this.data.type == 'lengnuan') {
        if (name.indexOf('TL-W') > -1) {
          return true;
        }
      }
    }
    return false;
  },

  /**
  * 发送蓝牙命令
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
    cmd = cmd.toUpperCase();
    console.error('search->blueReply', cmd);
    if (cmd.indexOf('FFFFFFFF01002914') >= 0) {//APP下发MAC回复
      util.hideLoading()
      // APP/小程序 询问总控板当前连接状态
      var cmd = 'FFFFFFFF010026140F000000000000000000'
      cmd = cmd + crcUtil.HexToCSU16(cmd);
      console.log("cmd", cmd)
      this.sendBlueCmd(cmd);
    } else if (cmd.indexOf('FFFFFFFF01002714') >= 0) {
      // 总控板回复 APP/小程序 当前连接状态
      var connected = this.data.connected;
      var connectedStr = JSON.stringify(connected);
      let type = this.data.type
      console.log("跳转", type)
      wx.redirectTo({
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