// pages/mainv2/timeset/timeset.js
const util = require('../../../utils/util')
const crcUtil = require('../../../utils/crcUtil');
const configManager = require('../../../utils/configManager')
const app = getApp()
const WxNotificationCenter = require('../../../utils/WxNotificationCenter');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: app.globalData.skin, //当前皮肤样式
    display: app.globalData.display,
    containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 60,
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
    modeItems: [{
      value: '02',
      name: '制冷',
    },
    {
      value: '01',
      name: '加热',
    }
    ],
    modeSelectRadio: '',//选择的模式
    provisionModeRadioChange: '',//临时选择的模式
    modeSelectName: '',
    modeDialogShow: false,
    gearHotItems: [{
      value: '01',
      name: '30°c',
    },
    {
      value: '02',
      name: '35°c',
    },
    {
      value: '03',
      name: '40°c',
    },
    {
      value: '04',
      name: '45°c',
    }
    ],
    gearCoolItems: [{
      value: '01',
      name: '20°c',
    },
    {
      value: '02',
      name: '15°c',
    },
    {
      value: '03',
      name: '10°c',
    },
    {
      value: '04',
      name: '5°c',
    }
    ],
    workGear: '',
    gearSelectRadio: '',
    gearSelectName: '',
    gearDialogShow: false,
    hour: '',
    mins: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      connected: connected
    })
    var lengnuanModel = configManager.getLengNuanData(connected.deviceId)
    if (lengnuanModel) {
      var modeSelectName
      var gearSelectName;
      if (lengnuanModel.workMode == '01') {
        modeSelectName = '加热'
        this.data.gearHotItems.forEach(obj => {
          if (lengnuanModel.workGear == obj.value) {
            gearSelectName = obj.name;
          }
        });
      } else if (lengnuanModel.workMode == '02') {
        modeSelectName = '制冷'
        this.data.gearCoolItems.forEach(obj => {
          if (lengnuanModel.workGear == obj.value) {
            gearSelectName = obj.name;
          }
        });
      }



      this.setData({
        modeSelectRadio: lengnuanModel.workMode,
        modeSelectName: modeSelectName,
        gearSelectRadio: lengnuanModel.workGear,
        gearSelectName: gearSelectName,
        hour: lengnuanModel.hour,
        mins: lengnuanModel.mins
      })
    }

    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
  },

  /**
 * 生命周期函数--监听页面卸载
 */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },


  //模式弹框
  modeTap() {
    this.setData({
      modeDialogShow: true
    })
  },

  /**
   * 模式选择
   * @param {*} e 
   */
  modeRadioChange: function (e) {
    this.setData({
      provisionModeRadioChange: e.detail.value
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
    this.setData({//点击确认按钮后，选择为当前模式
      modeSelectRadio: this.data.provisionModeRadioChange
    })
    let modeSelectRadio = this.data.modeSelectRadio;
    var modeSelectName;
    this.data.modeItems.forEach(obj => {
      if (modeSelectRadio == obj.value) {
        modeSelectName = obj.name;
      }
    });

    var gearSelectName;
    var gearSelectRadio = this.data.gearSelectRadio
    if (modeSelectRadio == '02') {//制冷
      this.data.gearCoolItems.forEach(obj => {
        if (gearSelectRadio == obj.value) {
          gearSelectName = obj.name;
        }
      });
    } else {//制热
      this.data.gearHotItems.forEach(obj => {
        if (gearSelectRadio == obj.value) {
          gearSelectName = obj.name;
        }
      });
    }
    console.log("gearSelectName", gearSelectName)

    this.setData({
      modeDialogShow: false,
      modeSelectRadio: modeSelectRadio,
      modeSelectName: modeSelectName,
      gearSelectName: gearSelectName
    })
  },

  //档位弹框
  gearTap() {
    this.setData({
      gearDialogShow: true
    })
  },

  /**
   * 档位选择
   * @param {*} e 
   */
  gearRadioChange: function (e) {
    this.setData({
      gearSelectRadio: e.detail.value
    })
    console.log("gearSelectRadio:", this.data.gearSelectRadio)
  },

  /**
   * 档位选择点击
   * @param {*} e 
   */
  onGearModeClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        gearDialogShow: false
      })
      return;
    }
    let gearSelectRadio = this.data.gearSelectRadio;
    var gearSelectName;
    if (this.data.modeSelectRadio == '02') {//制冷
      this.data.gearCoolItems.forEach(obj => {
        if (gearSelectRadio == obj.value) {
          gearSelectName = obj.name;
        }
      });
    } else {//制热
      this.data.gearHotItems.forEach(obj => {
        if (gearSelectRadio == obj.value) {
          gearSelectName = obj.name;
        }
      });
    }

    console.log("gearSelectName:", gearSelectName)
    this.setData({
      gearDialogShow: false,
      gearSelectRadio: gearSelectRadio,
      gearSelectName: gearSelectName,
    })
  },

  /**
 * 时间选择
 * @param {}} e 
 */
  bindTimeChange: function (e) {
    var time = e.detail.value
    var times = time.split(':')

    this.setData({
      hour: times[0],
      mins: times[1]
    })
  },


  //点击保存
  saveTap() {
    if (!this.data.modeSelectRadio || !this.data.modeSelectName) {
      wx.showToast({
        title: '请选择模式',
        icon: 'error'
      })
      return
    }
    if (!this.data.gearSelectRadio || !this.data.gearSelectName) {
      wx.showToast({
        title: '请选择档位',
        icon: 'error'
      })
      return
    }
    if (!this.data.hour || !this.data.mins) {
      wx.showToast({
        title: '请选择时间',
        icon: 'error'
      })
      return
    }
    var cmd = "FFFFFFFFFE1400020000" + this.data.hour + this.data.mins + "00" + this.data.modeSelectRadio + this.data.gearSelectRadio + "000000"
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(this.data.connected, cmd)
  },



  /**
 * 蓝牙回复回调
 * @param {*} cmd 
 */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    console.info('blueReply->timeset', cmd);
    if (cmd.indexOf("FFFFFFFFFE14000201") >= 0) {
      var lengnuanModel = {
        hour: this.data.hour,
        mins: this.data.mins,
        workMode: this.data.modeSelectRadio,
        workGear: this.data.gearSelectRadio
      }
      configManager.putLengNuanData(lengnuanModel, this.data.connected.deviceId)
      wx.showModal({
        title: '零睡吧',
        content: "设置成功!",
        showCancel: false,
        success(res) {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
    }
  },

})