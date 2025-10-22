// component/mattress/mattress-M1.js
const util = require('../../../utils/util')
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
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
    containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 10,
    connected: {},
    currentAnjian: {
      anjian: '', // kandianshi,lingyali,zhihan,fuyuan
      name: '' // 助眠，顶腰，按摩
    },
    modeType: '',//助眠 0，顶腰 1，按摩 2
    zishiying: false,//自适应
    quanshen: false,//是否联动
    beibu: false,//是否联动
    startTime: '',
    endTime: '',
    selectIndex: -1,//0:全身按摩 1：背部按摩 2：腰部按摩 3：颈部按摩 4：瑜伽 5：按摩停止 6：放气
  },

  /**
  * 页面的生命周期
  */
  pageLifetimes: {
    show: function () {
      console.log("qinang show")
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin,
        connected: configManager.getCurrentConnected()
      })
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("qinang-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("qinang-->ready");
      var that = this;
      let connected = configManager.getCurrentConnected();
      that.setData({
        connected: connected,
      })
      setTimeout(() => {
        that.askQiNangStatus(that.data.connected, that);
      }, 350)
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
      console.info("qinang-->detached");
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
      console.info('qinang->initConnected:', connected, this.observer);
      console.log(connected)
      that.setData({
        connected: connected,
      })
      // that.askQiNangStatus(connected, that);
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
    },

    /**
    * 询问记忆状态 （合并询问码）
    */
    askQiNangStatus(connected, cur) {
      // 合并询问码
      var cmd = 'FFFFFFFFFF14020900000000000000000000';
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      console.log(cmd)
      util.sendBlueCmd(this.data.connected, cmd);
    },

    /**
    * 蓝牙回复回调
    * @param {*} cmd 
    */
    blueReply(cmd) {
      var that = this.observer;
      cmd = cmd.toUpperCase();
      console.error('qinang->blueReply', cmd);
      if (cmd.indexOf("FFFFFFFFFF14020901") > -1) {//询问码回复
        var anmoStatus = cmd.substr(18, 2).toUpperCase();
        var zishiyingStatus = cmd.substr(20, 2).toUpperCase();
        if (anmoStatus == '01') {
          that.setData({
            quanshen: true
          })
        }
        if (anmoStatus == '02') {
          that.setData({
            beibu: true
          })
        }
        if (anmoStatus == '03') {
          that.setData({
            quanshen: true,
            beibu: true
          })
        }
        if (zishiyingStatus == '01') {
          that.setData({
            zishiying: true
          })
        }
      } else if (cmd.indexOf("FFFFFFFFFF0D030C01") > -1) {//自适应开关回码
        var zishiyingStatus = cmd.substr(18, 2).toUpperCase();
        if (zishiyingStatus == '01') {
          that.setData({
            zishiying: true
          })
        } else {
          that.setData({
            zishiying: false
          })
        }
      } else if (cmd.indexOf("FFFFFFFFFF14030D01") > -1) {//全身按摩、背部按摩设置联动(记忆)
        var status = cmd.substr(18, 2).toUpperCase();
        var type = cmd.substr(20, 2).toUpperCase();

        if (status == '01') {
          if (type == '03') {
            that.setData({
              quanshen: true
            })
          } else if (type == '12') {
            that.setData({
              beibu: true
            })
          }
        } else {
          if (type == '03') {
            that.setData({
              quanshen: false
            })
          } else if (type == '12') {
            that.setData({
              beibu: false
            })
          }
        }
      }
    },


    //选择模式
    selectMode(event) {
      var type = event.currentTarget.dataset.type
      var name = ''
      var cmd = ''
      var anjian = ''
      var selectIndex = -1
      if (type == 'quanshen') {
        name = '全身按摩'
        anjian = 'quanshen'
        selectIndex = 0
        var longClick = this.longClick();
        var quanshen = this.data.quanshen;
        if (!quanshen) {
          // 无记忆
          if (longClick) {
            // 长按
            cmd = 'FFFFFFFFFF14030D00010300000000000000'
          } else {
            // 单击
            cmd = 'FFFFFFFFFF0B010300'
          }
        } else {
          // 有记忆
          if (longClick) {
            // 长按
            cmd = 'FFFFFFFFFF14030D00000300000000000000'
          } else {
            // 单击
            cmd = 'FFFFFFFFFF0B010300'
          }
        }
      } else if (type == 'beibu') {
        name = '背部按摩'
        anjian = 'beibu'
        selectIndex = 1
        var longClick = this.longClick();
        var beibu = this.data.beibu;
        if (!beibu) {
          // 无记忆
          if (longClick) {
            // 长按
            cmd = 'FFFFFFFFFF14030D00011200000000000000'
          } else {
            // 单击
            cmd = 'FFFFFFFFFF0B011200'
          }
        } else {
          // 有记忆
          if (longClick) {
            // 长按
            cmd = 'FFFFFFFFFF14030D00001200000000000000'
          } else {
            // 单击
            cmd = 'FFFFFFFFFF0B011200'
          }
        }
      } else if (type == 'yaobu') {
        name = '腰部按摩'
        anjian = 'yaobu'
        selectIndex = 2
        cmd = 'FFFFFFFFFF0B010500'
      } else if (type == 'jingbu') {
        name = '颈部按摩'
        anjian = 'jingbu'
        selectIndex = 3
        cmd = 'FFFFFFFFFF0B010400'
      } else if (type == 'yujia') {
        name = '瑜伽'
        anjian = 'yujia'
        selectIndex = 4
        cmd = 'FFFFFFFFFF0B010C00'
      } else if (type == 'shuimian') {
        name = '睡眠模式'
        anjian = 'shuimian'
        selectIndex = 7
        cmd = 'FFFFFFFFFF0B010900'
      } else if (type == 'anmotingzhi') {
        name = '按摩停止'
        anjian = 'anmotingzhi'
        selectIndex = 5
        cmd = 'FFFFFFFFFF0B010000'
      } else if (type == 'fangqi') {
        name = '放气'
        anjian = 'fangqi'
        selectIndex = 6
        cmd = 'FFFFFFFFFF0B010600'
      }
      this.setData({
        modeType: type,
        currentAnjian: {
          anjian: anjian,
          name: name
        },
        selectIndex: selectIndex
      })
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      util.sendBlueCmd(this.data.connected, cmd);
    },

    //自适应
    ziShiYingSwitch(e) {
      this.setData({
        zishiying: !this.data.zishiying
      })
      var cmd = ''
      if (this.data.zishiying) {
        cmd = 'FFFFFFFFFF0D030C000100'
      } else {
        cmd = 'FFFFFFFFFF0D030C000000'
      }
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      util.sendBlueCmd(this.data.connected, cmd);
    },

    //压力设置
    pressureTap() {
      wx.navigateTo({
        url: '/pages/mainv2/pressure/pressure',
      })
    },

    //按摩设置
    anmoTap() {
      wx.navigateTo({
        url: '/pages/mainv2/anmoset/anmoset',
      })
    },

    /*************-------------点击事件--------------------*********** */
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
      if (this.endTime - this.startTime > 1000) {
        console.log("长按了");
        return true;
      }
      return false;
    },

  }
})
