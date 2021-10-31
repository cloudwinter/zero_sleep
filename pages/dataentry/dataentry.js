// pages/dataentry/dataentry.js
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
      navTitle: '睡姿特征数据录入',
    },
    pingtangParam: 0,
    canPingtangParamEdit: false,
    cetangParam: 0,
    canCetangParamEdit: false,
    selectedPingtang: false,
    selectedCetang: false,
    AA: '',
    KK: '',
    startTime: '',
    endTime: '',
    startDataEntry: false,
    fuweiDialogShow: false,
    nextDialogShow: false,
    failedDialogShow: false, // 通信失败的对话框
    currentTimeOutName: '', // 当前定时器的name
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
    this.sendFullBlueCmd('FFFFFFFF02000A0A1204')
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
    if (cmd.indexOf('FFFFFFFF0200090D01') >= 0) {
      let pingtangCmd = cmd.substr(20, 2) + cmd.substr(18, 2);
      let pingtangParam = util.str16To10(pingtangCmd);
      this.setData({
        pingtangParam: pingtangParam
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF0200090D02') >= 0) {
      let cetangCmd = cmd.substr(20, 2) + cmd.substr(18, 2);
      let cetangParam = util.str16To10(cetangCmd);
      this.setData({
        cetangParam: cetangParam
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF0200090F03') >= 0) {
      let AAAA = cmd.substr(20, 2) + cmd.substr(18, 2);
      let KKKK = cmd.substr(24, 2) + cmd.substr(22, 2);
      this.setData({
        AA: util.str16To10(AAAA),
        KK: util.str16To10(KKKK),
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF0500000208D7A6') >= 0) {
      let timeOutName = this.startCurrentTimeOut('复位中...', 100);
      this.setData({
        currentTimeOutName: timeOutName
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF0500008208B666') >= 0) {
      this.clearCurrentTimeOut();
      this.setData({
        nextDialogShow: true,
        currentTimeOutName: ''
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF02000A14') >= 0) {
      let pingtangParam = util.str16To10(cmd.substr(20, 2));
      let cetangParam = util.str16To10(cmd.substr(22, 2)) * 2;
      this.setData({
        pingtangParam: pingtangParam,
        cetangParam: cetangParam
      })
      return;
    }
  },


  /**
   * 平躺
   */
  pingtangTap() {
    var longClick = this.longClick();
    if (longClick) {
      this.setData({
        canPingtangParamEdit: true
      })
      return;
    }
  },


  /**
   * 平躺点击事件
   */
  pingtangClick() {
    this.sendFullBlueCmd('FFFFFFFF0200090D0100001504');
    this.setData({
      selectedPingtang: true,
    })
  },



  /**
   * 侧躺
   */
  cetangTap() {
    var longClick = this.longClick();
    if (longClick) {
      this.setData({
        canCetangParamEdit: true
      })
      return;
    }
  },

  /**
   * 侧躺点击事件
   */
  cetangClick() {
    this.sendFullBlueCmd('FFFFFFFF0200090D0200001604');
    this.setData({
      selectedCetang: true,
    })
  },

  /**
   * 保存
   */
  saveTap() {
    let cmd = 'FFFFFFFF0200120C';
    let pingtangCmd = util.str10To16(this.data.pingtangParam);
    let cetangCmd = util.str10To16(this.data.cetangParam / 2);
    cmd = cmd + pingtangCmd + cetangCmd;
    cmd = cmd + crcUtil.HexToCSU16(cmd);
    this.sendFullBlueCmd(cmd);
    wx.navigateBack({
      delta: 1,
    })
  },

  /**
   * 数据录入点击事件
   */
  dataentryTap() {
    var that = this;
    let startDataEntry = this.data.startDataEntry;
    if (startDataEntry) {
      console.info('关闭数据录入实时获取');
      this.setData({
        startDataEntry: false
      })
      return;
    } else {
      var longClick = this.longClick();
      if (!longClick) {
        console.info('长按时间不足5s不做处理');
        return;
      }
      this.setData({
        startDataEntry: true
      })
      this.getDataEntry(0);
    }
  },

  /**
   * 获取睡姿数据录入实时数据
   */
  getDataEntry(count) {
    let startDataEntry = this.data.startDataEntry;
    if (!startDataEntry) {
      console.info('startDataEntry 停止获取实时数据录入');
      return;
    }
    if (count > 30) {
      console.info('startDataEntry 循环最多不能超过30次');
      this.setData({
        startDataEntry: false
      })
      return;
    }
    console.info('startDataEntry 重复获取实时数值 第' + count + '次');
    this.sendFullBlueCmd('FFFFFFFF0200090F03000000001904');
    count++;
    let that = this;
    setTimeout(() => {
      that.getDataEntry(count);
    }, 2000);
  },

  /**
   * 复位对话框按钮点击事件
   * @param {*} e 
   */
  onFwModalClick: function (e) {
    var that = this;
    var ctype = e.target.dataset.ctype;
    console.info('onFwModalClick:', ctype, e.target.dataset);
    var connected = this.data.connected;
    this.setData({
      fuweiDialogShow: false
    })
    if (ctype == 'confirm') {
      // 一键复位
      util.sendBlueCmd(connected, "FFFFFFFF0500000208D7A6");

    }
  },


  /**
   * 下一步跳转到睡眠设置页面
   */
  onNextModalClick: function () {
    this.setData({
      nextDialogShow: false
    })
    let cmd = 'FFFFFFFF02000A0A1204';
    let connected = this.data.connected;
    util.sendBlueCmd(connected, cmd, ({
      success: (res) => {
        console.info('onNextModalClick->发送成功');
      },
      fail: (res) => {
        console.error('onNextModalClick->发送失败', res);
      }
    }));
  },


  /*************-------------点击事件--------------------*********** */
  reset() {
    this.sendFullBlueCmd('FFFFFFFF0200120C0A466C04');
    wx.navigateBack({
      delta: 1,
    })
  },


  /**
   * 输入框监听事件
   * @param {*} e 
   */
  inputChange(e) {
    let val = e.detail.value;
    let dataType = e.currentTarget.dataset.type;
    console.info("inputChange", dataType, val);
    if(dataType == 'pingtangParam') {
      this.setData({
        pingtangParam:val
      })
    } else if(dataType == 'cetangParam') {
      this.setData({
        cetangParam:val
      })
    }
  },


  touchStart(e) {
    this.startTime = e.timeStamp;
  },
  touchEnd(e) {
    this.endTime = e.timeStamp;
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