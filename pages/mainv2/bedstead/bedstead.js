// pages/bedstead/bedstead.js
const util = require('../../../utils/util')
const time = require('../../../utils/time');
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil')
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
      set: true,
      animated: false,
      showRSSI: false
    }, // 导航栏
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
    title:'智能床架',
    cmd: '',
    nowIndex:1,
    nowPage: 'qinang',
    connected: {},
    tabBarShow: true,
    tabBar: [{
      "selectedIconPath": "../../../images/" + app.globalData.skin + "/tab_kuaijie_selected@2x.png",
      "iconPath": "../../../images/" + app.globalData.skin + "/tab_kuaijie_normal@2x.png",
      "text": "电动床",
      "tapFunction": "toDianDongChuang",
      "active": "active",
      "show": true
    },
    {
      "selectedIconPath": "../../../images/" + app.globalData.skin + "/tab_weitiao_selected@2x.png",
      "iconPath": "../../../images/" + app.globalData.skin + "/tab_weitiao_normal@2x.png",
      "text": "气囊",
      "tapFunction": "toQiNang",
      "active": "",
      "show": true
    },
    {
      "selectedIconPath": "../../../images/" + app.globalData.skin + "/tab_anno_selected@2x.png",
      "iconPath": "../../../images/" + app.globalData.skin + "/tab_anno_normal@2x.png",
      "text": "冷暖",
      "tapFunction": "toLengNuan",
      "active": "active",
      "show": true
    }
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(option) {
    if (option && option.cmd) {
      let connected = configManager.getCurrentConnected();
      var cmd = option.cmd;
      let bedState = cmd.substr(18, 2) == '0A' ? true : false;
      let m1State = cmd.substr(24, 2) == '0B' ? true : false;
      let m2State = cmd.substr(30, 2) == '0C' ? true : false;
      var tabbar = this.data.tabBar
      var tabBarShow = this.data.tabBarShow
      var tabBarNum = 0;
      if (!bedState) {
        tabbar[0].show = false;
        tabBarNum++;
      }
      if (!m1State) {
        tabbar[1].show = false;
        tabBarNum++;
      }
      if (!m2State) {
        tabbar[2].show = false;
        tabBarNum++;
      }

      //判断是否超过2个页面不显示
      if (tabBarNum >= 2) {
        tabBarShow = false
      }

      var type =  option.type
      var nowIndex = this.data.nowIndex
      var title= this.data.title
      if(type == 'diandong'){
        nowIndex = 0
        title = "智能床架"
      }else if(type == 'qinang'){
        nowIndex = 1
        title = "舒适按摩"
      }else if(type == 'lengnuan'){
        nowIndex = 2
        title = "温度调节"
      }

      this.setData({
        tabBar: tabbar,
        tabBarShow: tabBarShow,
        connected: connected,
        nowPage:type,
        nowIndex:nowIndex,
        title:title
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
        console.error("main->notifyBLECharacteristicValueChange error", res);
        // let received = 'FFFFFFFF01000413AF083000C2010301019897';
        // that.blueReply(received, connected);
        util.showModal('开启监听失败，请重新进入');
      }
    });
    wx.onBLECharacteristicValueChange((res) => {
      console.info('main->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received', received);
      that.blueReply(received, connected);
      //received = 'FFFFFFFF01000413AF08300026010301019897';
      //received = 'FFFFFFFF01000A0B011304';
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
    console.warn("main->sendInitCmd 发送时间校验初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.sendRequestAlarmCmd(this.data.connected);

    await this.delay(150);
    // 发送页面初始化指令
    console.warn("main->sendInitCmd 发送页面初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.postInit(this.data.connected);
  },

  /**
  * 页面初始化操作
  * @param {*} connected 
  */
  postInit: function (connected) {
    console.info('main->sendInitCmd 发送个页面指令 time ', new Date().getTime());
    WxNotificationCenter.postNotificationName('INIT', connected);
  },


  /**
  * 初始化发送时间校验闹钟请求
  */
  sendRequestAlarmCmd() {
    console.info('main->sendInitCmd 发送闹钟指令 time ', new Date().getTime());
    let cmdPrefix = 'FFFFFFFF01000111';
    let date = time.getDateInfo(new Date());
    let cmdTime = date.hour + date.minute + date.second + date.week + date.year + date.month + date.day;
    let cmdCrc = crcUtil.HexToCSU16(cmdPrefix + cmdTime);
    let cmd = cmdPrefix + cmdTime + cmdCrc;
    console.log('sendRequestAlarmCmd:', cmd);

    this.sendBlueCmd(cmd);
  },



  /******------>tab切换 start */

  toDianDongChuang() {
    this.setData({
      nowPage: "diandong",
      nowIndex: 0,
      title:"智能床架"
    })
  },
  toQiNang() {
    this.setData({
      nowPage: "qinang",
      nowIndex: 1,
      title:"舒适按摩"
    })
  },
  toLengNuan() {
    this.setData({
      nowPage: "lengnuan",
      nowIndex: 2,
      title:"温度调节"
    })
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
    console.info('main->blueReply-->received', received, connected);
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
      configManager.putAlarmSwitch(true, deviceId);
      alarm.isOpenAlarm = false;
      configManager.putAlarm(alarm, deviceId);
    } else if (cmd.indexOf('FFFFFFFF01000413') >= 0) {

      // 有闹钟已设置
      configManager.putAlarmSwitch(true, deviceId)
      let cmdStatus = cmd.substr(16, 2);
      if ('0F' == cmdStatus) {
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