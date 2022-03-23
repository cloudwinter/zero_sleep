// component/kuaijie/kuaijie-K4.js
const util = require('../../../utils/util')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
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
    currentAnjian: {
      anjian: 'kandianshi', // kandianshi,lingyali,dingyao,fuyuan
      name: '看电视' // 看电视，零压力，顶腰，复原，
    },
    currentType: 'fenti', //fenti/tongbu
    xunhuanShow: true,
    timeXHSwitch: false,
    kandianshiLeft: false,
    kandianshiRight: false,
    lingyaliLeft: false,
    lingyaliRight: false,
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
      console.info("kuaijie-k4-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("kuaijie-k4-->ready");
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached");
      // 在组件实例进入页面节点树时执行
      console.info("attached" + app.globalData.screenHeight + "-" + app.globalData.navHeight);
      this.setData({
        display: app.globalData.display,
        // 屏幕高度-顶部高度-tab高度-预留5px底部距离
        containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 52 - 5
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("kuaijie-k4-->detached");
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
      console.info('kuaijie-K4->initConnected:', connected, this.observer);
      let xunhuanShow = false;
      if (connected.name.indexOf('S4-HL') >= 0) {
        xunhuanShow = true;
      }
      that.setData({
        connected: connected,
        xunhuanShow: xunhuanShow
      })
      WxNotificationCenter.removeNotification("INIT", that);
      that.askJiyiStatus(connected, that);
    },

    /**
     * 询问记忆状态
     */
    askJiyiStatus(connected, cur) {
      // 看电视左
      setTimeout(() => {
        cur.sendAskBlueCmd('640009DED9')
      }, 200);

      // 看电视右
      setTimeout(() => {
        cur.sendAskBlueCmd('6D00090EDB')
      }, 400);

      // 零压力左
      setTimeout(() => {
        cur.sendAskBlueCmd('7600097EDC')
      }, 600);

      // 零压力右
      setTimeout(() => {
        cur.sendAskBlueCmd('7F0009AEDE')
      }, 800);

    },

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      var prefix = cmd.substr(0, 14).toUpperCase();
      console.info('kuaijie-k4->askBack', cmd, prefix);
      if (prefix == askReplyPrefix) {
        var status = cmd.substr(14, 2).toUpperCase();
        if ('31' == status) {
          that.setData({
            kandianshiLeft: true
          })
        }
        if ('32' == status) {
          that.setData({
            kandianshiRight: true
          })
        }
        if ('33' == status) {
          that.setData({
            lingyaliLeft: true
          })
        }
        if ('34' == status) {
          that.setData({
            lingyaliRight: true
          })
        }
      }
    },

    /**
     * 发送询问记忆状态命令
     * @param {}} cmd 
     */
    sendAskBlueCmd(cmd) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, askPrefix + cmd);
    },

    /**
     * 发送蓝牙命令
     */
    sendBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, sendPrefix + cmd, options);
    },


    /**
     * 发送蓝牙命令
     */
    sendFullBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, cmd, options);
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



    /**
     * 空白处的点击事件
     */
    tapBlank(e) {
      console.info('tapBlank', e);
      this.sendBlueCmd('0000D700');
    },



    /**
     * 长按切换分体和同步
     */
    tapChannelType() {
      console.info("tapJiyi1");
      var that = this;
      var longClick = this.longClick();
      var currentType = this.data.currentType;
      if (longClick) {
        // 长按
        that.setData({
          currentType: currentType == 'fenti' ? 'tongbu' : 'fenti'
        })
      }
    },



    /**
     * 看电视左的点击事件
     */
    tapKandianshiLeft() {
      console.info("tapKandianshiLeft");
      this.setData({
        currentAnjian: {
          anjian: 'kandianshi',
          name: '看电视'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var kandianshiLeft = this.data.kandianshiLeft;
      if (!kandianshiLeft) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('10311B14', ({
            success: (res) => {
              console.info('tapKandianshiLeft->发送成功');
              that.setData({
                kandianshiLeft: true
              });
            },
            fail: (res) => {
              console.error('tapKandianshiLeft->发送失败', res);
            }
          }));
        } else {
          this.sendBlueCmd('003116D4')
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('1F311EE4', ({
            success: (res) => {
              console.info('tapKandianshiLeft->发送成功');
              that.setData({
                kandianshiLeft: false
              });
            },
            fail: (res) => {
              console.error('tapKandianshiLeft->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('11311A84');
        }
      }
    },


    /**
     * 看电视右的点击事件
     */
    tapKandianshiRight() {
      console.info("tapKandianshiRight");
      this.setData({
        currentAnjian: {
          anjian: 'kandianshi',
          name: '看电视'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var kandianshiRight = this.data.kandianshiRight;
      if (!kandianshiRight) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('20324F15', ({
            success: (res) => {
              console.info('kandianshiRight->发送成功');
              that.setData({
                kandianshiRight: true
              });
            },
            fail: (res) => {
              console.error('kandianshiRight->发送失败', res);
            }
          }));
        } else {
          this.sendBlueCmd('003256D5')
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('2F324AE5', ({
            success: (res) => {
              console.info('kandianshiRight->发送成功');
              that.setData({
                kandianshiRight: false
              });
            },
            fail: (res) => {
              console.error('kandianshiRight->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('21324E85');
        }
      }
    },

    /**
     * 零压力左的点击事件
     */
    tapLingyaliLeft() {
      console.info("tapLingyaliLeft");
      this.setData({
        currentAnjian: {
          anjian: 'lingyali',
          name: '零压力'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var lingyaliLeft = this.data.lingyaliLeft;
      if (!lingyaliLeft) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('30338315', ({
            success: (res) => {
              console.info('lingyaliLeft->发送成功');
              that.setData({
                lingyaliLeft: true
              });
            },
            fail: (res) => {
              console.error('lingyaliLeft->发送失败', res);
            }
          }));
        } else {
          this.sendBlueCmd('00339715')
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('3F3386E5', ({
            success: (res) => {
              console.info('lingyaliLeft->发送成功');
              that.setData({
                lingyaliLeft: false
              });
            },
            fail: (res) => {
              console.error('lingyaliLeft->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('31338285');
        }
      }
    },


    /**
     * 零压力右的点击事件
     */
    tapLingyaliRight() {
      console.info("tapLingyaliRight");
      this.setData({
        currentAnjian: {
          anjian: 'lingyali',
          name: '零压力'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var lingyaliRight = this.data.lingyaliRight;
      if (!lingyaliRight) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('4034E717', ({
            success: (res) => {
              console.info('lingyaliRight->发送成功');
              that.setData({
                lingyaliRight: true
              });
            },
            fail: (res) => {
              console.error('lingyaliRight->发送失败', res);
            }
          }));
        } else {
          this.sendBlueCmd('0034D6D7')
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('4F34E2E7', ({
            success: (res) => {
              console.info('lingyaliRight->发送成功');
              that.setData({
                lingyaliRight: false
              });
            },
            fail: (res) => {
              console.error('lingyaliRight->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('4134E687');
        }
      }
    },







    /**
     * 顶腰的点击事件
     */
    tapFuyuanLeft() {
      console.info("tapFuyuanLeft");
      this.setData({
        currentAnjian: {
          anjian: 'fuyuan',
          name: '复原'
        }
      })
      // 单击
      this.sendBlueCmd('00391712');
    },


    /**
     * 复原的点击事件
     */
    tapFuyuanRight() {
      console.info("tapFuyuanRight");
      this.setData({
        currentAnjian: {
          anjian: 'fuyuan',
          name: '复原'
        }
      })
      // 单击
      this.sendBlueCmd('003A5713');
    },


    /**
     * 同步点击事件
     * @param {*} e 
     */
    tapTB(e) {
      console.info('tabTB', e);
      var that = this;
      var anjian = e.currentTarget.dataset.anjian
      var name = e.currentTarget.dataset.name
      console.info('tapTB', anjian, name)
      this.setData({
        currentAnjian: {
          anjian: anjian,
          name: name
        }
      })
      var cmd = '';
      if (anjian == 'kandianshi') {
        cmd = '003CD711';
      } else if (anjian == 'lingyali') {
        cmd = '003D16D1';
      } else if (anjian == 'fuyuan') {
        cmd = '003B96D3';
      }
      if (cmd) {
        this.sendBlueCmd(cmd);
      }
    },



    tapBbXH(e) {
      this.sendFullBlueCmd('FFFFFFFF05000500E7874B');
    },

    tapTbXH(e) {
      this.sendFullBlueCmd('FFFFFFFF05000500E5068A');
    },

    tapBtXH(e) {
      this.sendFullBlueCmd('FFFFFFFF05000500E8C74F');
    },

    tapTimeXH(e) {
      let timeXHSwitch = this.data.timeXHSwitch;
      let cmd = 'FFFFFFFF0100070B';
      if (timeXHSwitch) {
        cmd = cmd + '00';
      } else {
        cmd = cmd + '01';
      }
      let cmdCrc = crcUtil.HexToCSU16(cmd);
      cmd = cmd + cmdCrc;
      this.sendFullBlueCmd(cmd);
      this.setData({
        timeXHSwitch: !timeXHSwitch
      })
    }


    // ***********此处是方法结束处
  },



})