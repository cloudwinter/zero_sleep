// pages/alarm/alarm.js
const time = require('../../utils/time');
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter')
const app = getApp();
const weekArray = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '日',
];
const alarmPre = 'FFFFFFFF0100';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {}, // 当前连接的设备
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    },
    modeItems: [{
        value: 'lingyali',
        name: '零压力',
      },
      {
        value: 'jiyi1',
        name: '记忆一',
      },
      {
        value: 'close',
        name: '不动作',
      },
    ],
    dialogShow: false,
    alarm: { // 闹钟设置
      isOpenAlarm: false, // 闹钟开关
      time: '',
      repeat: false,
      periodDesc: '',
      period: [],
      remark: '',
      modeVal: 'close',
      modeName: '不动作',
      anmo: false,
      ring: false
    },
    periodDialogShow: false, // 周期选择对话框

    periodList: [{
        id: 1,
        name: '周一',
        checked: false
      },
      {
        id: 2,
        name: '周二',
        checked: false
      },
      {
        id: 3,
        name: '周三',
        checked: false
      },
      {
        id: 4,
        name: '周四',
        checked: false
      },
      {
        id: 5,
        name: '周五',
        checked: false
      },
      {
        id: 6,
        name: '周六',
        checked: false
      },
      {
        id: 7,
        name: '周日',
        checked: false
      },
    ],
    remarkDialogShow: false,
    remarkInputValue: '',
    modeDialogShow: false,
    modeSelectRadio: '',

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    // connected = {
    //   deviceId: '111'
    // }
    this.setData({
      skin: app.globalData.skin,
      // skin:'orange',
      connected: connected
    })

    //let connected = this.data.connected;
    if (util.isNotEmptyObject(connected)) {

      // 如果缓存中有设置缓存回显
      let alarm = configManager.getAlarm(connected.deviceId);
      if (util.isNotEmptyObject(alarm)) {
        let periodList = this.data.periodList;
        if (alarm.period.length > 0) {
          periodList.forEach(item => {
            if (alarm.period.indexOf(item.id) >= 0) {
              item.checked = true;
            }
          })
        }
        this.setData({
          alarm: alarm,
          periodList: periodList
        });

      }

      //this.sendRequestAlarmCmd();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    //WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },


  /**
   * 初始化发送时间校验闹钟请求
   */
  sendRequestAlarmCmd: function () {
    let cmdPrefix = 'FFFFFFFF01000111';
    let date = time.getDateInfo(new Date());
    let cmdTime = date.hour + date.minute + date.second + date.week + date.year + date.month + date.day;
    let cmdCrc = crcUtil.HexToCSU16(cmdPrefix + cmdTime);
    let cmd = cmdPrefix + cmdTime + cmdCrc;
    console.log('sendRequestAlarmCmd:', cmd);

    util.sendBlueCmd(this.data.connected, cmd);
  },




  /**
   * 闹钟开关
   * @param {}} e 
   */
  alarmSwitch: function (e) {
    var openAlarm = this.data.alarm.isOpenAlarm;
    this.setData({
      ['alarm.isOpenAlarm']: !openAlarm
    })
  },


  repeatSwitch: function (e) {
    var repeat = this.data.alarm.repeat;
    this.setData({
      ['alarm.repeat']: !repeat
    })
  },


  /**
   * 时间选择
   * @param {}} e 
   */
  bindTimeChange: function (e) {
    this.setData({
      ['alarm.time']: e.detail.value
    })
  },


  /**
   * 周期选择
   * @param {}} e 
   */
  periodTap: function (e) {
    this.setData({
      periodDialogShow: true
    })
  },

  periodItemSelect: function (e) {
    let index = e.currentTarget.dataset.index;
    let newli = 'periodList[' + index + '].checked';
    this.setData({
      [newli]: !this.data.periodList[index].checked
    })
  },

  /**
   * 周期对话框操作按钮
   * @param {*} e 
   */
  onModalPeriodClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    let repeat = this.data.alarm.repeat;
    if (cType == 'cancel') {
      this.setData({
        periodDialogShow: false
      })
      return;
    }
    let periodDesc = '';
    let period = [];
    let i = 0;
    this.data.periodList.forEach(item => {
      if (item.checked) {
        period.push(item.id);
        i++;
      }
    });
    if (period.length > 0) {
      repeat = true;
      period.forEach(j => {
        periodDesc += weekArray[j - 1];
      });
    } else {
      periodDesc = '永不';
    }
    console.log('onModalPeriodClick period=' + period + ' periodDesc=' + periodDesc);
    this.setData({
      periodDialogShow: false,
      ['alarm.repeat']: repeat,
      ['alarm.period']: period,
      ['alarm.periodDesc']: periodDesc,
    })

  },


  /**
   * 备注
   * @param {*} e 
   */
  remarkTap: function (e) {
    this.setData({
      remarkDialogShow: true
    })
  },

  /**
   * 备注输入
   * @param {*} e 
   */
  remarkInputChange: function (e) {
    this.setData({
      remarkInputValue: e.detail.value
    })
  },

  /**
   * 备注对话框操作
   * @param {*} e 
   */
  onModalRemarkClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        remarkDialogShow: false
      })
      return;
    }
    let inputVal = this.data.remarkInputValue;
    if (inputVal == '') {
      util.showToast('请输入备注信息！');
      return;
    }
    this.setData({
      remarkDialogShow: false,
      ['alarm.remark']: inputVal
    });
  },


  /**
   * 模式
   * @param {*} e 
   */
  modeTap: function (e) {
    this.setData({
      modeDialogShow: true
    });
  },

  /**
   * 模式选择
   * @param {*} e 
   */
  modeRadioChange: function (e) {
    this.setData({
      modeSelectRadio: e.detail.value
    })
  },

  /**
   * 模式选择点击
   * @param {*} e 
   */
  onModalModeClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        modeDialogShow: false
      })
      return;
    }
    let modeSelectRadio = this.data.modeSelectRadio;
    let modeSelectName;
    this.data.modeItems.forEach(obj => {
      if (modeSelectRadio == obj.value) {
        modeSelectName = obj.name;
      }
    });
    this.setData({
      modeDialogShow: false,
      ['alarm.modeVal']: modeSelectRadio,
      ['alarm.modeName']: modeSelectName,
    })
  },

  /**
   * 按摩选择
   * @param {*} e 
   */
  anmoSwitch: function (e) {
    this.setData({
      ['alarm.anmo']: !this.data.alarm.anmo
    })
  },

  /**
   * 响铃选择
   * @param {*} e 
   */
  ringSwitch: function (e) {
    this.setData({
      ['alarm.ring']: !this.data.alarm.ring
    })
  },


  /**
   * 保存操作
   * @param {*} e 
   */
  saveTap: function (e) {
    let connected = this.data.connected;
    if (!util.isNotEmptyObject(connected)) {
      util.showToast('当前设备未连接');
      return;
    }
    let alarm = this.data.alarm;
    let openAlarm = alarm.isOpenAlarm;
    let time = alarm.time;

    if (openAlarm) {
      if (!util.isNotEmptyStr(time)) {
        util.showToast('请选择时间');
        return;
      }

      if (alarm.repeat && alarm.period.length <= 0) {
        util.showToast('请选择星期');
        return;
      }
    }


    // 前缀
    let sendAlarmCmdPre = 'FFFFFFFF01000213';
    // 状态
    if (openAlarm) {
      sendAlarmCmdPre += '01';
    } else {
      sendAlarmCmdPre += 'A1';
    }
    // 时间
    if (time == '') {
      sendAlarmCmdPre += '000000';
    } else {
      sendAlarmCmdPre += time.substr(0, 2) + time.substr(3, 2) + '00';
    }

    // 星期
    let period = alarm.period;
    if (!util.isNotEmptyStr(period) || period.length == 0) {
      sendAlarmCmdPre += '00';
    } else {
      let week2cmd = '';
      for (let i = 7; i >= 1; i--) {
        if (period.includes(i)) {
          week2cmd += '1';
        } else {
          week2cmd += '0';
        }
      }
      week2cmd += '0';
      sendAlarmCmdPre += util.str2To16(week2cmd);
    }

    // 重复
    let repeat = alarm.repeat;
    if (repeat) {
      sendAlarmCmdPre += '01';
    } else {
      sendAlarmCmdPre += '00';
    }

    // 模式
    let mode = alarm.modeVal;
    if ('lingyali' == mode) {
      sendAlarmCmdPre += '01';
    } else if ('jiyi1' == mode) {
      sendAlarmCmdPre += '02';
    } else {
      sendAlarmCmdPre += '03';
    }

    // 按摩
    let anmo = alarm.anmo;
    if (anmo) {
      sendAlarmCmdPre += '01';
    } else {
      sendAlarmCmdPre += '00';
    }

    // 响铃
    let ring = alarm.ring;
    if (ring) {
      sendAlarmCmdPre += '01';
    } else {
      sendAlarmCmdPre += '00';
    }

    let cmdCrc = crcUtil.HexToCSU16(sendAlarmCmdPre);
    let cmd = sendAlarmCmdPre + cmdCrc;

    // 发送蓝牙命令
    console.log('saveTap->', cmd);
    util.sendBlueCmd(connected, cmd);

    configManager.putAlarm(this.data.alarm, connected.deviceId);

    // 返回上一页
    wx.navigateBack({
      delta: 1,
    })
  }
})