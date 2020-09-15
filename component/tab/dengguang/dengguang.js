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
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached");
      this.setData({
        display:app.globalData.display
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("detached");
      var that = this;
      WxNotificationCenter.removeNotification("INIT", that);
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
      //WxNotificationCenter.removeNotification("INIT",that);
    },


    /**
     * 发送蓝牙命令
     */
    sendBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, sendPrefix + cmd, options);
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
    }


  }
})