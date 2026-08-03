// pages/anmo/anmo.js
const app = getApp();
const util = require('../../../../utils/util')
const configManager = require('../../../../utils/configManager')
const WxNotificationCenter = require('../../../../utils/WxNotificationCenter')
const crcUtil = require('../../../../utils/crcUtil');
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const toubuReplyPrefix = 'FFFFFFFF05000001';
const tuibuReplyPrefix = 'FFFFFFFF05000002';
const anmopinglvReplyPrefix = 'FFFFFFFF05000003';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: app.globalData.skin, //当前皮肤样式
    display: app.globalData.display,
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
    currentTimeSelected: '',
    anmopinglv: 0, // 0,1,2,3,4
    toubu: 0, //0,1,2,3
    tuibu: 0, //0,1,2,3
    tongbukzShow: false, // 同步控制显示
    tongbukzStatus: false, // 同步控制状态
    startTime: '',
    endTime: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let connected = configManager.getCurrentConnected();
    this.setData({
      connected:connected
    })
    this.notifyBLECharacteristicValueChange();
  },

  show: function () {
    // 设置当前的皮肤样式
    this.setData({
      skin: app.globalData.skin
    })
  },

  /**
     * 发送蓝牙命令
     */
  sendBlueCmd(cmd, options) {
    var connected = this.data.connected;
    util.sendBlueCmd(connected, sendPrefix + cmd, options);
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

  /**
   * 蓝牙回复回调
   * @param {*} cmd 
   */
  blueReply(cmd) {
    var that = this;
    console.error('anmo->blueReply', cmd);
    cmd = cmd.toUpperCase();
    if (cmd.indexOf('FFFFFFFF01000A0B') >= 0 || cmd.indexOf('FFFFFFFF0100090B') >= 0) {
      // 同步控制回码
      let tongbukzStatus = cmd.substr(16, 2) == '01' ? true : false;
      that.setData({
        tongbukzShow: true,
        tongbukzStatus: tongbukzStatus
      })
      let connected = that.data.connected;
      configManager.putTongbukzShow(true, connected.deviceId);
      configManager.putTongbukzSwitch(tongbukzStatus, connected.deviceId);
      return;
    }


    var prefix = cmd.substr(0, 16).toUpperCase();
    var status = cmd.substr(16, 6).toUpperCase();

    if (prefix == toubuReplyPrefix) {
      console.info('anmo->头部 blueReply', cmd, prefix, status);
      // 头部
      if (status == '00D690') {
        that.setData({
          toubu: 0
        })
      } else if (status == '1E5698') {
        that.setData({
          toubu: 1
        })
      } else if (status == '1F9758') {
        that.setData({
          toubu: 2
        })
      } else if (status == '20D748') {
        that.setData({
          toubu: 3
        })
      }
    } else if (prefix == tuibuReplyPrefix) {
      console.info('anmo->腿部 blueReply', cmd, prefix, status);
      // 腿部
      if (status == '00D660') {
        that.setData({
          tuibu: 0
        })
      } else if (status == '211678') {
        that.setData({
          tuibu: 1
        })
      } else if (status == '225679') {
        that.setData({
          tuibu: 2
        })
      } else if (status == '2397B9') {
        that.setData({
          tuibu: 3
        })
      }

    } else if (prefix == anmopinglvReplyPrefix) {
      console.info('anmo->按摩频率 blueReply', cmd, prefix, status);
      // 按摩频率
      if (status == '24D7EB') {
        that.setData({
          anmopinglv: 1
        })
      } else if (status == '25162B') {
        that.setData({
          anmopinglv: 2
        })
      } else if (status == '26562A') {
        that.setData({
          anmopinglv: 3
        })
      } else if (status == '2797EA') {
        that.setData({
          anmopinglv: 4
        })
      }

    }
  },

  /*****************点击事件 */

  /**
   * 同步控制的点击事件
   */
  tongbukzTab() {
    var tongbukzStatus = this.data.tongbukzStatus;
    let cmd;
    if (tongbukzStatus) {
      cmd = 'FFFFFFFF0100090B00';
    } else {
      cmd = 'FFFFFFFF0100090B01';
    }
    cmd = cmd + crcUtil.HexToCSU16(cmd);
    this.sendFullBlueCmd(cmd);
  },

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
        anmopinglv: 0,
        toubu: 0,
        tuibu: 0,
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
    if (type == 'anmopinglv') {
      cmd = '001516CF';
    } else if (type == 'toubu') {
      cmd = '0011170C';
    } else if (type = 'tuibu') {
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
    if (type == 'anmopinglv') {
      cmd = '0014D70F';
    } else if (type == 'toubu') {
      cmd = '0010D6CC';
    } else if (type = 'tuibu') {
      cmd = '0012570D';
    }
    this.sendBlueCmd(cmd);
  },



  //长按按摩频率
  tapLongAnmo: function () {
    var longClick = this.longClick();
    if (longClick) {
      var jumpPath = 'pages/index/index?mac=' + app.globalData.mac + '&type=1D';
      wx.navigateToMiniProgram({
        appId: app.globalData.appId,
        path: jumpPath,
        envVersion: 'trial', //develop,trial,release
      })
    }
  },

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
    console.info('main->onBLECharacteristicValueChange', res);
    var buffer = res.value;
    var received = util.ab2hex(buffer);
    console.info('main->onBLECharacteristicValueChange-->received', received);
    that.blueReply(received, connected);
  });
},


})