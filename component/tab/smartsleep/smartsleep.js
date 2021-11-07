// component/tab/smartsleep/smartsleep.js
const app = getApp();
const util = require('../../../utils/util')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const timerList = [{
    id: '00',
    name: '无定时',
  },
  {
    id: '01',
    name: '20:00',
  },
  {
    id: '02',
    name: '20:30',
  },
  {
    id: '03',
    name: '21:00',
  },
  {
    id: '04',
    name: '21:30',
  },
  {
    id: '05',
    name: '22:00',
  },
  {
    id: '06',
    name: '22:30',
  },
  {
    id: '07',
    name: '23:00',
  },
  {
    id: '08',
    name: '23:30',
  },
];
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    skin: app.globalData.skin,
    display: app.globalData.display,
    connected: {},
    smartLight: false, // 智能夜灯
    timerList: timerList,
    currentSelectedTimerId: '', // 当前选中的id
    currentSelectedTimerName: '', // 当前选中的名称
    timerDialogShow: false,
    sleepTimer: '00',
    sleepTimerDesc: '无定时',
  },


  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("smartsleep-->created", app.globalData.display);
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
      WxNotificationCenter.addNotification("TAB_SMARTSLEEP", that.viewShow, that);
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached");
      let sleepTimerDesc = '无定时';
      let sleepTimer = app.globalData.sleepTimer;
      if (sleepTimer == '00') {
        sleepTimerDesc = '无定时';
      } else if (sleepTimer == '01') {
        sleepTimerDesc = '20:00';
      } else if (sleepTimer == '02') {
        sleepTimerDesc = '20:30';
      } else if (sleepTimer == '03') {
        sleepTimerDesc = '21:00';
      } else if (sleepTimer == '04') {
        sleepTimerDesc = '21:30';
      } else if (sleepTimer == '05') {
        sleepTimerDesc = '22:00';
      } else if (sleepTimer == '06') {
        sleepTimerDesc = '22:30';
      } else if (sleepTimer == '07') {
        sleepTimerDesc = '23:00';
      } else if (sleepTimer == '08') {
        sleepTimerDesc = '23:30';
      }
      this.setData({
        display: app.globalData.display,
        sleepTimer: sleepTimer,
        sleepTimerDesc: sleepTimerDesc,
        currentSelectedTimerId: sleepTimer,
        currentSelectedTimerName: sleepTimerDesc
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("smartsleep-->detached");
      var that = this;
      WxNotificationCenter.removeNotification("INIT", that);
      WxNotificationCenter.removeNotification("BLUEREPLY", that);
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 连接后初始化
     * @param {*} connected 
     */
    initConnected(connected) {
      var that = this.observer;
      console.info('smartsleep->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      //WxNotificationCenter.removeNotification("INIT",that);
    },

    viewShow() {
      var that = this.observer;
      console.info('smartsleep->viewShow:', this.observer);
      let hasSleepInduction = app.globalData.hasSleepInduction;
      that.setData({
        hasSleepInduction: hasSleepInduction,
      })
      var connected = that.data.connected;
      util.sendBlueCmd(connected, 'FFFFFFFF02000A0A1204');
      setTimeout(() => {
        util.sendBlueCmd(connected, 'FFFFFFFF02000E0B001704');
      }, 400);

    },


    /**
     * 发送蓝牙命令
     */
    sendBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, sendPrefix + cmd, options);
    },

    /**
     * 发送完整蓝牙命令
     */
    sendFullBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, cmd, options);
    },

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      cmd = cmd.toUpperCase();
      var sleepPrefix = cmd.substr(0, 16);
      if (sleepPrefix == 'FFFFFFFF02000A14') {
        let zhinengYedeng = cmd.substr(34, 2);
        that.setData({
          smartLight: zhinengYedeng == '01' ? true : false
        })
        return;
      }
      if (cmd.indexOf('FFFFFFFF02000E0B') >= 0) {
        let sleepTimerDesc = that.data.sleepTimerDesc;
        let sleepTimer = cmd.substr(16, 2);;
        if (sleepTimer == '00') {
          sleepTimerDesc = '无定时';
        } else if (sleepTimer == '01') {
          sleepTimerDesc = '20:00';
        } else if (sleepTimer == '02') {
          sleepTimerDesc = '20:30';
        } else if (sleepTimer == '03') {
          sleepTimerDesc = '21:00';
        } else if (sleepTimer == '04') {
          sleepTimerDesc = '21:30';
        } else if (sleepTimer == '05') {
          sleepTimerDesc = '22:00';
        } else if (sleepTimer == '06') {
          sleepTimerDesc = '22:30';
        } else if (sleepTimer == '07') {
          sleepTimerDesc = '23:00';
        } else if (sleepTimer == '08') {
          sleepTimerDesc = '23:30';
        }
        that.setData({
          sleepTimerDesc:sleepTimerDesc,
          sleepTimer:sleepTimer
        })
        app.globalData.sleepTimer = sleepTimer
      }
    },


    /** ----------- 点击事件 --------------- */


    /**
     * 睡眠特征数据录入
     */
    dataEntry() {
      wx.navigateTo({
        url: '/pages/dataentry/dataentry'
      })
    },

    /**
     * 睡姿调整
     */
    sleepAdjust() {
      wx.navigateTo({
        url: '/pages/sleepadjust/sleepadjust'
      })
    },

    /**
     * 智能睡眠定时
     */
    sleepTimer() {
      this.setData({
        timerDialogShow: true
      })
    },

    /**
     * 睡眠报告
     */
    sleepReport() {
      wx.navigateTo({
        url: '/pages/induction/induction'
      })
    },

    /**
     * 智能夜灯
     */
    nightLight() {
      let smartLight = this.data.smartLight;
      if (smartLight) {
        // 关闭
        this.sendFullBlueCmd('FFFFFFFF0200110B001A04')
      } else {
        // 开启
        this.sendFullBlueCmd('FFFFFFFF0200110B011B04')
      }
      this.setData({
        smartLight: !smartLight
      })

    },


    /**
     * 定时开启item选中
     * @param {*} e 
     */
    timerItemSelect: function (e) {
      let selectedId = e.currentTarget.dataset.cid;
      let selectedName = e.currentTarget.dataset.cname;
      this.setData({
        currentSelectedTimerId: selectedId,
        currentSelectedTimerName: selectedName
      })
    },

    /**
     * 定时对话框按钮点击事件
     * @param {*} e 
     */
    onTimerModalClick: function (e) {
      var ctype = e.target.dataset.ctype;
      this.setData({
        timerDialogShow: false
      })
      if (ctype == 'confirm') {
        // 发送设置定时指令
        var connected = this.data.connected;
        let currentSelectedTimerId = this.data.currentSelectedTimerId;
        let cmd = 'FFFFFFFF02000D0B' + currentSelectedTimerId;
        cmd = cmd + crcUtil.HexToCSU16(cmd);
        util.sendBlueCmd(connected, cmd);
        let currentSelectedTimerName = this.data.currentSelectedTimerName;
        app.globalData.sleepTimer = currentSelectedTimerId;
        this.setData({
          sleepTimer: currentSelectedTimerId,
          sleepTimerDesc: currentSelectedTimerName
        })
      }
    },

  }
})