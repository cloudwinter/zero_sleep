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
    pageType: '02', // 睡姿调整的类型
    UV: '00',
    fuweiDialogShow: false,
    nextDialogShow: false,
    currentTimeOutName: '', // 当前定时器的name
    tips1: '1.请在平躺状态，调整背部角度，完成后按平躺键。',
    tips2: '2.请在侧躺状态，调整背部角度，完成后按侧躺键。',
    showTouB: false,
    showBeiB: false,
    showYaoB: false,
    showTuiB: false,
    topParamTouB: 10, // 头部
    topParamBeiB: 10, // 背部
    topParamYaoB: 10, // 腰部
    topParamTuiB: 10, // 腰部
    pingtangParam: 0,
    selectedPingtang: false,
    cetangParam: 0,
    selectedCetang: false,
    startTime: '',
    endTime: '',
    startTop: false,
    startBottom: false,
    failedDialogShow: false, // 通信失败的对话框
    pingtangX: {
      AX: '0', // 头部平躺
      BX: '0', // 腿部平躺
      CX: '0', // 背部平躺
      DX: '0', // 腰部平躺
    },
    cetangY: {
      AY: '0', // 头部平躺
      BY: '0', // 腿部平躺
      CY: '0', // 背部平躺
      DY: '0', // 腰部平躺
    },
    topZ: {
      AZ: '10', // 头部TOP
      BZ: '10', // 腿部TOP
      CZ: '10', // 背部TOP
      DZ: '10', // 腰部TOP
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let connected = configManager.getCurrentConnected();
    let UV = options.UV;
    let pageType = options.pageType;
    let tips1 = this.data.tips1;
    let tips2 = this.data.tips2;
    if (pageType == '02') {
      tips1 = '1.请在平躺状态，调整背部，腿部角度，完成后按平躺键。';
      tips2 = '2.请在侧躺状态，调整背部，腿部角度，完成后按侧躺键。';
    } else if (pageType == '03') {
      tips1 = '1.请在平躺状态，调整背部，腰部，腿部角度，完成后按平躺键。';
      tips2 = '2.请在侧躺状态，调整背部，腰部，腿部角度，完成后按侧躺键。';
    } else if (pageType == '04') {
      tips1 = '1.请在平躺状态，调整头部，背部，腰部，腿部角度，完成后按平躺键。';
      tips2 = '2.请在侧躺状态，调整头部，背部，腰部，腿部角度，完成后按侧躺键。';
    }
    this.setData({
      skin: app.globalData.skin,
      connected: connected,
      pageType: pageType,
      UV: UV,
      fuweiDialogShow: UV == '01' ? true : false,
      showTouB: pageType == '04' ? true : false,
      showBeiB: true,
      showYaoB: (pageType == '03' || pageType == '04') ? true : false,
      showTuiB: true,
      tips1: tips1,
      tips2: tips2,

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
    if (cmd.indexOf('FFFFFFFF02000F0E') >= 0 && cmd.length > 20) {
      let AZ = util.str16To10(cmd.substr(16, 2));
      if (AZ == '175') {  // 16进制AF
        AZ = '位置过高';
      } else if (AZ == '191') { // 16进制BF
        AZ = '位置过低';
      }
      let BZ = util.str16To10(cmd.substr(18, 2));
      if (BZ == '175') {
        BZ = '位置过高';
      } else if (BZ == '191') {
        BZ = '位置过低';
      }
      let CZ = util.str16To10(cmd.substr(20, 2));
      if (CZ == '175') {
        CZ = '位置过高';
      } else if (CZ == '191') {
        CZ = '位置过低';
      }
      let DZ = util.str16To10(cmd.substr(22, 2));
      if (DZ == '175') {
        DZ = '位置过高';
      } else if (DZ == '191') {
        DZ = '位置过低';
      }
      this.setData({
        topZ: {
          AZ: AZ,
          BZ: BZ,
          CZ: CZ,
          DZ: DZ
        }
      })
      return;
    }
    if (cmd.indexOf('FFFFFFFF02001012') >= 0 && cmd.length > 30) {
      let AX = util.str16To10(cmd.substr(16, 2));
      let BX = util.str16To10(cmd.substr(18, 2));
      let CX = util.str16To10(cmd.substr(20, 2));
      let DX = util.str16To10(cmd.substr(22, 2));
      let AY = util.str16To10(cmd.substr(24, 2));
      let BY = util.str16To10(cmd.substr(26, 2));
      let CY = util.str16To10(cmd.substr(28, 2));
      let DY = util.str16To10(cmd.substr(30, 2));
      this.setData({
        pingtangX: {
          AX: AX,
          BX: BX,
          CX: CX,
          DX: DX
        },
        cetangY: {
          AY: AY,
          BY: BY,
          CY: CY,
          DY: DY
        },
      })
      let that = this;
      setTimeout(() => {
        that.sendFullBlueCmd('FFFFFFFF02000F0B001804');
      }, 100);
    }

    if (cmd == 'FFFFFFFF0500000208D7A6') {
      let timeOutName = this.startCurrentTimeOut('复位中...', 100);
      this.setData({
        currentTimeOutName: timeOutName
      })
      return;
    }
    if (cmd == 'FFFFFFFF0500008208B666') {
      this.clearCurrentTimeOut();
      this.setData({
        nextDialogShow: true,
        currentTimeOutName: ''
      })
      return;
    }


  },


  /**
   * 平躺
   */
  pingtangTap() {
    let topZ = this.data.topZ;
    console.info('pingtangTap', topZ);
    this.setData({
      pingtangX: {
        AX: topZ.AZ,
        BX: topZ.BZ,
        CX: topZ.CZ,
        DX: topZ.DZ
      }
    })
    if (topZ.AZ > 20 || topZ.BZ > 20 || topZ.CZ > 20 || topZ.DZ > 20) {
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
    let topZ = this.data.topZ;
    console.info('cetangTap', topZ);
    this.setData({
      cetangY: {
        AY: topZ.AZ,
        BY: topZ.BZ,
        CY: topZ.CZ,
        DY: topZ.DZ
      }
    })
    if (topZ.AZ > 20 || topZ.BZ > 20 || topZ.CZ > 20 || topZ.DZ > 20) {
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
    let cmd = 'FFFFFFFF02001012';
    let pingtangX = this.data.pingtangX;
    console.info('saveTap', this.data);
    let AXcmd = util.str10To16(pingtangX.AX);
    let BXcmd = util.str10To16(pingtangX.BX);
    let CXcmd = util.str10To16(pingtangX.CX);
    let DXcmd = util.str10To16(pingtangX.DX);

    let cetangY = this.data.cetangY;
    let AYcmd = util.str10To16(cetangY.AY);
    let BYcmd = util.str10To16(cetangY.BY);
    let CYcmd = util.str10To16(cetangY.CY);
    let DYcmd = util.str10To16(cetangY.DY);

    let pageType = this.data.pageType;
    if (pageType == '02') {
      AXcmd = '00';
      AYcmd = '00';
      DXcmd = '00';
      DYcmd = '00';
    } else if (pageType == '03') {
      AXcmd = '00';
      AYcmd = '00';
    }

    cmd = cmd + AXcmd + BXcmd + CXcmd + DXcmd;
    cmd = cmd + AYcmd + BYcmd + CYcmd + DYcmd;
    cmd = cmd + crcUtil.HexToCSU16(cmd);
    let that = this;
    this.sendFullBlueCmd(cmd);
    setTimeout(() => {
      that.sendFullBlueCmd('FFFFFFFF02000A0A1204');
    }, 300);
    wx.navigateBack({
      delta: 1,
    })
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
    console.info(e.currentTarget.dataset);
    let type = e.currentTarget.dataset.type;
    let openGid = e.currentTarget.dataset.openGid;
    if (openGid == 'top') {
      this.setData({
        startTop: true
      })
      if (type == 'touBTop') {
        this.sendFullBlueCmd('FFFFFFFF050000000116C0');
      } else if (type == 'beiBTop') {
        this.sendFullBlueCmd('FFFFFFFF05000002039661');
      } else if (type == 'yaoBTop') {
        this.sendFullBlueCmd('FFFFFFFF050000020D17A5');
      } else if (type == 'tuiBTop') {
        this.sendFullBlueCmd('FFFFFFFF05000002065662');
      }
      setTimeout(() => {
        that.timerSendTopCmd(that);
      }, 500);
    } else if (openGid == 'bottom') {
      this.setData({
        startBottom: true
      })
      if (type == 'touBBottom') {
        this.sendFullBlueCmd('FFFFFFFF050000000256C1');
      } else if (type == 'beiBBottom') {
        this.sendFullBlueCmd('FFFFFFFF0500000204D7A3');
      } else if (type == 'yaoBBottom') {
        this.sendFullBlueCmd('FFFFFFFF050000020E57A4');
      } else if (type == 'tuiBBottom') {
        this.sendFullBlueCmd('FFFFFFFF050000020797A2');
      }
      setTimeout(() => {
        that.timerSendBottomCmd(that);
      }, 500);
    }
  },
  touchEnd(e) {
    this.endTime = e.timeStamp;
    let type = e.currentTarget.dataset.type;
    let openGid = e.currentTarget.dataset.openGid;
    console.info(e.currentTarget.dataset);
    if (openGid == 'top') {
      this.setData({
        startTop: false
      })
    } else if (openGid == 'bottom') {
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
    let cmd = 'FFFFFFFF0200100B001904';
    this.sendFullBlueCmd(cmd);
  },

})