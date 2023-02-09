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
    smartSleep: false, // 智能睡眠开关
    smartLight: false, // 智能夜灯
    timerList: timerList,
    currentSelectedTimerId: '', // 当前选中的id
    currentSelectedTimerName: '', // 当前选中的名称
    timerDialogShow: false,
    sleepTimer: '00',
    sleepTimerDesc: '无定时',
    shuizitz: '02', // 01,02,03,04
    shuizitzUV: '00',
    network: { // 配网信息
      show: false,
      GH: '53',
      title: '',
      desc: ''
    },
    networkDialogShow: false,
    networkDialogTitle: '',
  },


  pageLifetimes: {
    show: function () {
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin
      })
    }
  },


  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("smartsleep-->created", app.globalData.display);
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
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
      // WxNotificationCenter.removeNotification("TAB_SMARTSLEEP", that);
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
        let shuizitz = cmd.substr(24, 2);
        let shuizitzUV = cmd.substr(26, 2);
        let networkGH = cmd.substr(28, 2);
        let networkShow = false;
        let networkTitle;
        let networkDesc;
        let networkDialogShow = false;
        let networkDialogTitle = '';
        if (networkGH == '00') {
          networkShow = true;
          networkTitle = '网络未连接';
          networkDesc = '配置WIFI';
          networkDialogShow = true;
          networkDialogTitle = '设备未联网，请先给设备配置WIFI网络';
        } else if (networkGH == '01') {
          networkShow = true;
          networkTitle = '网络未连接';
          networkDesc = '更换WIFI';
          networkDialogShow = true;
          networkDialogTitle = '当前网络未连接，请确认您的WIFI网络能否上网，或更换WIFI网络';
        } else if (networkGH == '0A') {
          networkShow = true;
          networkTitle = '网络不稳定';
          networkDesc = '更换WIFI';
          networkDialogShow = true;
          networkDialogTitle = '当前网络不稳定，请将路由器放在离设备更近的位置或更换WIFI网络';
        } else if (networkGH == '0F') {
          networkShow = true;
          networkTitle = '网络已连接';
          networkDesc = '更换WIFI';
        }
        let zhinengShuimian = cmd.substr(32, 2);
        let zhinengYedeng = cmd.substr(34, 2);
        that.setData({
          smartSleep: zhinengShuimian == '01' ? true : false,
          smartLight: zhinengYedeng == '01' ? true : false,
          shuizitz: shuizitz,
          shuizitzUV: shuizitzUV,
          networkGH:networkGH,
          network:{
            show:networkShow,
            GH:networkGH,
            title:networkTitle,
            desc:networkDesc
          },
          networkDialogShow:networkDialogShow,
          networkDialogTitle:networkDialogTitle
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
          sleepTimerDesc: sleepTimerDesc,
          sleepTimer: sleepTimer
        })
        app.globalData.sleepTimer = sleepTimer
      }
    },


    /** ----------- 点击事件 --------------- */


    /**
     * 睡眠特征数据录入
     */
    dataEntry() {
      if(this.checkNeedNetwork()) {
        return;
      }
      wx.navigateTo({
        url: '/pages/dataentry/dataentry'
      })
    },

    /**
     * 睡姿调整
     */
    sleepAdjust() {
      if(this.checkNeedNetwork()) {
        return;
      }
      let pageType = this.data.shuizitz
      let UV = this.data.shuizitzUV;
      wx.navigateTo({
        url: '/pages/sleepadjust/sleepadjust?pageType=' + pageType + '&UV=' + UV
      })
    },

    /**
     * 智能睡眠定时
     */
    sleepTimer() {
      if(this.checkNeedNetwork()) {
        return;
      }
      this.setData({
        timerDialogShow: true
      })
    },

    /**
     * 睡眠报告
     */
    sleepReport() {
      if(this.checkNeedNetwork()) {
        return;
      }
      wx.navigateTo({
        url: '/pages/induction/induction'
      })
    },

    /**
     * 智能夜灯
     */
    nightLight() {
      if(this.checkNeedNetwork()) {
        return;
      }
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
     * 智能睡眠
     */
    sleep() {
      if(this.checkNeedNetwork()) {
        return;
      }
      let smartSleep = this.data.smartSleep;
      if (smartSleep) {
        // 关闭
        this.sendFullBlueCmd('FFFFFFFF050000F03FD310')
      } else {
        // 开启
        this.sendFullBlueCmd('FFFFFFFF050000003F9710')
      }
      this.setData({
        smartSleep: !smartSleep
      })
    },

    /**
     * 进入配网界面
     */
    networkClick() {
      // if(this.checkNeedNetwork()) {
      //   return;
      // }
      wx.navigateTo({
        url: '/pages/network/network'
      })
    },


    /**
     * 检查是否需要配网
     */
    checkNeedNetwork() {
      let GH = this.data.network.GH;
      let result = false;
      if(GH == '00' || GH == '01') {
        result = true;
        this.showHideNetworkDialog(true);
      } else if(GH == '5F') {
        result = true;
        util.showToast('设备通讯异常，请按如下步骤排查，1.智能控制器断电再重新通电，2.等待30秒后，重启设备（拔掉压力垫的网线，再重新插上网线），3.完成上述步骤后再用小程序重新连接设备');
      }
      return result;
    },

    /**
     * 显示隐藏配网对话框
     * @param {*} show 
     */
    showHideNetworkDialog(show) {
      this.setData({
        networkDialogShow:show
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

    /**
     * 配网连接
     * @param {*} e 
     */
    networkConnect:function(e) {
      this.setData({
        networkDialogShow: false
      })
      wx.navigateTo({
        url: '/pages/network/network'
      })
    },


    /**
     * 配网取消对话框
     * @param {*} e 
     */
    networkCancel:function(e) {
      this.setData({
        networkDialogShow: false
      })
    },


  }
})