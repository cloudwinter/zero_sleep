// component/anmo/anmo.js
const app = getApp();
const util = require('../../../utils/util')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const toubuReplyPrefix = 'FFFFFFFF05000001';
const tuibuReplyPrefix = 'FFFFFFFF05000002';
const anmopinglvReplyPrefix = 'FFFFFFFF05000003';



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
    display:app.globalData.display,
    connected: {},
    currentTimeSelected: '',
    anmopinglv: 0, // 0,1,2,3,4
    toubu: 0, //0,1,2,3
    tuibu: 0, //0,1,2,3
  },

  /**
   * 页面的生命周期
   */
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
      console.info("anmo-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
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
      console.info('anmo->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      //WxNotificationCenter.removeNotification("INIT", that);
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
      var prefix = cmd.substr(0, 16).toUpperCase();
      var status = cmd.substr(16, 6).toUpperCase();

      if (prefix == toubuReplyPrefix) {
        console.info('anmo->头部 blueReply', cmd,prefix,status);
        // 头部
        if (status == '00D690') {
          that.setData({toubu:0})
        } else if (status == '1E5698') {
          that.setData({toubu:1})
        } else if (status == '1F9758') {
          that.setData({toubu:2})
        } else if (status == '20D748') {
          that.setData({toubu:3})
        }
      } else if (prefix == tuibuReplyPrefix) {
        console.info('anmo->腿部 blueReply', cmd,prefix,status);
        // 腿部
        if (status == '00D660') {
          that.setData({tuibu:0})
        } else if (status == '211678') {
          that.setData({tuibu:1})
        } else if (status == '225679') {
          that.setData({tuibu:2})
        } else if (status == '2397B9') {
          that.setData({tuibu:3})
        }

      } else if (prefix == anmopinglvReplyPrefix) {
        console.info('anmo->按摩频率 blueReply', cmd,prefix,status);
        // 按摩频率
        if (status == '24D7EB') {
          that.setData({anmopinglv:1})
        } else if (status == '25162B') {
          that.setData({anmopinglv:2})
        } else if (status == '26562A') {
          that.setData({anmopinglv:3})
        } else if (status == '2797EA') {
          that.setData({anmopinglv:4})
        }

      }
    },

    /*****************点击事件 */

    /**
     * 事件点击事件
     * @param {*} e 
     */
    timeClick(e) {
      var that = this;
      var currentTimeSelected = this.data.currentTimeSelected;
      var time = e.currentTarget.dataset.time;
      console.info('timeClick->' + time);

      var cmd = '';
      if (time == currentTimeSelected) {
        // 恢复指令
        cmd = '001CD6C9';
        that.setData({
          anmopinglv:0,
          toubu:0,
          tuibu:0,
        })
      } else {
        if (time == '10min') {
          cmd = '001656CE';
        } else if (time == '20min') {
          cmd = '0017970E';
        } else if (time == '30min') {
          cmd = '0018D70A';
        }
      }
      this.sendBlueCmd(cmd, ({
        success: (res) => {
          if (time == currentTimeSelected) {
            that.setData({
              currentTimeSelected: ''
            })
          } else {
            that.setData({
              currentTimeSelected: time
            })
          }
        },
        fail: (res) => {

        }
      }))
    },


    /**
     * 减法单击
     * @param {}} e 
     */
    tapMinus(e) {
      var type = e.currentTarget.dataset.type;
      var cmd = ''
      if(type == 'anmopinglv') {
        cmd = '001516CF';
      } else if(type == 'toubu') {
        cmd = '0011170C';
      } else if(type = 'tuibu') {
        cmd = '001396CD';
      }
      this.sendBlueCmd(cmd);
    },

    /**
     * 加法单击
     * @param {*} e 
     */
    tapPlus(e) {
      var type = e.currentTarget.dataset.type;
      var cmd = ''
      if(type == 'anmopinglv') {
        cmd = '0014D70F';
      } else if(type == 'toubu') {
        cmd = '0010D6CC';
      } else if(type = 'tuibu') {
        cmd = '0012570D';
      }
      this.sendBlueCmd(cmd);
    },


  }
})