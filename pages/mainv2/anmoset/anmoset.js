// pages/mainv2/anmoset/anmoset.js
const util = require('../../../utils/util')
const crcUtil = require('../../../utils/crcUtil');
const configManager = require('../../../utils/configManager')
const app = getApp()
const WxNotificationCenter = require('../../../utils/WxNotificationCenter');
const sendPrefix = 'FFFFFFFFFF0D020800'; // 发送码前缀

Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {},
    skin: app.globalData.skin, //当前皮肤样式
    display: app.globalData.display,
    containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 65,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      set: false,
      animated: false,
      showRSSI: false
    }, // 导航栏
    currentModeSelected: '',//选择模式
    currentModeValue: '0300',//模式值
    qingduUpperLimitIndex: 0,//按摩强度上限 挡位：3、4、5、6、7、8
    qingduLowerLimitIndex: 0,//按摩强度下限 挡位：1、2、3、4、5、6
    currentTimeSelected: '',//按摩时间
    currentTimeValue: '',//时间值
    upperLimitList: [
      {
        "gear": 2,
        "value": 20
      },
      {
        "gear": 3,
        "value": 30
      }, {
        "gear": 4,
        "value": 40
      }, {
        "gear": 5,
        "value": 50
      }, {
        "gear": 6,
        "value": 60
      }, {
        "gear": 7,
        "value": 70
      }, {
        "gear": 8,
        "value": 80
      }
    ],
    lowerLimitList: [
      {
        "gear": 1,
        "value": 10
      }, {
        "gear": 2,
        "value": 20
      }, {
        "gear": 3,
        "value": 30
      }, {
        "gear": 4,
        "value": 40
      }, {
        "gear": 5,
        "value": 50
      }, {
        "gear": 6,
        "value": 60
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      connected: connected
    })
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);

    var cmd = sendPrefix + this.data.currentModeValue
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(connected, cmd)
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
    cmd = cmd.toUpperCase();
    console.error('anmoset->blueReply', cmd);
    if (cmd.indexOf('FFFFFFFFFF14020801') > -1) {
      //按摩模式
      var modeStatus = cmd.substr(18, 2).toUpperCase();
      var mode = ''
      if (modeStatus == '03') {
        mode = 'quanshen'
      } else if (modeStatus == '12') {
        mode = 'beibu'
      } else if (modeStatus == '05') {
        mode = 'yaobu'
      } else if (modeStatus == '04') {
        mode = 'jingbu'
      } else if (modeStatus == '0C') {
        mode = 'yujia'
      }
      //按摩时间
      var timeStatus = cmd.substr(28, 2).toUpperCase();
      var timeValue = ''
      if (timeStatus == '00') {
        timeValue = '10min'
      } else if (timeStatus == '01') {
        timeValue = '20min'
      } else if (timeStatus == '02') {
        timeValue = '30min'
      }

      //按摩强度
      var upperStatus = cmd.substr(22, 2).toUpperCase() + cmd.substr(20, 2).toUpperCase();
      var lowerStatus = cmd.substr(26, 2).toUpperCase() + cmd.substr(24, 2).toUpperCase();;
      var upperValue = util.str16To10('0x' + upperStatus);
      console.log("upperValue",upperValue)
      var qingduUpperLimitIndex = 0
      this.data.upperLimitList.forEach((item, index) => {
        if (item.value == upperValue) {
          qingduUpperLimitIndex = index
        }
      })
      var lowerValue = util.str16To10('0x' + lowerStatus);
      console.log("lowerValue",lowerValue)
      var qingduLowerLimitIndex = 0
      this.data.lowerLimitList.forEach((item, index) => {
        if (item.value == lowerValue) {
          qingduLowerLimitIndex = index
        }
      })
      this.setData({
        currentModeSelected: mode,
        currentModeValue: modeStatus,
        currentTimeSelected: timeValue,
        currentTimeValue: timeStatus,
        qingduUpperLimitIndex: qingduUpperLimitIndex,
        qingduLowerLimitIndex: qingduLowerLimitIndex
      })
    } else if (cmd.indexOf('FFFFFFFFFF14030E01') > -1) {
      wx.showToast({
        title: '设置成功!',
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    }
  },

  /**
   * 模式选择
   */
  modeClick(e) {
    var mode = e.currentTarget.dataset.mode;
    var value = e.currentTarget.dataset.value;
    this.setData({
      currentModeSelected: mode,
      currentModeValue: value
    })
    var cmd = sendPrefix + this.data.currentModeValue
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(this.data.connected, cmd)
  },

  /**
    * 事件点击事件
    * @param {*} e 
    */
  timeClick(e) {
    var time = e.currentTarget.dataset.time;
    var value = e.currentTarget.dataset.value;
    console.info('timeClick->' + time + "value:" + value);
    this.setData({
      currentTimeSelected: time,
      currentTimeValue: value
    })
  },

  //强度上限
  upperTap() {
    var qingduUpperGear = this.data.upperLimitList[this.data.qingduUpperLimitIndex].gear
    if (qingduUpperGear == 8) {
      qingduUpperGear = 2
    } else {
      qingduUpperGear++
    }
    var qingduUpperLimitIndex = 0
    this.data.upperLimitList.forEach((item, index) => {
      if (qingduUpperGear == item.gear) {
        qingduUpperLimitIndex = index
      }
    })
    this.setData({
      qingduUpperLimitIndex: qingduUpperLimitIndex
    })
  },

  //强度下限
  lowerTap() {
    var qingduLowerGear = this.data.lowerLimitList[this.data.qingduLowerLimitIndex].gear
    if (qingduLowerGear == 6) {
      qingduLowerGear = 1
    } else {
      qingduLowerGear++
    }
    var qingduLowerLimitIndex = 0
    this.data.lowerLimitList.forEach((item, index) => {
      if (qingduLowerGear == item.gear) {
        qingduLowerLimitIndex = index
      }
    })
    this.setData({
      qingduLowerLimitIndex: qingduLowerLimitIndex
    })
  },

  //点击确认
  confirmTap() {
    var that = this
    var qingduUpperGear = this.data.upperLimitList[this.data.qingduUpperLimitIndex].gear
    var qingduLowerGear = this.data.lowerLimitList[this.data.qingduLowerLimitIndex].gear

    if (qingduUpperGear - qingduLowerGear < 1) {
      wx.showModal({
        title: '提示',
        content: '按摩强度上限至少要比下限大1档',
        complete: (res) => {
          if (res.cancel) {
          }

          if (res.confirm) {
            qingduUpperGear = qingduLowerGear + 2
            that.data.upperLimitList.forEach((item, index) => {
              if (qingduUpperGear == item.gear) {
                that.setData({
                  qingduUpperLimitIndex: index
                })
              }
            })
            console.log(that.data.upperLimitList[that.data.qingduUpperLimitIndex].value)
            console.log(that.data.lowerLimitList[that.data.qingduLowerLimitIndex].value)
            var cmd = "FFFFFFFFFF14030E00" + that.data.currentModeValue.substr(0, 2) + util.str10To16(that.data.upperLimitList[that.data.qingduUpperLimitIndex].value) + "00" + util.str10To16(that.data.lowerLimitList[that.data.qingduLowerLimitIndex].value) + "00" + that.data.currentTimeValue + "000000"
            cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
            console.log(cmd)
            util.sendBlueCmd(that.data.connected, cmd);
          }
        }
      })
    } else {
      var cmd = "FFFFFFFFFF14030E00" + that.data.currentModeValue.substr(0, 2) + util.str10To16(that.data.upperLimitList[that.data.qingduUpperLimitIndex].value) + "00" + util.str10To16(that.data.lowerLimitList[that.data.qingduLowerLimitIndex].value) + "00" + that.data.currentTimeValue + "000000"
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      console.log(cmd)
      util.sendBlueCmd(that.data.connected, cmd);
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
      },
      fail: function (res) {
        console.error("main->notifyBLECharacteristicValueChange error", res);
        util.showModal('蓝牙通讯不稳定，请重新进入');
      }
    });
    wx.onBLECharacteristicValueChange((res) => {
      // console.info('main->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received', received);
      that.blueReply(received, connected);
    });
  },
})