// component/dengguang/dengguang.js

const app = getApp();
const util = require('../../../utils/util')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀


Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    skin: app.globalData.skin,
    display: app.globalData.display,
    connected: {},
    currentSelected: '',
    isLightShow: false,
    lineItems: [] //灯光亮度
  },


  pageLifetimes: {
    show: function () {
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin
      })
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("dengguang-->created", app.globalData.display);
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached");
      this.setData({
        display: app.globalData.display
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("detached");
      var that = this;
      WxNotificationCenter.removeNotification("INIT", that);
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
      console.info('dengguang->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      // console.info('dengguang ->发送灯光亮度命令');
      // that.sendBlueCmd('FF23D729');
    },


    /**
     * 发送蓝牙命令
     */
    sendBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, sendPrefix + cmd, options);
    },

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      var lineItems = that.data.lineItems;
      var prefix = cmd.substr(0, 14).toUpperCase();
      if ('FFFFFFFF050001' != prefix) {
        return;
      }
      that.setData({
        isLightShow: true,
      })

      var level = cmd.substr(14, 2).toUpperCase();
      console.info('dengguang->blueReply 收到的蓝牙回复', cmd, level);
      if ('01' == level) {
        lineItems = [1];
      } else if ('02' == level) {
        lineItems = [1, 1];
      } else if ('03' == level) {
        lineItems = [1, 1, 1];
      } else if ('04' == level) {
        lineItems = [1, 1, 1, 1];
      } else if ('05' == level) {
        lineItems = [1, 1, 1, 1, 1];
      } else if ('06' == level) {
        lineItems = [1, 1, 1, 1, 1, 1];
      } else if ('07' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1];
      } else if ('08' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1, 1];
      } else if ('09' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1, 1, 1];
      } else if ('0A' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      } else if ('00' == level) {
        lineItems = [];
        that.setData({
          currentSelected: ''
        })
      }
      that.setData({
        lineItems: lineItems
      })
    },






    /**********************点击事件************* */
    click(e) {
      var that = this;
      var currentSelected = this.data.currentSelected;
      var time = e.currentTarget.dataset.time;
      console.info('click->' + time);

      var cmd = '';
      if (time == '10min') {
        cmd = '001916CA';
      } else if (time == '8h') {
        cmd = '001A56CB';
      } else if (time == '10h') {
        cmd = '001B970B';
      }
      this.sendBlueCmd(cmd, ({
        success: (res) => {
          if (time == currentSelected) {
            that.setData({
              currentSelected: ''
            })
          } else {
            that.setData({
              currentSelected: time
            })
          }
        },
        fail: (res) => {

        }
      }));
    },

    /**
     * 亮度减小
     * @param {*} e 
     */
    tapMinus(e) {
      let lineItems = this.data.lineItems;
      if (lineItems.length == 0) {
        util.showToast('当前亮度已经调整到最小');
        return;
      }
      lineItems.splice(lineItems.length - 1, 1);
      this.sendDengguangLevelCmd(lineItems.length);
      this.setData({
        lineItems: lineItems
      })
    },

    /**
     * 亮度增加
     * @param {*} e 
     */
    tapPlus(e) {
      let lineItems = this.data.lineItems;
      if (lineItems.length == 10) {
        util.showToast('当前亮度已经调整到最大');
        return;
      }
      lineItems.push(1);
      this.sendDengguangLevelCmd(lineItems.length);
      this.setData({
        lineItems: lineItems
      })
    },


    sendDengguangLevelCmd(level) {
      let cmd = sendPrefix;
      switch (level) {
        case 0:
          cmd += '002396D9';
          break;
        case 1:
          cmd += '01239749';
          break;
        case 2:
          cmd += '022397B9';
          break;
        case 3:
          cmd += '03239629';
          break;
        case 4:
          cmd += '04239419';
          break;
        case 5:
          cmd += '05239589';
          break;
        case 6:
          cmd += '06239579';
          break;
        case 7:
          cmd += '072394E9';
          break;
        case 8:
          cmd += '08239119';
          break;
        case 9:
          cmd += '09239089';
          break;
        case 10:
          cmd += 'A0239079';
          break;
      }
      util.sendBlueCmd(this.data.connected, cmd)
    },


  }
})