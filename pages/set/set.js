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
    tongbukongzhiSWitch: false // 同步控制的开关
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
      if (connected.name.indexOf('S4-HL') >= 0) {
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
    }


    this.setData({
      alarmStatus: alarmStatus
    })
  },



  /******----------------->自定义函数 */

  sendInitCmd() {
    let connected = this.data.connected;
    // if (!util.isNotEmptyObject(connected)) {
    //   util.showToast('当前设备未连接');
    //   return;
    // }
    // 发送同步控制指令码
    let cmd = 'FFFFFFFF01000A0BOF2104';
    util.sendBlueCmd(connected, cmd);
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
    if (cmd.indexOf('FFFFFFFF01000A0B') >= 0) {
      // 同步控制回码
      let tongbukongzhiSWitch = cmd.substr(16, 2) == '01' ? true : false;
      this.setData({
        tongbukongzhiItemShow: true,
        tongbukongzhiSWitch: tongbukongzhiSWitch
      })
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
    wx.navigateTo({
      url: '/pages/nurseset/nurseset',
    })
  },


  /**
   * 同步控制开关
   * @param {}} e 
   */
  tongbuItemSwitch: function (e) {
    let connected = this.data.connected;
    // if (!util.isNotEmptyObject(connected)) {
    //   util.showToast('当前设备未连接');
    //   return;
    // }
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
  }
})