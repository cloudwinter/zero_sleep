const time = require('../../utils/time');
const configManager = require('../../utils/configManager')
const crcUtil = require('../../utils/crcUtil')
const util = require('../../utils/util')
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
  data: {
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      show: true,
      animated: false,
    },
    nowPage: "kuaijie",
    nowIndex: 0,
    tabBar: [{
        "selectedIconPath": "../../images/" + app.globalData.skin + "/tab_kuaijie_selected@2x.png",
        "iconPath": "../../images/" + app.globalData.skin + "/tab_kuaijie_normal@2x.png",
        "text": "快捷",
        "tapFunction": "toKuaijie",
        "active": "active",
        "show": true
      },
      {
        "selectedIconPath": "../../images/" + app.globalData.skin + "/tab_weitiao_selected@2x.png",
        "iconPath": "../../images/" + app.globalData.skin + "/tab_weitiao_normal@2x.png",
        "text": "微调",
        "tapFunction": "toWeitiao",
        "active": "",
        "show": true
      },
      {
        "selectedIconPath": "../../images/" + app.globalData.skin + "/tab_anno_selected@2x.png",
        "iconPath": "../../images/" + app.globalData.skin + "/tab_anno_normal@2x.png",
        "text": "按摩",
        "tapFunction": "toAnmo",
        "active": "active",
        "show": true
      },
      {
        "selectedIconPath": "../../images/" + app.globalData.skin + "/tab_dengguang_selected@2x.png",
        "iconPath": "../../images/" + app.globalData.skin + "/tab_dengguang_normal@2x.png",
        "text": "灯光",
        "tapFunction": "toDengguang",
        "active": "",
        "show": true
      },
      {
        "selectedIconPath": "../../images/" + app.globalData.skin + "/tab_sleep_selected@2x.png",
        "iconPath": "../../images/" + app.globalData.skin + "/tab_sleep_normal@2x.png",
        "text": "智能睡眠",
        "tapFunction": "toSmartSleep",
        "active": "",
        "show": false
      },
      {
        "selectedIconPath": "../../images/" + app.globalData.skin + "/tab_znjc_selected@2x.png",
        "iconPath": "../../images/" + app.globalData.skin + "/tab_znjc_normal@2x.png",
        "text": "智能监测",
        "tapFunction": "toZhinengjiance",
        "active": "",
        "show": false
      },
    ],
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
    kuaijieType: '', // 这边不能添加默认值
    weitiaoType: '', // 这边不能添加默认值
    connected: {},
    smartSleepClickTime: 0,
    zhinengjianceType: '', // 智能检测的类型
  },

  /**
   * 初始化加载
   */
  onLoad: function (option) {
    console.info('main.Onshow');
    // let contectedTest = {
    //   deviceId: '111',
    //   name:''
    // };
    // option = {
    //   connected: JSON.stringify(contectedTest)
    // }
    if (option && option.connected) {
      console.info("main.onLoad option", option);
      var connected = JSON.parse(option.connected);
      console.info("main->onLoad connected:", connected);
      this.setData({
        connected: connected,
        kuaijieType: option.kuaijieType,
        weitiaoType: option.weitiaoType
      })
      if (connected.name.indexOf('S4-HL') >= 0) {
        //this.showNurseTab();
      }
      this.notifyBLECharacteristicValueChange();

      //this.getBLService(connected.deviceId);
    }

  },

  /**
   * 显示时触发
   */
  onShow: function () {
    // 获取皮肤
    console.info('main.Onshow');
    var skin = app.globalData.skin;
    this.setData({
      skin: skin
    })
    // WxNotificationCenter.postNotificationName('INIT',this.data.connected);

    this.executeInitCmdTasks();
    
    // setTimeout(() => {
    //   let connected = {
    //     deviceId:'11',
    //     deviceName:'SN'
    //   }
    //   let received = 'ffffffff01000c1103806599ffffffff01000c11';
    //   //this.blueReply('ffffffff01000c1103806599ffffffff01000c11',connected);

    //   this.blueReply(received, connected);
    //   //received = 'FFFFFFFF01000413AF08300026010301019897';
    //   //received = 'FFFFFFFF01000A0B011304';
    //   WxNotificationCenter.postNotificationName('BLUEREPLY', received);
    // },2000)



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

  /**
   * 发送蓝牙命令
   * @param {*} cmd 
   */
  sendBlueCmd(cmd) {
    util.sendBlueCmd(this.data.connected, cmd);
  },

  /**
   * 发送蓝牙命令并回调
   * @param {*} cmd 
   * @param {*} callBack 
   */
  sendBlueCmdCallBack(cmd, callBack) {
    util.sendBlueCmd(this.data.connected, cmd, callBack);
  },


  /******------>tab切换 start */

  toKuaijie() {
    this.setData({
      nowPage: "kuaijie",
      nowIndex: 0
    })
  },
  toWeitiao() {
    this.setData({
      nowPage: "weitiao",
      nowIndex: 1
    })
  },
  toAnmo() {
    this.setData({
      nowPage: "anmo",
      nowIndex: 2
    })
  },
  toDengguang() {
    this.setData({
      nowPage: "dengguang",
      nowIndex: 3
    })
  },
  toSmartSleep() {
    let smartSleepClickTime = this.data.smartSleepClickTime;
    let currentTime = new Date().getTime();
    if (currentTime - smartSleepClickTime > 2000) {
      this.sendBlueCmd('FFFFFFFF02000A0A1204');
      let that = this;
      setTimeout(() => {
        that.sendBlueCmd('FFFFFFFF02000E0B001704');
      }, 400);
      this.setData({
        smartSleepClickTime: currentTime
      })
    }
    this.setData({
      nowPage: "smartsleep",
      nowIndex: 4
    })
  },

  toZhinengjiance() {
    this.setData({
      nowPage: "zhinengjiance",
      nowIndex: 5
    })
    var type = this.data.zhinengjianceType;
    if(type == '01' || type == '02') {
      var jumpPath = 'pages/index/index?mac=' + this.data.mac;
      wx.navigateToMiniProgram({
        appId: app.globalData.appId,
        path: jumpPath,
        envVersion: 'trial', //develop,trial,release
      })
    } else if(type == '03') {
      // 发送询问wifi配网状态询问码：
      let wifiCmd = "FFFFFFFF02000A0A1204";
      util.sendBlueCmd(this.data.connected, wifiCmd);
    }
  },


  /**
   * 设置压力带显示的tab
   */
  showStressBeltTab() {
    let tabbar = this.data.tabBar;
    tabbar[4].show = true;
    this.setData({
      tabBar: tabbar,
    })
  },

  /**
   * 设置默认显示的tab
   */
  showDefaultTab() {
    let tabbar = this.data.tabBar;
    tabbar[4].show = false;
    this.setData({
      tabBar: tabbar,
    })
  },

  /******------>tab切换 end */


  /*******-------------->蓝牙回调 start */



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
              ['connected.notifyCharacId']: res.characteristics[i].uuid
            })
          }
          if (res.characteristics[i].properties.write) {
            that.setData({
              ['connected.writeCharacId']: res.characteristics[i].uuid
            })
          } else if (res.characteristics[i].properties.read) {
            that.setData({
              ['connected.readCharacId']: res.characteristics[i].uuid
            })
          }
        }
        console.log('device connected:', that.data.connected);
        //configManager.putCurrentConnected(that.data.connected);
        that.notifyBLECharacteristicValueChange()
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

    // 发送压力带
    console.warn('main->sendInitCmd 发送压力指令', '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.sendBlueCmd('FFFFFFFF02000E0B001704');

    await this.delay(150);
    // 发码询问主板是否连接心率带
    console.warn("main->sendInitCmd 发送心率带指令 ", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.sendBlueCmd('FFFFFFFF01000C0B0F2304');

    await this.delay(150);
    // 先发送灯光指令
    console.warn("main->sendInitCmd 发送灯光初始化指令 ", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.sendBlueCmd('FFFFFFFF050005FF23C728');

    await this.delay(150);
    // 发送时间校验指令
    console.warn("main->sendInitCmd 发送时间校验初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.sendRequestAlarmCmd(this.data.connected);

    await this.delay(150);
    // 发送页面初始化指令
    console.warn("main->sendInitCmd 发送页面初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.postInit(this.data.connected);

    await this.delay(1500);
    // 发送同步控制的初始化指令
    console.warn("main->sendInitCmd 发送同步控制的初始化指令", '延时：' + time.getCurrentDifferMs(currentTime) + 'ms');
    this.sendBlueCmd('FFFFFFFF01000A0B0F2104');
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
    if (received.indexOf('FFFFFFFF02000E0B') >= 0) {
      // 有智能睡眠感应
      this.showStressBeltTab();
      this.setTimer(received, deviceId);
      return;
    }
    if (received.indexOf('FFFFFFFF01000C11') >= 0) {
      this.setZhinengjiance(received);
    }

  },

  /**
   * 智能检测（太和心率带）
   * @param {*} cmd 
   */
  setZhinengjiance: function (cmd) {
    console.info('setZhinengjiance',cmd);
    var type = cmd.substr(16, 2);
    var macCmd = cmd.substr(18, 12);
    var tabbar = this.data.tabBar
    tabbar[5].show = true;
    this.setData({
      tabBar: tabbar,
      zhinengjianceType: type,
    })
    app.globalData.mac = macCmd;
    if(type == '01') {
      app.globalData.appId = 'wxbbdd4b1b88358610';
    } else if (type == '02') {
      app.globalData.appId = 'wx89783978e44773d0';
    }
  },


  /**
   * 设置智能睡眠感应
   * @param {*} cmd 
   * @param {*} deviceId 
   */
  setTimer: function (cmd, deviceId) {
    console.error('main->setSmart-->设置智能睡眠定时', cmd, deviceId);
    app.globalData.hasSleepInduction = true;
    app.globalData.sleepTimer = cmd.substr(16, 2);
    WxNotificationCenter.postNotificationName('VIEWSHOW');
  },

  setAlarm: function (cmd, deviceId) {
    console.error('main->setAlarm-->开启闹钟设置', cmd, deviceId);
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
      console.log('main.alarm->blueReply :period:,' + period);
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

  /**
   * 蓝牙回传
   */
  onBLECharacteristicValueChange: function () {
    wx.onBLECharacteristicValueChange(function (res) {
      console.info('main->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received', received);
      WxNotificationCenter.postNotificationName('BLUEREPLY', received);
    })
  }
  /*******-------------->蓝牙回调 end */











})