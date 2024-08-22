// component/mattress/mattress-M2.js
const util = require('../../utils/util')
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter')
const crcUtil = require('../../utils/crcUtil');
const app = getApp();
const askPrefix = 'FFFFFFFF0300'; // 询问码前缀
const askReplyPrefix = 'FFFFFFFF031200'; // 询问码回复前缀
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀

Component({
  /**
   * 组件的属性列表
   */
  properties: {},

  options: {
    addGlobalClass: true,
  },

  /**
   * 组件的初始数据
   */
  data: {
    skin: app.globalData.skin,
    display: app.globalData.display,
    containerHeight: '',
    connected: {},
    timeStr: '',//选择的时间 时间字符串
    isTimer: false,//定时开启
    //按钮位置参数
    buttonTop: 17.75,
    startPoint: 0,
    windowWidth: '',
    scales: [{
      temp: '45',
      color: '#FF1204'
    }, {
      temp: '40',
      color: '#EA3F03'
    }, {
      temp: '35',
      color: '#FF6D04'
    }, {
      temp: '30',
      color: '#FF9704'
    }, {
      temp: '关闭',
      color: '#41B67D'
    }, {
      temp: '20',
      color: '#17C9D5'
    }, {
      temp: '15',
      color: '#2EBFE4'
    }, {
      temp: '10',
      color: '#47B4F4'
    }, {
      temp: '5',
      color: '#1A89FE'
    }
    ],
    selectScaleIndex: 0,
    scaleLeft: 0,//温度列表偏移的距离
  },

  /**
  * 页面的生命周期
  */
  pageLifetimes: {
    show: function () {
      var that = this
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin
      })
      wx.getSystemInfo({
        success(res) {
          var windowWidth = res.windowWidth

          var result = windowWidth / 2 + 34

          that.setData({
            windowWidth: windowWidth,
            scaleLeft: result
          })
        }
      })
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("bed-b1-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("bed-b1-->ready");
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached" + app.globalData.screenHeight + "-" + app.globalData.navHeight);
      this.setData({
        display: app.globalData.display,
        // 屏幕高度-顶部高度-tab高度-预留5px底部距离
        containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 10
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("bed-b1-->detached");
      var that = this;
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
      console.info('bed-b1->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      that.askJiyiStatus(connected, that);
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
    },

    /**
     * 询问记忆状态 （合并询问码）
     */
    askJiyiStatus(connected, cur) {
      // 合并询问码
      var cmd = 'FFFFFFFFFE0B010000';
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      console.log(cmd)
      cur.sendAskBlueCmd(cmd);
    },

    /**
    * 蓝牙回复回调
    * @param {*} cmd 
    */
    blueReply(cmd) {
      var that = this.observer;
      cmd = cmd.toUpperCase();
      console.error('bed-B1->blueReply', cmd);

      //查询回复
      if (cmd.indexOf("FFFFFFFFFE") > -1) {

        var gear = cmd.substr(18, 2).toUpperCase();
        var settingStatus = cmd.substr(20, 2).toUpperCase();
        var timeHour = cmd.substr(22, 2).toUpperCase();
        var timeMins = cmd.substr(24, 2).toUpperCase();

        console.log("cmd====", util.byteToBitsBylowe('0x' + gear))
        var gear2bit = util.byteToBitsBylowe('0x' + gear)
        var workState = gear2bit[7].toString() + gear2bit[6].toString()
        console.log(workState)
        var selectScaleIndex = 0
        if (workState == '11') {
          console.log('正在工作')
          var workModeState = gear2bit[5].toString() + gear2bit[4].toString()
          var workGear = parseInt(gear2bit[3].toString() + gear2bit[2].toString() + gear2bit[1].toString() + gear2bit[0].toString(), 2)

          if (workModeState == '10') {
            console.log('正在加热')
            selectScaleIndex = workGear + 4
          } else {
            console.log('正在制冷')
            selectScaleIndex = workGear
          }

        } else {
          selectScaleIndex = 4 //关闭状态
          console.log('未在工作')
        }


        console.log("response====", util.byteToBitsBylowe('0x' + settingStatus))
        var setting2bit = util.byteToBitsBylowe('0x' + settingStatus)
        var settingState = setting2bit[7].toString() + setting2bit[6].toString()
        console.log(settingState)
        var isTimer = false
        if (settingState == '11') {
          console.log('设置定时')
          isTimer = true
          var settingModeState = setting2bit[5].toString() + setting2bit[4].toString()
          console.log(settingModeState)
          if (settingModeState == '10') {
            console.log('加热模式')
          } else if (settingModeState == '01') {
            console.log('制冷模式')
          } else if (settingModeState == '00') {
            console.log('未设置')
          }
          var settingGear = setting2bit[3].toString() + setting2bit[2].toString() + setting2bit[1].toString() + setting2bit[0].toString()
          console.log(settingGear)
          console.log(parseInt(settingGear, 2) + "档")
        } else {
          isTimer = false
          console.log('未设置定时')
        }
        var hour = util.str16To10('0x' + timeHour)
        var mins = util.str16To10('0x' + timeMins) > 9 ? util.str16To10('0x' + timeMins) : '0' + util.str16To10('0x' + timeMins)
        console.log('时间:' + hour + ":" + mins)

        that.setData({
          timeStr: hour + ":" + mins,
          isTimer: isTimer,
          selectScaleIndex: selectScaleIndex,
          buttonTop: 35.5625 * selectScaleIndex + 17.75
        })
      }
    },


    /**
    * 发送询问记忆状态命令
    * @param {}} cmd 
    */
    sendAskBlueCmd(cmd) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, cmd);
    },

    /**
     * 发送蓝牙命令
     */
    sendBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, cmd, options);
    },

    /**
     * 发送完整的蓝牙命令
     * @param {} cmd 
     * @param {*} options 
     */
    sendFullBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, cmd, options);
    },



    /*************-------------点击事件--------------------*********** */

    //模拟回复
    //  var response = "FFFFFFFFFE0F010001D2E4160314EE"

    //  var gear = response.substr(18, 2).toUpperCase();
    //  var settingStatus = response.substr(20, 2).toUpperCase();
    //  var timeHour = response.substr(22, 2).toUpperCase();
    //  var timeMins = response.substr(24, 2).toUpperCase();

    //  console.log("response====", util.byteToBitsBylowe('0x' + gear))
    //  var gear2bit = util.byteToBitsBylowe('0x' + gear)
    //  var workState = gear2bit[7].toString() + gear2bit[6].toString()
    //  console.log(workState)
    //  if (workState == '11') {
    //    console.log('正在工作')
    //    var workModeState = gear2bit[5].toString() + gear2bit[4].toString()
    //    if (workModeState == '10') {
    //      console.log('正在加热')
    //    } else {
    //      console.log('正在制冷')
    //    }
    //    var workGear = gear2bit[3].toString() + gear2bit[2].toString() + gear2bit[1].toString() + gear2bit[0].toString()
    //    console.log(workGear)
    //    console.log(parseInt(workGear, 2) + "档")
    //  } else {
    //    console.log('未在工作')
    //  }


    //  console.log("response====", util.byteToBitsBylowe('0x' + settingStatus))
    //  var setting2bit = util.byteToBitsBylowe('0x' + settingStatus)
    //  var settingState = setting2bit[7].toString() + setting2bit[6].toString()

    //  if (settingState == '11') {
    //    console.log('设置定时')
    //    var settingModeState = setting2bit[5].toString() + setting2bit[4].toString()
    //    console.log(settingModeState)
    //    if (settingModeState == '10') {
    //      console.log('加热模式')
    //    } else if (settingModeState == '01') {
    //      console.log('制冷模式')
    //    } else if (settingModeState == '00') {
    //      console.log('未设置')
    //    }
    //    var settingGear = setting2bit[3].toString() + setting2bit[2].toString() + setting2bit[1].toString() + setting2bit[0].toString()
    //    console.log(settingGear)
    //    console.log(parseInt(settingGear, 2) + "档")
    //  } else {
    //    console.log('未设置定时')
    //  }
    //  var hour = util.str16To10('0x' + timeHour)
    //  var mins = util.str16To10('0x' + timeMins) > 9 ? util.str16To10('0x' + timeMins) : '0' + util.str16To10('0x' + timeMins)
    //  console.log('时间:' + hour + ":" + mins)

    //  this.setData({
    //    timeStr:  hour + ":" + mins
    //  })






    //定时开启关闭
    changeSw(e) {
      var value = e.detail.value
      console.log(value)
      if (value) {//开启
        var cmd = "FFFFFFFFFE0C010400FF"
        cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
        this.sendBlueCmd(cmd)


        // var response = "FFFFFFFFFE0F010001D2E4160314EE"
        // var gear = response.substr(18, 2).toUpperCase();
        // var settingStatus = response.substr(20, 2).toUpperCase();
        // var timeHour = response.substr(22, 2).toUpperCase();
        // var timeMins = response.substr(24, 2).toUpperCase();

        // console.log("cmd====", util.byteToBitsBylowe('0x' + gear))
        // var gear2bit = util.byteToBitsBylowe('0x' + gear)
        // var workState = gear2bit[7].toString() + gear2bit[6].toString()
        // console.log(workState)
        // var selectScaleIndex = 0
        // if (workState == '11') {
        //   console.log('正在工作')
        //   var workModeState = gear2bit[5].toString() + gear2bit[4].toString()
        //   var workGear = parseInt(gear2bit[3].toString() + gear2bit[2].toString() + gear2bit[1].toString() + gear2bit[0].toString(), 2)

        //   if (workModeState == '10') {
        //     console.log('正在加热')
        //     selectScaleIndex = workGear + 4
        //   } else {
        //     console.log('正在制冷')
        //     selectScaleIndex = workGear
        //   }

        // } else {
        //   selectScaleIndex = 4 //关闭状态
        //   console.log('未在工作')
        // }


        // console.log("response====", util.byteToBitsBylowe('0x' + settingStatus))
        // var setting2bit = util.byteToBitsBylowe('0x' + settingStatus)
        // var settingState = setting2bit[7].toString() + setting2bit[6].toString()
        // var isTimer = false
        // if (settingState == '11') {
        //   console.log('设置定时')
        //   isTimer = true
        //   var settingModeState = setting2bit[5].toString() + setting2bit[4].toString()
        //   console.log(settingModeState)
        //   if (settingModeState == '10') {
        //     console.log('加热模式')
        //   } else if (settingModeState == '01') {
        //     console.log('制冷模式')
        //   } else if (settingModeState == '00') {
        //     console.log('未设置')
        //   }
        //   var settingGear = setting2bit[3].toString() + setting2bit[2].toString() + setting2bit[1].toString() + setting2bit[0].toString()
        //   console.log(settingGear)
        //   console.log(parseInt(settingGear, 2) + "档")
        // } else {
        //   isTimer = false
        //   console.log('未设置定时')
        // }
        // var hour = util.str16To10('0x' + timeHour)
        // var mins = util.str16To10('0x' + timeMins)
        // mins = mins > 9 ? mins : '0' + mins
        // console.log('时间:' + hour + ":" + mins)

        // this.setData({
        //   timeStr: hour + ":" + mins,
        //   isTimer: isTimer,
        //   selectScaleIndex: selectScaleIndex,
        //   buttonTop: 35.5625 * selectScaleIndex + 17.75
        // })

      } else {//关闭
        var cmd = "FFFFFFFFFE0C01040000"
        cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
        this.sendBlueCmd(cmd)
      }
    },

    //选择时间
    changeTime(e) {
      console.log(e)
      var value = e.detail.value
      var time = value.split(":")
      this.setData({
        timeStr: e.detail.value
      })
      if (time.length == 2) {
        var hour = time[0]
        var mins = time[1]

        console.log(util.str10To16(hour))
        console.log(util.str10To16(mins))

        var cmd = "FFFFFFFFFE0D010500" + util.str10To16(hour) + util.str10To16(mins)
        cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
        util.sendBlueCmd(cmd)
      }
    },

    //以下是按钮拖动事件
    buttonStart: function (e) {
      this.setData({ //获取拖动开始点
        startPoint: e.touches[0]
      })
    },
    buttonMove: function (e) {
      var endPoint = e.touches[e.touches.length - 1] //获取拖动结束点
      //计算在X轴上拖动的距离和在Y轴上拖动的距离
      var translateY = endPoint.clientY - this.data.startPoint.clientY
      this.data.startPoint = endPoint //重置开始位置
      var buttonTop = this.data.buttonTop + translateY
      //判断是移动否超出父布局
      if (buttonTop <= 17.75) {
        buttonTop = 17.75
      }
      if (buttonTop + 13.6 >= 302.25) {
        buttonTop = 302.25 - 13.6;
      }

      var result = buttonTop / 35.5625

      this.setData({
        buttonTop: buttonTop,
        selectScaleIndex: parseInt(result)
      })
      // console.log('buttonTop:' + buttonTop)
    },
    buttonEnd: function (e) { },

  }
})

