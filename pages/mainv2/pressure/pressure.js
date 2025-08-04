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
      name: '1',
      pressNo: '0001',
      value: 0,
      isSelect: false
    }, {
      name: '2',
      pressNo: '0002',
      value: 0,
      isSelect: false
    }, {
      name: '3',
      pressNo: '0004',
      value: 0,
      isSelect: false
    }, {
      name: '4',
      pressNo: '0008',
      value: 0,
      isSelect: false
    }, {
      name: '5',
      pressNo: '0010',
      value: 0,
      isSelect: false
    }, {
      name: '6',
      pressNo: '0020',
      value: 0,
      isSelect: false
    }, {
      name: '7',
      pressNo: '0040',
      value: 0,
      isSelect: false
    }, {
      name: '8',
      pressNo: '0080',
      value: 0,
      isSelect: false
    }, {
      name: '9',
      pressNo: '0100',
      value: 0,
      isSelect: false
    }, {
      name: '10',
      pressNo: '0200',
      value: 0,
      isSelect: false
    }, {
      name: '11',
      pressNo: '0400',
      value: 0,
      isSelect: false
    }, {
      name: '12',
      pressNo: '0800',
      value: 0,
      isSelect: false
    }],
    selectIndex: 0,//选中的气囊
    isAudoSave: -1,//是否自动保存气压设置
    isShowSuccess: false,//是否弹成功弹框
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

    var cmd = "FFFFFFFFFF0B020400"
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(connected, cmd)

    // var that = this
    // setInterval(() => {
    //   var isAudoSave = that.data.isAudoSave
    //   //每秒执行一次，自动保存气压设置
    //   if (isAudoSave >= 3) {
    //     var cmd = "FFFFFFFFFF2F030500" //协议头
    //     var pressureList = this.data.pressureList
    //     pressureList.forEach((item, index) => {
    //       cmd = cmd + "01"
    //       var result = util.ab2hex(util.intToByteArray( item.value * 10))
    //       cmd = cmd + result
    //     })
    //     cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    //     console.log(cmd.toUpperCase())
    //     var connected = this.data.connected
    //     util.sendBlueCmd(connected, cmd)

    //     that.setData({
    //       isAudoSave: -1,
    //       isShowSuccess:false
    //     })
    //   } else {
    //     if (isAudoSave >= 0) {
    //       isAudoSave++;
    //       that.setData({
    //         isAudoSave: isAudoSave
    //       })
    //     }
    //   }

    // }, 1000)
  },


  /**
 * 生命周期函数--监听页面卸载
 */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },


  //选择需要修改的气囊
  selectPressure(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      selectIndex: index
    })
  },

  //减小
  jianTap() {
    var pressureList = this.data.pressureList
    var pressureValue = pressureList[this.data.selectIndex].value
    if (pressureValue > 0) {
      pressureValue--
    }
    pressureList[this.data.selectIndex].value = pressureValue
    this.setData({
      isAudoSave: 0,
      pressureList: pressureList
    })
    var connected = this.data.connected
    var cmd = "FFFFFFFFFF0F0117" + pressureList[this.data.selectIndex].pressNo + util.ab2hex(util.intToByteArray(pressureValue * 10)) + "00"
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(connected, cmd)
  },

  //增加
  jiaTap() {
    var pressureList = this.data.pressureList
    var pressureValue = pressureList[this.data.selectIndex].value
    if (pressureValue < 9) {
      pressureValue++
    }
    pressureList[this.data.selectIndex].value = pressureValue
    this.setData({
      isAudoSave: 0,
      pressureList: pressureList
    })
    var connected = this.data.connected
    var cmd = "FFFFFFFFFF0F0117" + pressureList[this.data.selectIndex].pressNo + util.ab2hex(util.intToByteArray(pressureValue * 10)) + "00"
    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    util.sendBlueCmd(connected, cmd)
  },

  //提交压力设置
  tapSubmit() {
    this.setData({
      isShowSuccess: true
    })
    var cmd = "FFFFFFFFFF2F030500" //协议头
    var pressureList = this.data.pressureList

    pressureList.forEach((item, index) => {
      cmd = cmd + "01"
      var result = util.ab2hex(util.intToByteArray(item.value * 10))
      cmd = cmd + result
    })

    cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
    console.log(cmd.toUpperCase())
    var connected = this.data.connected
    util.sendBlueCmd(connected, cmd)
  },


  /**
 * 蓝牙回复回调
 * @param {*} cmd 
 */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    var prefix = cmd.substr(0, 18);
    console.info('blueReply->pressure', cmd, prefix);
    if (prefix == "FFFFFFFFFF2F030501") {
      if (this.data.isShowSuccess) {
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
      } else {
        wx.showToast({
          title: '自动保存成功!',
          icon: 'none'
        })
      }
    } else if (prefix == "FFFFFFFFFF2F020401") {
      var result = cmd.substr(18, 72)
      // console.log(result)
      if (result.length == 72) {
        var pressureList = this.data.pressureList

        var resArray = util.strToArray(result, 6)
        resArray.forEach((item, index) => {
          // var isSelect = item.substr(0, 2)
          // if (isSelect == '01') {
          //   pressureList[index].isSelect = true
          // } else {
          //   pressureList[index].isSelect = false
          // }
          var value = util.str16To10(item.substr(4, 2) + item.substr(2, 2))
          // pressureList[index].value = (value / 10).toFixed(1)
          pressureList[index].value = (value / 10).toFixed(0)
        })

        this.setData({
          pressureList: pressureList
        })
      }
    }
  },
})