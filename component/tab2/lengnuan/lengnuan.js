// component/lengnuan/lengnuan.js
const util = require('../../../utils/util')
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
const time = require('../../../utils/time');
const app = getApp();


Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 可以通过外部传入控制显示的属性
    visible: {
      type: Boolean,
      value: true
    }
  },

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
    workStatus: "00",//设备工作状态0：空闲1：加热 2：制冷3：水位低4：故障
    //按钮位置参数
    buttonLeft: 0,
    startPoint: 0,
    scales: [
      {
        temp: '5',
        Gear: 'FFFFFFFFFE1000050000040000AA',
        color: '#1A89FE'
      }, {
        temp: '10',
        Gear: 'FFFFFFFFFE1000050000030000AA',
        color: '#47B4F4'
      }, {
        temp: '15',
        Gear: 'FFFFFFFFFE1000050000020000AA',
        color: '#2EBFE4'
      }, {
        temp: '20',
        Gear: 'FFFFFFFFFE1000050000010000AA',
        color: '#17C9D5'
      }, {
        temp: '关闭',
        Gear: 'FFFFFFFFFE1000060000000000AA',
        color: '#41B67D'
      }, {
        temp: '30',
        Gear: 'FFFFFFFFFE1000040000010000AA',
        color: '#FF9704'
      }, {
        temp: '35',
        Gear: 'FFFFFFFFFE1000040000020000AA',
        color: '#FF6D04'
      }, {
        temp: '40',
        Gear: 'FFFFFFFFFE1000040000030000AA',
        color: '#EA3F03'
      },
      {
        temp: '45',
        Gear: 'FFFFFFFFFE1000040000040000AA',
        color: '#FF1204'
      }
    ],
    selectScaleIndex: 4,
    interval5: '',//定时器循环查询温度
    tempRange: [
      5.75, 38.25, 70.75, 103.25, 168.25, 200.75, 233.25, 265.75, 282
    ],
    waterLevel: ''
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
      var lengnuanModel = configManager.getLengNuanData(this.data.connected.deviceId)
      var isTimer = configManager.getLengNuanAlarm(this.data.connected.deviceId)
      if (lengnuanModel && isTimer) {
        this.setData({
          timeStr: lengnuanModel.hour + ":" + lengnuanModel.mins
        })
      }
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("lengnuan-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);

      that.setData({//初始化默认在关闭位置
        buttonLeft: 146.25 - 10.5
      })
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("lengnuan-->ready");
      var that = this;
      let connected = configManager.getCurrentConnected();
      that.setData({
        connected: connected,
      })
      console.log(that.data.connected)
      setTimeout(() => {
        that.askJiyiStatus(that.data.connected, that);
      }, 450)
      var interval5 = setInterval(() => {
        if (that.data.visible) {//页面显示时在进行轮询冷暖的状态
          var cmd = 'FFFFFFFFFE1000010000000000AA'
          cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
          that.sendBlueCmd(cmd)
        }
      }, 1500)
      that.setData({
        interval5: interval5
      })
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
      console.info("lengnuan-->detached");
      var that = this;
      WxNotificationCenter.removeNotification("BLUEREPLY", that);
      if (that.data.interval5) {
        clearInterval(that.data.interval5)
      }
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
      console.info('lengnuan->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      // that.askJiyiStatus(connected, that);
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
    },

    /**
     * 询问冷暖状态 （合并询问码）
     */
    askJiyiStatus(connected, cur) {
      // 冷暖合并询问码
      var cmd = 'FFFFFFFFFE1000000000000000AA';
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      console.log(cmd)
      this.sendAskBlueCmd(cmd);
      setTimeout(() => {
        // 发送实时时间指令
        this.sendTimeInitCmd()
      }, 200)
    },

    sendTimeInitCmd() {
      console.info('lengnuan->发送实时时间指令 time ', new Date().getTime());
      let cmdPrefix = 'FFFFFFFFFE1400070000';
      let date = time.getDateInfo(new Date());
      let cmdTime = date.year + date.month + date.day + date.hour + date.minute + date.second + date.week + "00";
      let cmdCrc = crcUtil.swapHexByteOrder(crcUtil.crc16(cmdPrefix + cmdTime));
      let cmd = cmdPrefix + cmdTime + cmdCrc;
      console.log('sendTimeInitCmd:', cmd);

      // let cmd = "FFFFFFFFFE14000700002507041709450500"
      // let cmdCrc = crcUtil.HexToCSU16(cmd);
      // console.log('sendTimeInitCmd:', cmd + cmdCrc);
      this.sendBlueCmd(cmd);
    },

    /**
    * 蓝牙回复回调
    * @param {*} cmd 
    */
    blueReply(cmd) {
      var that = this.observer;
      cmd = cmd.toUpperCase();
      console.error('lengnuan->blueReply', cmd);

      //查询回复
      if (cmd.indexOf("FFFFFFFFFE14000001") > -1) {
        if (cmd.length < 40) {//返回长度不对
          return
        }
        var timeLower = cmd.substr(18, 1).toUpperCase();
        var stateHigh = cmd.substr(19, 1).toUpperCase();

        // 提取高四位和低四位
        const timeState = parseInt(timeLower, 16);
        const workState = parseInt(stateHigh, 16);

        console.log("timeState:" + timeState)
        console.log("workState:" + workState)

        var gear = cmd.substr(20, 2).toUpperCase();
        var selectScaleIndex = 0
        if (workState == 0) {//空闲
          selectScaleIndex = 4
        } else if (workState == 1) {//加热
          selectScaleIndex = 4 + parseInt(gear)
        } else if (workState == 2) {//制冷
          selectScaleIndex = 4 - parseInt(gear)
          console.log("档位：", parseInt(gear))
        } else if (workState == 3) {//水位低
          selectScaleIndex = 4
        } else if (workState == 4) {//故障
          selectScaleIndex = 4
        }
        console.log("gear:" + gear, "selectScaleIndex:" + selectScaleIndex)

        var buttonLeft = (5 * (selectScaleIndex + 1) - 2.5) * 6.5 - 10.5
        console.log("buttonLeft", buttonLeft)

        //是否设置定时
        var isTimer = false
        if (timeState == 0) {
          isTimer = false
        } else if (timeState == 1) {
          isTimer = true
        }
        console.log("isTimer:" + isTimer)

        //定时时间
        var timeStr = ''
        if (isTimer) {
          var timerHour = cmd.substr(22, 2).toUpperCase();
          var timerMin = cmd.substr(24, 2).toUpperCase();
          var workMode = cmd.substr(26, 2).toUpperCase();
          var workGear = cmd.substr(28, 2).toUpperCase();

          var hour = timerHour
          var mins = timerMin
          timeStr = hour + ":" + mins

          var lengnuanModel = {
            hour: hour,
            mins: mins,
            workMode: workMode,
            workGear: workGear
          }
          configManager.putLengNuanData(lengnuanModel, that.data.connected.deviceId)
        }

        configManager.putLengNuanAlarm(isTimer, that.data.connected.deviceId)

        //温度
        var temp1 = cmd.substr(30, 2).toUpperCase();
        var temp2 = cmd.substr(32, 2).toUpperCase();
        var temp = parseInt(temp1) + "." + parseInt(temp2)

        console.log("temp1:" + temp1, "temp2:" + temp2)

        //水位
        var waterLevelStatus = cmd.substr(34, 2).toUpperCase();
        var waterLevel = parseInt(waterLevelStatus)
        console.log("waterLevel:" + waterLevel)

        that.setData({
          workState: workState,
          selectScaleIndex: selectScaleIndex,
          isTimer: isTimer,
          timeStr: timeStr,
          temp: temp,
          waterLevel, waterLevel,
          buttonLeft: buttonLeft
        })

        console.log("waterLevel", waterLevel, that.data.visible && that.data.waterLevel && that.data.waterLevel < 20)
        if (that.data.visible && that.data.waterLevel && that.data.waterLevel < 20) {
          wx.showModal({
            title: '提示',
            content: '当前水量不足，请加500毫升水',
            showCancel: false,
            complete: (res) => {
            }
          })
        }
      } else if (cmd.indexOf("FFFFFFFFFE14000701") > -1) {//实时时间回码
        console.log("实时时间回码:" + cmd)
      } else if (cmd.indexOf("FFFFFFFFFE14000101") > -1) {//每5s查询一次的状态
        //温度
        var temp1 = cmd.substr(30, 2).toUpperCase();
        var temp2 = cmd.substr(32, 2).toUpperCase();
        var temp = parseInt(temp1) + "." + parseInt(temp2)
        console.log("temp1:" + temp1, "temp2:" + temp2)

        //水位
        var waterLevelStatus = cmd.substr(34, 2).toUpperCase();
        var waterLevel = parseInt(waterLevelStatus)
        console.log("waterLevel:" + waterLevel)

        that.setData({
          temp: temp,
          waterLevel, waterLevel
        })

        // 提取高四位和低四位
        var stateHigh = cmd.substr(19, 1).toUpperCase();
        const workState = parseInt(stateHigh, 16);

        console.log("workState:" + workState)

        var gear = cmd.substr(20, 2).toUpperCase();
        var selectScaleIndex = 0
        if (workState == 0) {//空闲
          selectScaleIndex = 4
        } else if (workState == 1) {//加热
          selectScaleIndex = 4 + parseInt(gear)
        } else if (workState == 2) {//制冷
          selectScaleIndex = 4 - parseInt(gear)
          console.log("档位：", parseInt(gear))
        } else if (workState == 3) {//水位低
          selectScaleIndex = 4
        } else if (workState == 4) {//故障
          selectScaleIndex = 4
        }
        console.log("gear:" + gear, "selectScaleIndex:" + selectScaleIndex)

        if (selectScaleIndex != that.data.selectScaleIndex) {//返回的状态与当前的状态不一致
          var buttonLeft = (5 * (selectScaleIndex + 1) - 2.5) * 6.5 - 10.5
          console.log("buttonLeft", buttonLeft)

          that.setData({
            workState: workState,
            selectScaleIndex: selectScaleIndex,
            buttonLeft: buttonLeft
          })
        }
      } else if (cmd.indexOf('FFFFFFFFFE10000301') > -1) {
        var status = cmd.substr(20, 2).toUpperCase();
        console.log("putLengNuanAlarm:", status)
        if (status == '00') {//关闭
          configManager.putLengNuanAlarm(false, that.data.connected.deviceId)
          that.setData({
            timeStr: ''
          })
        } else {//开启
          configManager.putLengNuanAlarm(true, that.data.connected.deviceId)
          var lengnuanModel = configManager.getLengNuanData(that.data.connected.deviceId)
          if (lengnuanModel) {
            that.setData({
              timeStr: lengnuanModel.hour + ":" + lengnuanModel.mins
            })
          }
        }
      }
    },


    /**
    * 发送询问状态命令
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


    /*************-------------点击事件--------------------*********** */

    //定时开启关闭
    changeSw(e) {
      var value = e.detail.value
      console.log(value)
      if (value) {//开启
        var cmd = "FFFFFFFFFE1000030000010000AA"
        cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
        this.sendBlueCmd(cmd)
      } else {//关闭
        var cmd = "FFFFFFFFFE1000030000000000AA"
        cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
        this.sendBlueCmd(cmd)
      }
    },

    //时间设置
    timeSet() {
      wx.navigateTo({
        url: '/pages/mainv2/timeset/timeset',
      })
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
        console.log(hour)
        console.log(mins)
        var gear = ''
        if (this.data.workStatus == 1) {
          gear = "0" + (this.data.selectScaleIndex - 3)
        } else if (this.data.workStatus == 2) {
          gear = "0" + this.data.selectScaleIndex
        } else {
          gear = "00"
        }

        var cmd = "FFFFFFFFFE1400020000" + util.str10To16(hour) + util.str10To16(mins) + "00" +
          this.data.workStatus + gear + "000000"
        cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
        this.sendBlueCmd(cmd)
      }
    },


    //以下是按钮拖动事件
    buttonStart: function (e) {
      this.setData({ //获取拖动开始点
        startPoint: e.touches[0]
      })
    },
    buttonMove: function (e) {
      // console.log(e)
      var endPoint = e.touches[e.touches.length - 1] //获取拖动结束点
      //计算在X轴上拖动的距离和在Y轴上拖动的距离
      var translateX = endPoint.clientX - this.data.startPoint.clientX
      this.data.startPoint = endPoint //重置开始位置
      var buttonLeft = this.data.buttonLeft + translateX
      //判断是移动否超出父布局
      if (buttonLeft <= 0) {
        buttonLeft = 0
      }
      if (buttonLeft + 21 >= 292.5) {
        buttonLeft = 292.5 - 21;
      }
      var gear = this.getGearByAction(buttonLeft)
      // var result = buttonLeft / 31.5556
      this.setData({
        buttonLeft: buttonLeft,
        selectScaleIndex: gear
      })
    },
    buttonEnd: function (e) {
      //发送指令
      console.log("档位", this.data.selectScaleIndex, this.data.scales[this.data.selectScaleIndex])
      var workStatus = this.data.workStatus
      if (this.data.selectScaleIndex > 4) {
        workStatus = '01'
      } else if (this.data.selectScaleIndex == 4) {
        workStatus = '00'
      } else {
        workStatus = '02'
      }
      this.setData({
        workStatus: workStatus
      })
      var cmd = this.data.scales[this.data.selectScaleIndex].Gear
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      this.sendBlueCmd(cmd)
    },

    //根据移动的距离判断当前所在的档位
    getGearByAction(x) {
      var gear = 0;
      var tempRange = this.data.tempRange
      for (var i = 0; i < tempRange.length; i++) {
        if (x < tempRange[i]) {
          gear = i;
          break;
        }
      }
      return gear;
    }
  }
})

