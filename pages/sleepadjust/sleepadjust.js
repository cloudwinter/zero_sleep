// pages/sleepadjust/sleepadjust.js
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter');
const app = getApp();

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
      navTitle: '睡姿角度调整',
    },
    topParam: 10,
    pingtangParam: 0,
    selectedPingtang: false,
    cetangParam: 0,
    selectedCetang: false,
    startTime: '',
    endTime: '',
    startTop: false,
    startBottom: false,
    failedDialogShow: false, // 通信失败的对话框
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      skin: app.globalData.skin,
      connected: connected,
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    this.sendFullBlueCmd('FFFFFFFF0200100B001904');
  },



  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
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
    cmd = cmd.toUpperCase();
    if (cmd.indexOf('FFFFFFFF02000F0E') >= 0) {
      let topParamCmd = cmd.substr(20, 2);
      this.setData({
        topParam: util.str16To10(topParamCmd)
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF020010120102') >= 0) {
      let AA = cmd.substr(20, 2);
      let BB = cmd.substr(28, 2);
      this.setData({
        pingtangParam: util.str16To10(AA),
        cetangParam: util.str16To10(BB),
      })
      let that = this;
      setTimeout(() => {
        that.sendFullBlueCmd('FFFFFFFF02000F0B001804');
      }, 100);
    }

  },


  /**
   * 平躺
   */
  pingtangTap() {
    let pingtangParam = this.data.topParam;
    this.setData({
      pingtangParam: pingtangParam
    })
    if (pingtangParam > 20) {
      this.setData({
        failedDialogShow: true,
        selectedPingtang: false,
      })
    } else {
      this.setData({
        selectedPingtang: true,
      })
    }
  },

  /**
   * 侧躺
   */
  cetangTap() {
    let cetangParam = this.data.topParam;
    this.setData({
      cetangParam: cetangParam
    })
    if (cetangParam > 20) {
      this.setData({
        failedDialogShow: true,
        selectedCetang: false,
      })
    } else {
      this.setData({
        selectedCetang: true,
      })
    }
  },

  /**
   * 保存
   */
  saveTap() {
    let cmd = 'FFFFFFFF020010120102';
    let pingtangParam = this.data.pingtangParam;
    let cetangParam = this.data.cetangParam;
    if (pingtangParam >= 0 && cetangParam >= 0) {
      let pingtangCmd = util.str10To16(this.data.pingtangParam);
      let cetangCmd = util.str10To16(this.data.cetangParam);
      cmd = cmd + pingtangCmd + '040506' + cetangCmd + '08';
      cmd = cmd + crcUtil.HexToCSU16(cmd);
      this.sendFullBlueCmd(cmd);
      wx.navigateBack({
        delta: 1,
      })
    } else {
      util.showToast('请先设置平躺和侧躺参数！')
    }

  },

  /**
   * 定时发送指令
   */
  timerSendTopCmd(that) {
    let startTop = that.data.startTop;
    if (startTop) {
      that.sendFullBlueCmd('FFFFFFFF02000F0B001804');
      setTimeout(() => {
        that.timerSendTopCmd(that);
      }, 500);
      console.info("timerSendTopCmd 定时发送指令")
    } else {
      that.sendFullBlueCmd('FFFFFFFF0500000000D700');
      console.info("timerSendTopCmd 停止Top定时发送指令")
      setTimeout(() => {
        that.sendFullBlueCmd('FFFFFFFF02000F0B001804');
      }, 100);

    }
  },

  /**
   * 定时发送指令
   */
  timerSendBottomCmd(that) {
    let startBottom = that.data.startBottom;
    if (startBottom) {
      that.sendFullBlueCmd('FFFFFFFF02000F0B001804');
      setTimeout(() => {
        that.timerSendBottomCmd(that);
      }, 500);
      console.info("timerSendBottomCmd 定时发送指令")
    } else {
      that.sendFullBlueCmd('FFFFFFFF0500000000D700');
      console.info("timerSendBottomCmd 停止Bottom定时发送指令");
      setTimeout(() => {
        that.sendFullBlueCmd('FFFFFFFF02000F0B001804');
      }, 100);
    }
  },



  /*************-------------点击事件--------------------*********** */
  touchStart(e) {
    let that = this;
    this.startTime = e.timeStamp;
    //console.info(e.currentTarget.dataset.type);
    let type = e.currentTarget.dataset.type;
    if (type == 'top') {
      this.sendFullBlueCmd('FFFFFFFF05000002039661');
      this.setData({
        startTop: true
      })
      setTimeout(() => {
        that.timerSendTopCmd(that);
      }, 500);
    } else if (type == 'bottom') {
      this.sendFullBlueCmd('FFFFFFFF0500000004D6C3');
      this.setData({
        startBottom: true
      })
      setTimeout(() => {
        that.timerSendBottomCmd(that);
      }, 500);
    }
  },
  touchEnd(e) {
    this.endTime = e.timeStamp;
    let type = e.currentTarget.dataset.type;
    if (type == 'top') {
      this.setData({
        startTop: false
      })
    } else if (type == 'bottom') {
      this.setData({
        startBottom: false
      })
    }
  },

  /**
   * 判断单击 1 和长按 2 事件 其他0
   * @param {*} e 
   */
  longClick() {
    if (this.endTime - this.startTime > 5000) {
      console.log("长按了");
      return true;
    }
    return false;
  },



  /**
   * 检查通讯正常
   */
  startCurrentTimeOut(loadingStr, timeOutSeconds) {
    let that = this;
    util.showLoading(loadingStr);
    let timeOutName = setTimeout(() => {
      console.info('startCurrentTimeOut', loadingStr, timeOutSeconds);
      util.hideLoading();
      that.setData({
        failedDialogShow: true,
        currentTimeOutName: '',
      })
    }, timeOutSeconds * 1000);
    return timeOutName;
  },

  /**
   * 清除当前的定时器
   */
  clearCurrentTimeOut() {
    let timeOutName = this.data.currentTimeOutName;
    if (timeOutName) {
      clearTimeout(timeOutName);
      util.hideLoading();
      this.setData({
        currentTimeOutName: '',
      })
    }
  },

  /**
   * 关闭对话框
   */
  onFailedModalClick: function () {
    this.setData({
      failedDialogShow: false
    })
  }

})