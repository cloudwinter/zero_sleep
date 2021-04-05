const util = require('../../utils/util')
const configManager = require('../../utils/configManager')
const app = getApp()
const defaultTime = 3;

Page({
    data: {
      skin: app.globalData.skin, //当前皮肤样式
      navbar: {
        loading: false,
        color: '#FFFFFF',
        background: '#0A0A0C',
        show: true,
        animated: false,
      }, // 导航栏
      time: defaultTime, // 倒计时默认3S
      connected: {}, // 已连接
      devices: [], // 搜索到的蓝牙列表,
      firstBlueStateChange: true, // 首次蓝牙状态变更回调
      firstAutoConnected: true, // 是否首次自动回调
      timeStop: false // 倒计时中止
    },
    /**
     * 页面初始化加载
     */
    onLoad: function () {
      console.info("search-->onLoad")
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
      var that = this;
      console.info("search-->onUnload");
      // 断开连接
      var connected = that.data.connected;
      if (connected && connected.deviceId) {
        that.closeBLEConnection(connected.deviceId);
        setTimeout(() => {
          // 释放资源
          that.closeBluetoothAdapter();
        }, 500);
      } else {
        // 释放资源
        that.closeBluetoothAdapter();
      }

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
        complete: (res) => {},
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
      var lastConnectedDeviceId = configManager.getLastConnected();
      var firstAutoConnected = this.data.firstAutoConnected;
      console.log('onBluetoothDeviceFound 启动', lastConnectedDeviceId, firstAutoConnected);
      wx.onBluetoothDeviceFound(function (res) {
        console.log("onBluetoothDeviceFound 搜索到", res);
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
              console.error('蓝牙名称装换hex:' + name)
              if (devs.length >= 6) {
                console.error('蓝牙列表已超过6个', name);
              } else {
                if (!that.isValidBlueName(name)) {
                  console.error('不是有效的蓝牙名称', name);
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
                  if (firstAutoConnected && lastConnectedDeviceId && lastConnectedDeviceId == res.devices[0].deviceId) {
                    // 发起自动连接，处理下确保只触发一次
                    that.setData({
                      firstAutoConnected: false,
                      timeStop: true,
                    });
                    // 停止搜索
                    that.stopDevicesDiscovery();
                    // 自动连接
                    var devices = {
                      deviceId: res.devices[0].deviceId,
                      name: name
                    }
                    that.startConnect(res.devices[0].deviceId, devices);
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
        complete: (res) => {},
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
      // var connected = this.data.connected;
      // if(connected && connected.deviceId) {
      //   // 如果有已连接的蓝牙，需要断开，不然不能搜索(不确定)
      //   this.closeBLEConnection(connected.deviceId);
      // }
      this.startDevicesDiscovery();
    },




    /**
     * 进入操作页面
     * @param {*} e 
     */
    enter: function (e) {
      const device = e.currentTarget.dataset.device;
      var connected = this.data.connected;
      if (connected && connected.deviceId && connected.deviceId != device.deviceId) {
        util.showToast('当前设备连接状态异常');
        return;
      }
      this.turnToMain(false);
    },

    /**
     * 断开连接
     * @param {} e 
     */
    disconnect: function (e) {
      const device = e.currentTarget.dataset.device;
      var connected = this.data.connected;
      if (connected && connected.deviceId && connected.deviceId == device.deviceId) {
        util.showLoading('断开中...');
        this.closeBLEConnection(connected.deviceId);
      } else {
        console.error("disconnect 异常：", connected, device);
      }
    },


    /**
     * 连接蓝牙
     * @param {} e 
     */
    connect: function (e) {
      const device = e.currentTarget.dataset.device;
      var connected = this.data.connected;
      if (connected && connected.deviceId &&
        connected.deviceId != device.deviceId) {
        this.closeBLEConnection(connected.deviceId);
      }
      // 开始连接
      this.startConnect(device.deviceId, device);

    },

    /**
     * 开始连接
     * @param {} deviceId 
     */
    startConnect(deviceId, device) {
      var that = this;
      util.showLoading('连接中...')
      console.log("startConnect->deviceId:" + deviceId, device);
      var localName = util.transSpecialChar(device.name);
      wx.createBLEConnection({
        deviceId: deviceId,
        success: function (res) {
          console.log(res.errMsg);
          // 保存最近一次连接的设备
          configManager.putLastConnected(deviceId);
          // 设置连接的设备信息
          that.setData({
            connected: {
              deviceId: deviceId,
              name: localName
            }
          })
          // 获取连接设备的service服务
          setTimeout(function () {
            that.getBLService(deviceId);
          }, 100);


          // 监听蓝牙断开的场景
          wx.onBLEConnectionStateChange(function (res) {
            // 该方法回调中可以用于处理连接意外断开等异常情况
            console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
            var connected = that.data.connected;
            if (connected && connected.deviceId && connected.deviceId == res.deviceId) {
              if (!res.connected) {
                // false表示连接断开 处理断开情况
                // 清空连接状态
                that.setData({
                  connected: {}
                })

              }
            }
          })

        },
        fail: function (res) {
          wx.hideLoading();
          console.error('startConnect createBLEConnection失败：', res);
          util.showModal('连接设备失败,请重试');
        }
      })
    },



    /**
     * 获取连接设备的service服务
     */
    getBLService(deviceId) {
      var that = this;
      wx.getBLEDeviceServices({
        deviceId: deviceId,
        success: function (res) {
          console.log('device services:', JSON.stringify(res.services));
          var services = res.services;
          if (services && services.length > 0) {
            for (let i = 0; i < services.length; i++) {
              if (services[i].isPrimary) {
                // 获取 主serviceId 
                console.log('getBLEDeviceServices:[' + i + "]", services[i])
                that.setData({
                  ['connected.serviceId']: services[i].uuid
                })
                setTimeout(function () {
                  //获取characterstic值
                  that.getBLcharac(deviceId, services[i].uuid);
                }, 100)
                return;
              }
            }
          }
        },
        fail: function (res) {
          wx.hideLoading();
          util.showModal(res.errMsg);
        }
      })
    },

    /**
     * 获取特征值
     * @param {*} deviceId 
     * @param {*} serviceId 
     */
    getBLcharac(deviceId, serviceId) {
      var that = this;
      wx.getBLEDeviceCharacteristics({
        deviceId: deviceId,
        serviceId: serviceId,
        success: function (res) {
          console.log("getBLcharac", res);
          for (var i = 0; i < res.characteristics.length; i++) {
            if (res.characteristics[i].properties.notify) {
              console.log("getBLcharac", res.characteristics[i].uuid);
              that.setData({
                ['connected.notifyCharacId']: res.characteristics[0].uuid
              })
            }
            if (res.characteristics[i].properties.write) {
              that.setData({
                ['connected.writeCharacId']: res.characteristics[0].uuid
              })
            } else if (res.characteristics[i].properties.read) {
              that.setData({
                ['connected.readCharacId']: res.characteristics[0].uuid
              })
            }
          }
          console.log('device connected:', that.data.connected);
          that.turnToMain(true);
        },
        fail: function (res) {
          console.error("getBLcharac->fail", res);

          util.showModal(res.errMsg);
        },
        complete: function () {
          wx.hideLoading();

        }
      })
    },


    /**
     * 跳转到操作页面
     * @param {是否首次进入} first 
     */
    turnToMain(first) {
      var connected = this.data.connected;
      var connectedStr = JSON.stringify(connected);
      var name = connected.name;
      var kuaijieType = this.getKuaijieType(name);
      var weitiaoType = this.getWeitiaoType(name);
      console.info('turnToMain', connected, kuaijieType, weitiaoType);
      // TODO 还需要过滤类型
      wx.navigateTo({
        url: '../main/main?first=' + first + '&connected=' + connectedStr + '&kuaijieType=' + kuaijieType + '&weitiaoType=' + weitiaoType,
      })
    },


    /**
     * 是否是有效的蓝牙名称
     * @param {*} name 
     */
    isValidBlueName(name) {
      if (name) {
        if (name.indexOf('QMS-IQ') >= 0 ||
          name.indexOf('QMS-I06') >= 0 ||
          name.indexOf('QMS-I06') >= 0 ||
          name.indexOf('QMS-L04') >= 0 ||
          name.indexOf('QMS-JQ-D') >= 0 ||
          name.indexOf('QMS-NQ') >= 0 ||
          name.indexOf('QMS-MQ') >= 0 ||
          name.indexOf('QMS-U700') >= 0 ||
          name.indexOf('QMS4') >= 0 ||
          name.indexOf('QMS3') >= 0 ||
          name.indexOf('QMS2') >= 0 ||
          name.indexOf('QMS-KQ2') >= 0 ||
          name.indexOf('QMS-K12') >= 0 ||
          name.indexOf('QMS-KQ') >= 0 ||
          name.indexOf('QMS-K01') >= 0 ||
          name.indexOf('QMS-KQ-H') >= 0 ||
          name.indexOf('QMS-H02') >= 0 ||
          name.indexOf('QMS-DFQ') >= 0 ||
          name.indexOf('QMS-430') >= 0 ||
          name.indexOf('QMS-444') >= 0 ||
          name.indexOf('QMS-DQ') >= 0 ||
          name.indexOf('QMS-443') >= 0) {
          return true;
        }
      }
      return true;
    },


    /**
     * 获取快捷类型
     * @param {*} name 
     */
    getKuaijieType(name) {
      if (name) {
        if (name.indexOf('QMS-IQ') >= 0 ||
          name.indexOf('QMS-I06') >= 0 ||
          name.indexOf('QMS-I06') >= 0 ||
          name.indexOf('QMS-L04') >= 0) {
          return 'K1';
        } else if (name.indexOf('QMS-JQ-D') >= 0 ||
          name.indexOf('QMS-NQ') >= 0 ||
          name.indexOf('QMS-MQ') >= 0 ||
          name.indexOf('QMS-U700') >= 0 ||
          name.indexOf('QMS4') >= 0 ||
          name.indexOf('QMS3') >= 0 ||
          name.indexOf('QMS2') >= 0) {
          return 'K2';
        } else if (name.indexOf('QMS-KQ2') >= 0 ||
          name.indexOf('QMS-K12') >= 0) {
          return 'K6';
        } else if (name.indexOf('QMS-KQ') >= 0 ||
          name.indexOf('QMS-K01') >= 0 ||
          name.indexOf('QMS-KQ-H') >= 0 ||
          name.indexOf('QMS-H02') >= 0) {
          return 'K3';
        } else if (name.indexOf('QMS-DFQ') >= 0 ||
          name.indexOf('QMS-430') >= 0 ||
          name.indexOf('QMS-444') >= 0) {
          return 'K4';
        } else if (name.indexOf('QMS-DQ') >= 0 ||
          name.indexOf('QMS-443') >= 0) {
          return 'K5';
        } else if (name.indexOf('S3-2') >= 0) {
          return 'K2';
        }
      }
      // 默认K1
      return 'K1';
    },


    /**
     * 获取微调类型
     * @param {*} name 
     */
    getWeitiaoType(name) {
      if (name) {
        if (name.indexOf('QMS-IQ') >= 0 ||
          name.indexOf('QMS-I06') >= 0 ||
          name.indexOf('QMS-I06') >= 0 ||
          name.indexOf('QMS-L04') >= 0) {
          return 'W1';
        } else if (name.indexOf('QMS-JQ-D') >= 0 ||
          name.indexOf('QMS4') >= 0) {
          return 'W2'
        } else if (name.indexOf('QMS-NQ') >= 0 || name.indexOf('QMS3') >= 0) {
          return 'W3'
        } else if (name.indexOf('QMS-MQ') >= 0 || name.indexOf('QMS2') >= 0) {
          return 'W4'
        } else if (name.indexOf('QMS-U700') >= 0) {
          return 'W9';
        } else if (
          name.indexOf('QMS-KQ-H') >= 0 ||
          name.indexOf('QMS-H02') >= 0) {
          return 'W6';
        } else if (name.indexOf('QMS-KQ2') >= 0 ||
          name.indexOf('QMS-K12') >= 0) {
          return 'W4';
        } else if (name.indexOf('QMS-KQ') >= 0 ||
          name.indexOf('QMS-K01') >= 0) {
          return 'W5'
        } else if (name.indexOf('QMS-DFQ') >= 0 ||
          name.indexOf('QMS-430') >= 0 ||
          name.indexOf('QMS-444') >= 0) {
          return 'W7';
        } else if (name.indexOf('QMS-DQ') >= 0 ||
          name.indexOf('QMS-443') >= 0) {
          return 'W8';
        } else if (name.indexOf('S3-2') >= 0) {
          return 'W10';
        }
      }
      // 默认K1
      return 'W1';
    },




  },











)