// pages/pressure/pressure.js
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
    pressureList: [{
      name: '1号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '2号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '3号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '4号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '5号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '6号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '7号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '8号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '9号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '10号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '11号气囊',
      value: 0,
      isSelect: false
    }, {
      name: '12号气囊',
      value: 0,
      isSelect: false
    }],
    pressureValueList: [],//压力值
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let connected = configManager.getCurrentConnected();
    var pressureValueList = []
    for (var i = 0; i < 401; ++i) {
      pressureValueList.push((i / 10).toFixed(1))
    }
    this.setData({
      pressureValueList: pressureValueList,
      connected: connected
    })
    this.notifyBLECharacteristicValueChange();

    var cmd = "FFFFFFFFFF0B020400"
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(connected, cmd)
  },


  //选择压力
  pickerChange(e) {
    var index = e.currentTarget.dataset.index
    var value = e.detail.value

    var pressureList = this.data.pressureList
    pressureList[index].value = (value / 10).toFixed(1)
    // pressureList[index].isSelect = true
    this.setData({
      pressureList: pressureList
    })
  },

  //是否选中
  selectPressTap(e){
    var index = e.currentTarget.dataset.index

    var pressureList = this.data.pressureList
    pressureList[index].isSelect = !pressureList[index].isSelect
    this.setData({
      pressureList: pressureList
    })

  },


  //提交压力设置
  tapSubmit() {
    var cmd = "FFFFFFFFFF2F030500" //协议头
    var pressureList = this.data.pressureList
    pressureList.forEach((item, index) => {
      // console.log(index)
      if (item.isSelect) {
        cmd = cmd + "01"
      } else {
        cmd = cmd + "00"
      }
      var result = util.ab2hex(util.intToByteArray(item.value * 10))
      cmd = cmd + result
    })
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    console.log(cmd.toUpperCase())
    var connected = this.data.connected
    util.sendBlueCmd(connected,cmd)
  },


  /**
 * 蓝牙回复回调
 * @param {*} cmd 
 */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    var prefix = cmd.substr(0, 18);
    console.info('report->askBack', cmd, prefix);

    if (prefix == "FFFFFFFFFF2F030501") {
      wx.showModal({
        title: '零睡吧',
        content:"设置成功!",
        showCancel: false,
        success(res){
          if(res.confirm){
            wx.navigateBack()
          }
        }
      })
    } else if (prefix == "FFFFFFFFFF2F020401") {
      var result = cmd.substr(18, 72)
      // console.log(result)
      if (result.length == 72) {
        var pressureList = this.data.pressureList

        var resArray = util.strToArray(result, 6)
        resArray.forEach((item, index) => {
          var isSelect = item.substr(0, 2)
          if (isSelect == '01') {
            pressureList[index].isSelect = true
          } else {
            pressureList[index].isSelect = false
          }
          var value = util.str16To10(item.substr(4, 2) + item.substr(2, 2))
          pressureList[index].value = (value / 10).toFixed(1)
        })

        this.setData({
          pressureList: pressureList
        })
      }
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
        util.showModal('开启监听失败，请重新进入');
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