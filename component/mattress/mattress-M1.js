// component/mattress/mattress-M1.js
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
    containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 10,
    connected: {},
    currentAnjian: {
      anjian: '', // kandianshi,lingyali,zhihan,fuyuan
      name: '' // 助眠，顶腰，按摩
    },
    modeType: '',//助眠 0，顶腰 1，按摩 2
  },

  /**
  * 页面的生命周期
  */
  pageLifetimes: {
    show: function () {
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
      console.info("mattress-b1-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("mattress-b1-->ready");
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
      console.info("mattress-b1-->detached");
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
      console.info('mattress-B1->initConnected:', connected, this.observer);
      console.log(connected)
      that.setData({
        connected: connected,
      })
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
    },

    /**
    * 蓝牙回复回调
    * @param {*} cmd 
    */
    blueReply(cmd) {
      var that = this.observer;
      cmd = cmd.toUpperCase();
      console.error('mattress-B1->blueReply', cmd);

      // var anMoStatus = cmd.substr(20, 2).toUpperCase();
      // if (anMoStatus == '01') {
      //   that.setData({
      //     anMoStatus: true
      //   })
      // }
      // var status = cmd.substr(16, 2).toUpperCase();
      // var result = util.byteToBitsBylowe('0x' + status)
      // if (result.length == 8) {
      //   if (result[0] == 1) {
      //     that.setData({
      //       kandianshi: true
      //     })
      //   }
      //   if (result[1] == 1) {
      //     that.setData({
      //       lingyali: true
      //     })
      //   }
      //   if (result[2] == 1) {
      //     that.setData({
      //       jiyi1: true
      //     })
      //   }
      //   if (result[3] == 1) {
      //     that.setData({
      //       jiyi2: true
      //     })
      //   }
      //   if (result[4] == 1) {
      //     that.setData({
      //       zhihan: true
      //     })
      //   }
      // }

    },

    //选择模式
    selectMode(event) {
      var type = event.currentTarget.dataset.type
      var name = 'zhumian'
      var cmd = ''
      if (type == 'zhumian') {
        name = '助眠'
        cmd = 'FFFFFFFFFF0A0108'
      } else if (type == 'dingyao') {
        name = '顶腰'
        cmd = 'FFFFFFFFFF0A010C'
      } else if (type == 'anmo') {
        name = '按摩'
        cmd = 'FFFFFFFFFF0A0103'
      }
      this.setData({
        modeType: type,
        currentAnjian: {
          anjian: 'zhumian', // kandianshi,lingyali,zhihan,fuyuan
          name: name // 助眠，顶腰，按摩
        }
      })
      cmd = cmd + crcUtil.swapHexByteOrder(crcUtil.crc16(cmd));
      util.sendBlueCmd(this.data.connected, cmd);
    },

    //睡眠模式
    changeShuimian(e) {
      console.log(e)
      var status = e.detail.value
      var cmd = ''
      if (status) {
        cmd = 'FFFFFFFFFF0C03060001'
      } else {
        cmd = 'FFFFFFFFFF0C03060000'
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
  }
})
