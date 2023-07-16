// pages/set.js
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
    items: [{
        value: 'dark',
        name: '深黑',
        checked: 'true'
      },
      {
        value: 'orange',
        name: '紫色'
      },
    ],
    dialogShow: false, // 模式对话框
    selectedRadio: 'drak',
    xunhuanModeItemShow: false, // 循环模式item
    faultDebugShow: false,
    debugDialogShow: false, // 故障调试对话框
    faultPart: '',
    faultCause: '',
    alarmStatus: '未设置',
    alarmSwitch: false,
    tongbukongzhiItemShow: false, // 同步控制的item
    tongbukongzhiSWitch: false, // 同步控制的开关
    zhinengshuimianItemShow: false, //显示心率带链接跳转的item
    mac: '', // mac地址
    jumpSucApp: false, // 是否成功跳转到其他小程序
    preJumpConnected: {}, // 跳转前的连接
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    // connected = {
    //   deviceId: "111",
    //   name:'QMS-IQ-100000'
    // }
    let alarmSwitch = false;
    let status = this.data.status;
    let faultDebugShow = false;
    let xunhuanModeItemShow = this.data.xunhuanModeItemShow;
    if (util.isNotEmptyObject(connected)) {
      status = '已连接';
      alarmSwitch = configManager.showAlarmSwitch(connected.deviceId);
      faultDebugShow = this.isShowFaultDebug(connected.name);
      if (connected.name.indexOf('S4-HL') >= 0 || connected.name.indexOf('S5-Y2') >= 0 ||
        connected.name.indexOf('S3-5') >= 0 || connected.name.indexOf('S5-Y3') >= 0) {
        xunhuanModeItemShow = true;
      }
    } else {
      status = '未连接';
    }
    this.setData({
      skin: app.globalData.skin,
      selectedRadio: app.globalData.skin,
      connected: connected,
      status: status,
      faultDebugShow: faultDebugShow,
      alarmSwitch: alarmSwitch,
      xunhuanModeItemShow: xunhuanModeItemShow
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);

  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },

  /**
   * 
   */
  onShow: function () {
    this.sendInitCmd();
    let alarmStatus = this.data.alarmStatus;
    if (util.isNotEmptyObject(this.data.connected)) {
      let alarm = configManager.getAlarm(this.data.connected.deviceId);
      if (util.isNotEmptyObject(alarm)) {
        if (alarm.isOpenAlarm) {
          alarmStatus = '已开启';
        } else {
          if (alarm.time) {
            alarmStatus = '已关闭';
          } else {
            alarmStatus = '未设置';
          }
        }
      } else {
        alarmStatus = '未设置';
      }
    } else {
      alarmStatus = '未连接';
      var jumpSucApp = this.data.jumpSucApp;
      var preJumpConnected = this.data.preJumpConnected;
      if (jumpSucApp && util.isNotEmptyObject(preJumpConnected)) {
        // 如果是从其他小程序返回的，自动连接
        startConnect(preJumpConnected.deviceId, preJumpConnected.name);
      }
    }
    this.setData({
      alarmStatus: alarmStatus
    })
  },



  /******----------------->自定义函数 */

  sendInitCmd() {
    let connected = this.data.connected;
    if (!util.isNotEmptyObject(connected)) {
      util.showToast('当前设备未连接');
      return;
    }


    // 发送同步控制指令码
    let cmd = 'FFFFFFFF01000A0B0F2104';
    util.sendBlueCmd(connected, cmd);

    // 发码询问主板是否连接心率带
    setTimeout(() => {
      let inquiryCmd = 'FFFFFFFF01000C0B0F2304';
      util.sendBlueCmd(connected, inquiryCmd);
    }, 200);
  },


  isShowFaultDebug(name) {
    if (name) {
      if (name.indexOf('QMS-IQ') >= 0 ||
        name.indexOf('QMS-I06') >= 0 || name.indexOf('QMS-I16') >= 0 || name.indexOf('QMS-I26') >= 0 || name.indexOf('QMS-I36') >= 0 ||
        name.indexOf('QMS-I46') >= 0 ||
        name.indexOf('QMS-I56') >= 0 || name.indexOf('QMS-I66') >= 0 || name.indexOf('QMS-I76') >= 0 || name.indexOf('QMS-I86') >= 0 ||
        name.indexOf('QMS-I96') >= 0 ||
        name.indexOf('QMS-L04') >= 0 || name.indexOf('QMS-L14') >= 0 || name.indexOf('QMS-L24') >= 0 || name.indexOf('QMS-L34') >= 0 ||
        name.indexOf('QMS-L44') >= 0 || name.indexOf('QMS-L54') >= 0 || name.indexOf('QMS-L64') >= 0 || name.indexOf('QMS-L74') >= 0 ||
        name.indexOf('QMS-L84') >= 0 || name.indexOf('QMS-L94') >= 0 ||
        name.indexOf('QMS-LQ') >= 0) {
        return true;
      }
    }
    return false;
  },


  /**
   * 蓝牙回复回调
   * @param {*} cmd 
   */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    if (cmd.indexOf('FFFFFFFF01000A0B') >= 0 || cmd.indexOf('FFFFFFFF0100090B') >= 0) {
      // 同步控制回码
      let tongbukongzhiSWitch = cmd.substr(16, 2) == '01' ? true : false;
      this.setData({
        tongbukongzhiItemShow: true,
        tongbukongzhiSWitch: tongbukongzhiSWitch
      })
      let connected = this.data.connected;
      configManager.putTongbukzShow(true, connected.deviceId);
      configManager.putTongbukzSwitch(tongbukongzhiSWitch, connected.deviceId);
      return;
    } else if (cmd.indexOf('FFFFFFFF01000C0B00') >= 0) {
      this.setData({
        zhinengshuimianItemShow: false
      })
      return;
    } else if (cmd.indexOf('FFFFFFFF01000C0B01') >= 0) {
      var macCmd = cmd.substr(18, 12);
      this.setData({
        zhinengshuimianItemShow: true,
        mac: macCmd
      });
      return;
    }
    var prefix = cmd.substr(0, 12);
    console.info('set->askBack', cmd, prefix);
    if (prefix != 'FFFFFFFF0304') {
      return;
    }
    var faultPart = '';
    let partVal = cmd.substr(12, 4).toUpperCase();
    if ('6008' == partVal || '4002' == partVal) {
      faultPart = '头部';
    } else if ('6009' == partVal || '4004' == partVal) {
      faultPart = '背部';
    } else if ('600C' == partVal) {
      faultPart = '左边臀部';
    } else if ('600D' == partVal) {
      faultPart = '右边臀部';
    } else if ('6007' == partVal) {
      faultPart = '左边腿部';
    } else if ('600A' == partVal) {
      faultPart = '右边腿部';
    } else if ('60CD' == partVal || '400D' == partVal) {
      faultPart = '臀部';
    } else if ('607A' == partVal || '400A' == partVal) {
      faultPart = '腿部';
    }

    var faultCause = '';
    let causeVal = cmd.substr(16, 4).toUpperCase();
    if ('000A' == causeVal) {
      faultCause = '电机损坏';
    } else if ('0014' == causeVal) {
      faultCause = '电机过载';
    } else if ('001E' == causeVal) {
      faultCause = '电机短路';
    } else if ('00C8' == causeVal) {
      faultCause = '测距损坏';
    } else if ('00D2' == causeVal) {
      faultCause = '同组测距损坏';
    } else if ('00DC' == causeVal) {
      faultCause = '距离差值过大';
    } else if ('00E6' == causeVal) {
      faultCause = '电机反向动作';
    } else if ('0064' == causeVal) {
      faultCause = '距离不在范围';
    } else if ('006E' == causeVal) {
      faultCause = '距离突变';
    } else if ('0078' == causeVal) {
      faultCause = '目标位置偏离';
    } else if ('0000' == causeVal) {
      faultCause = '设备一切正常';
    }

    this.setData({
      faultPart: faultPart,
      faultCause: faultCause
    })

  },


  /**
   * 设置
   * @param {}} e 
   */
  set: function (e) {
    wx.navigateBack({
      delta: 2,
      complete: (res) => {
        console.info('返回蓝牙搜索界面')
      },
    })
  },

  /**
   * 换肤
   * @param {*} e 
   */
  changeSkip: function (e) {
    // var skin = e.target.dataset.flag;
    // console.log(skin);
    // configManager.setSkin(skin);
    this.setData({
      dialogShow: true
    })
  },

  /**
   * 闹钟
   * @param {*} e 
   */
  alarm: function (e) {
    wx.navigateTo({
      url: '/pages/alarm/alarm',
    })
  },


  /**
   * 循环item
   * @param {*} e 
   */
  xunhuanModeItemTap: function (e) {
    var jumpUrl = '';
    var name = this.data.connected.name;
    if (name.indexOf('S3-5') >= 0 || name.indexOf('S5-Y3') >= 0) {
      jumpUrl = '/pages/nurseset/nurseset2'
    } else {
      jumpUrl = '/pages/nurseset/nurseset'
    }
    wx.navigateTo({
      url: jumpUrl,
    })
  },

  /**
   * 智能睡眠
   * @param {*} e 
   */
  zhinengshuimianModeItemTap: function (e) {
    var jumpPath = 'pages/index/index?mac=' + this.data.mac;
    wx.navigateToMiniProgram({
      appId: 'wxbbdd4b1b88358610',
      path: jumpPath,
      envVersion: 'trial', //develop,trial,release
      success(res) {
        // 打开成功
        console.info('跳转成功');
      }
    })


    // // 断开蓝牙连接
    // var that = this;
    // var connected = this.data.connected;
    // var status = this.data.status;
    // if (connected && connected.deviceId && status == '已连接') {
    //   util.showLoading('断开中...');
    //   var deviceId = connected.deviceId;
    //   wx.closeBLEConnection({
    //     deviceId: deviceId,
    //     success: function () {
    //       console.info('closeBLEConnection 断开连接成功');
    //       // 清空连接状态
    //       that.setData({
    //         connected: {},
    //         status: "未连接"
    //       })
    //       configManager.putCurrentConnected(that.data.connected);
    //       that.jumpToApp();
    //     },
    //     fail: function (e) {
    //       util.showToast('断开连接失败,请重试');
    //       console.error('断开连接失败:', e);
    //     },
    //     complete: function () {
    //       console.info('closeBLEConnection complete完成');
    //       util.hideLoading();
    //     }
    //   })
    // } else {
    //   this.jumpToApp();
    // }
  },

  /**
   * 跳转到其他app
   * @param {*} e 
   */
  jumpToApp: function (e) {
    var connected = this.data.connected;
    wx.navigateToMiniProgram({
      appId: 'wxbbdd4b1b88358610',
      // 参数传递
      // extraData: {
      //   foo: 'bar'
      // },
      envVersion: 'trial', //develop,trial,release
      success(res) {
        // 打开成功
        this.setData({
          jumpSucApp: true,
          preJumpConnected: connected
        })
      }
    })
  },


  /**
   * 同步控制开关
   * @param {}} e 
   */
  tongbuItemSwitch: function (e) {
    let connected = this.data.connected;
    if (!util.isNotEmptyObject(connected)) {
      util.showToast('当前设备未连接');
      return;
    }
    var tongbukongzhiSWitch = this.data.tongbukongzhiSWitch;
    let cmd;
    if (tongbukongzhiSWitch) {
      cmd = 'FFFFFFFF0100090B00';
    } else {
      cmd = 'FFFFFFFF0100090B01';
    }
    this.setData({
      tongbukongzhiSWitch: tongbukongzhiSWitch
    })
    cmd = cmd + crcUtil.HexToCSU16(cmd);
    util.sendBlueCmd(connected, cmd);
  },


  /**
   * 故障调试
   * @param {*} e 
   */
  faultDebug: function (e) {
    let connected = this.data.connected;
    if (!util.isNotEmptyObject(connected)) {
      util.showToast('当前设备未连接');
      return;
    }
    // 发送故障读取码
    let cmd = 'FFFFFFFF03005A0002FED2';
    util.sendBlueCmd(connected, cmd);
    this.setData({
      debugDialogShow: true
    })

  },

  /**
   * 单选时间
   * @param {*} e 
   */
  radioChange: function (e) {
    console.info('radioChange', e);
    this.setData({
      selectedRadio: e.detail.value
    })
  },

  onModalClick: function (e) {
    var ctype = e.target.dataset.ctype;
    var selectedRadio = this.data.selectedRadio;
    this.setData({
      dialogShow: false
    })
    if (ctype == 'confirm') {
      // 确认
      configManager.setSkin(selectedRadio);
      app.globalData.skin = selectedRadio;
      this.setData({
        skin: selectedRadio
      })
    } else {
      // 取消
      this.setData({
        selectedRadio: this.data.skin
      })
    }
  },

  onModalDebugClick: function (e) {
    this.setData({
      debugDialogShow: false,
      faultPart: '',
      faultCause: ''

    })
  },



  /**----------蓝牙连接--------- */
  /**
   * 开始连接
   * @param {} deviceId 
   */
  startConnect(deviceId, localName) {
    var that = this;
    util.showLoading('连接中...')
    console.log("startConnect->deviceId:" + deviceId);
    wx.createBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        console.log(res.errMsg);
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
        //console.log('device services:', JSON.stringify(res.services));
        var services = res.services;
        if (services && services.length > 0) {
          for (let i = 0; i < services.length; i++) {
            if (services[i].isPrimary) {
              // 获取 主serviceId 
              //console.log('getBLEDeviceServices:[' + i + "]", services[i])
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
        configManager.putCurrentConnected(that.data.connected);
        that.setData({
          status: "已连接",
          jumpSucApp: false
        })
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
})