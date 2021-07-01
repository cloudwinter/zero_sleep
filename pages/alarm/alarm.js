// pages/alarm/alarm.js
const util = require('../../utils/util');
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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: '', // 当前连接的设备
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
        name: '关闭',
      },
    ],
    dialogShow: false,
    selectedRadio: 'drak',
    alarm: { // 闹钟设置
      isOpenAlarm: true, // 闹钟开关
      time: '12:00',
      periodDesc: '永不',
      period: [],
      remark: '',
      modeVal: '',
      modeName: '',
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
    this.setData({
      skin: app.globalData.skin,
      selectedRadio: app.globalData.skin,
      connected: configManager.getCurrentConnected()
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    // 如果缓存中有设置缓存回显
    if(this.data.connected) {
      let alarm = configManager.getAlarm;
      if(alarm) {
        this.setData({alarm:alarm});
      }
    }
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
    var prefix = cmd.substr(0, 14).toUpperCase();
    console.info('kuaijie-K1->askBack', cmd, prefix);
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


  /**
   * 时间选择
   * @param {}} e 
   */
  bindTimeChange: function (e) {
    this.setData({
      alarm: {
        time: e.detail.value
      }
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
        period[i] = item.id;
        i++;
      }
    });
    if (period.length > 0) {
      let count = 0;
      period.forEach(j => {
        periodDesc += weekArray[j - 1];
      });
    } else {
      periodDesc = '永不';
    }
    console.log('onModalPeriodClick period=' + period + ' periodDesc=' + periodDesc);
    this.setData({
      periodDialogShow: false,
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
    if (!connected) {
      util.showToast('当前设备未连接');
      return;
    }
    configManager.putAlarm(connected.deviceId, this.data.alarm);
    // TODO
    // 组装命令
    // 发送蓝牙命令
    wx.navigateBack({
      delta: 1,
    })
  }
})