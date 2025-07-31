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
    qingduUpperLimit: 5,//按摩强度上限 5、6、7、8
    qingduLowerLimit: 1,//按摩强度下限 1、2、3、4
    currentTimeSelected: '',//按摩时间
    currentTimeValue: '',//时间值
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
      var upperValue = util.str16To10('0x' + upperStatus) / 10;
      var lowerValue = util.str16To10('0x' + lowerStatus) / 10;

      this.setData({
        currentModeSelected: mode,
        currentModeValue: modeStatus,
        currentTimeSelected: timeValue,
        currentTimeValue: timeStatus,
        qingduUpperLimit: upperValue,
        qingduLowerLimit: lowerValue
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
    var qingduUpperLimit = this.data.qingduUpperLimit
    if (qingduUpperLimit == 8) {
      qingduUpperLimit = 5
    } else {
      qingduUpperLimit++
    }
    this.setData({
      qingduUpperLimit: qingduUpperLimit
    })
  },

  //强度下限
  lowerTap() {
    var qingduLowerLimit = this.data.qingduLowerLimit
    if (qingduLowerLimit == 4) {
      qingduLowerLimit = 1
    } else {
      qingduLowerLimit++
    }
    this.setData({
      qingduLowerLimit: qingduLowerLimit
    })
  },

  //点击确认
  confirmTap() {
    var cmd = "FFFFFFFFFF14030E00" + this.data.currentModeValue.substr(0, 2) + util.str10To16(this.data.qingduUpperLimit * 10) + "00" + util.str10To16(this.data.qingduLowerLimit * 10) + "00" + this.data.currentTimeValue + "000000"
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    console.log(cmd)
    util.sendBlueCmd(this.data.connected, cmd);
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