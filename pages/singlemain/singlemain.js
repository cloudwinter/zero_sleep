// pages/singlemain/singlemain.js
const util = require('../../utils/util')
const time = require('../../utils/time');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter')
const crcUtil = require('../../utils/crcUtil');
const app = getApp()
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
    skin: app.globalData.skin, //当前皮肤样式
    display: app.globalData.display,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      set: false,
      animated: false,
      showRSSI: false
    }, // 导航栏
    connected: {},
    type: '0A',//显示的类型
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
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    if (option && option.connected) {
      console.info("singlemain.onLoad option", option);
      var connected = JSON.parse(option.connected);
      var type = option.type
      console.info("singlemain->onLoad connected:", connected);
      this.setData({
        connected: connected,
        type: type
      })
      this.notifyBLECharacteristicValueChange();
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
        that.executeInitCmdTasks();

      },
      fail: function (res) {
        console.error("singlemain->notifyBLECharacteristicValueChange error", res);
        util.showModal('蓝牙通讯不稳定，请重新进入');
      }
    });
    wx.onBLECharacteristicValueChange((res) => {
      console.info('singlemain->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('singlemain->onBLECharacteristicValueChange-->received', received);
      that.blueReply(received, connected);
      WxNotificationCenter.postNotificationName('BLUEREPLY', received);
    });
  },


  /**
   * 延时知悉
   */
  delay: function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  executeInitCmdTasks: async function () {
    let currentTime = new Date().getTime();

    await this.delay(150);
    // 发送时间校验指令
    console.warn("singlemain->sendInitCmd 发送时间校验初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    if (this.data.type == '0A') {
      this.sendRequestAlarmCmd(this.data.connected);
    }
    await this.delay(150);
    // 发送页面初始化指令
    console.warn("singlemain->sendInitCmd 发送页面初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.postInit(this.data.connected);
  },

  /**
  * 页面初始化操作
  * @param {*} connected 
  */
  postInit: function (connected) {
    console.info('singlemain->sendInitCmd 发送个页面指令 time ', new Date().getTime());
    WxNotificationCenter.postNotificationName('INIT', connected);
  },


  /**
  * 初始化发送时间校验闹钟请求
  */
  sendRequestAlarmCmd() {
    console.info('singlemain->sendInitCmd 发送闹钟指令 time ', new Date().getTime());
    let cmdPrefix = 'FFFFFFFF01000111';
    let date = time.getDateInfo(new Date());
    let cmdTime = date.hour + date.minute + date.second + date.week + date.year + date.month + date.day;
    let cmdCrc = crcUtil.HexToCSU16(cmdPrefix + cmdTime);
    let cmd = cmdPrefix + cmdTime + cmdCrc;
    console.log('sendRequestAlarmCmd:', cmd);

    this.sendBlueCmd(cmd);
  },


  /**
   * 发送蓝牙命令
   * @param {*} cmd 
   */
  sendBlueCmd(cmd) {
    util.sendBlueCmd(this.data.connected, cmd);
  },

  /**
    * 蓝牙回复
    * @param {*} received 
    */
  blueReply: function (received, connected) {
    console.info('singlemain->blueReply-->received', received, connected);
    if (!received) {
      return;
    }
    received = received.toUpperCase();
    let deviceId = connected.deviceId;
    if (received.indexOf('FFFFFFFF0100030B00') >= 0 || received.indexOf('FFFFFFFF01000413') >= 0) {
      // 有闹钟功能
      this.setAlarm(received, deviceId);
      return;
    }
  },

  /**
   * 有闹钟功能
   * @param {*} cmd 
   * @param {*} deviceId 
   */
  setAlarm: function (cmd, deviceId) {
    console.error('bedstead->setAlarm-->开启闹钟设置', cmd, deviceId);
    let alarm = {};
    if (cmd.indexOf('FFFFFFFF0100030B00') >= 0) {
      // 有闹钟未设置
      let isAudio = cmd.substr(16, 2);//是否有音响
      if (isAudio == "00") {
        configManager.putAlarmAudio(false, deviceId)
      } else {
        configManager.putAlarmAudio(true, deviceId)
      }

      configManager.putAlarmSwitch(true, deviceId);
      alarm.isOpenAlarm = false;
      configManager.putAlarm(alarm, deviceId);
    } else if (cmd.indexOf('FFFFFFFF01000413') >= 0) {
      // 有闹钟已设置
      let isAudio = cmd.substr(16, 2);//是否有音响
      if (isAudio == "0F") {
        configManager.putAlarmAudio(false, deviceId)
      } else {
        configManager.putAlarmAudio(true, deviceId)
      }
      configManager.putAlarmSwitch(true, deviceId)
      let cmdStatus = cmd.substr(16, 2);
      if ('0F' == cmdStatus || '1F' == cmdStatus) {
        // 开启
        alarm.isOpenAlarm = true;
      } else {
        // 关闭
        alarm.isOpenAlarm = false;
      }
      // 时间
      let timeHour = cmd.substr(18, 2);
      let timeMin = cmd.substr(20, 2);
      alarm.time = timeHour + ':' + timeMin;

      // 星期
      let cmdWeek = util.str16To2(cmd.substr(24, 2));
      let cmdweekArray = util.strToArray(cmdWeek, 1);
      let period = [];
      let periodDesc = '';
      for (let i = cmdweekArray.length - 2; i >= 0; i--) {
        if (cmdweekArray[i] == '1') {
          period.push(this.data.periodList[6 - i].id);
        }
      }
      console.log('bedstead.alarm->blueReply :period:,' + period);
      if (period.length > 0) {
        period.forEach(j => {
          periodDesc += weekArray[j - 1];
        });
      } else {
        periodDesc = '不重复';
      }
      alarm.period = period;
      alarm.periodDesc = periodDesc;

      // 重复
      // let cmdRepeat = cmd.substr(26, 2);
      // alarm.repeat = cmdRepeat == '01' ? true : false;

      // 模式
      let cmdMode = cmd.substr(28, 2);
      if ('01' == cmdMode) {
        alarm.modeVal = 'lingyali';
        alarm.modeName = '零压力';
      } else if ('02' == cmdMode) {
        alarm.modeVal = 'jiyi1';
        alarm.modeName = '记忆一';
      } else if ('04' == cmdMode) {
        alarm.modeVal = 'lingyaliLeft';
        alarm.modeName = '左侧零压力';
      } else if ('05' == cmdMode) {
        alarm.modeVal = 'lingyaliRight';
        alarm.modeName = '右侧零压力';
      } else if ('06' == cmdMode) {
        alarm.modeVal = 'lingyaliAll';
        alarm.modeName = '零压力';
      } else {
        alarm.modeVal = 'close';
        alarm.modeName = '不动作';
      }

      // 按摩
      let cmdAnmo = cmd.substr(30, 2);
      alarm.anmo = '01' == cmdAnmo ? true : false;

      // 响铃
      let cmdRing = cmd.substr(32, 2);
      alarm.ring = '01' == cmdRing ? true : false;
      configManager.putAlarm(alarm, deviceId);
    }
  },
})