// component/kuaijie/kuaijie-K2.js
const util = require('../../../utils/util')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const app = getApp();
const askPrefix = 'FFFFFFFF0300'; // 询问码前缀
const askReply1Prefix = 'FFFFFFFF031200'; // 询问码1回复前缀
const askReply2Prefix = 'FFFFFFFF030600'; // 询问码2回复前缀
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
    connected: {},
    currentAnjian: {
      anjian: 'kandianshi', // kandianshi,lingyali,zhihan,fuyuan
      name: '看电视' // 看电视，零压力，止鼾，复原，
    },
    askType: '1', // 记忆类型 记忆1，记忆2
    jiyi1: false,
    jiyi2: false,
    kandianshi: false,
    lingyali: false,
    zhihan: false,
    startTime: '',
    endTime: ''
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
      console.info("kuaijie-k2-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("kuaijie-k2-->ready");
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
      console.info("kuaijie-k2-->detached");
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
      console.info('kuaijie-K2->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      WxNotificationCenter.removeNotification("INIT",that);
      that.askJiyiStatus(connected, that);
    },

    /**
     * 询问记忆状态
     */
    askJiyiStatus(connected, cur) {
      var name = connected.name;
      if (name.indexOf('QMS-MQ') >= 0 || name.indexOf('QMS2') >= 0 || name.indexOf('S3-2')) {
        cur.setData({
          askType: '2'
        })
        // 记忆1
        var jiyi1 = '2800039F09';
        // 记忆2
        var jiyi2 = '3000031F0E';
        // 看电视
        var kandianshi = '1800039F06';
        // 零压力
        var lingyali = '2000031ECB';
        // 止鼾
        var zhihan = '3800039ECC';
        setTimeout(() => {
          cur.sendAskBlueCmd(jiyi1)
        }, 100);
        setTimeout(() => {
          this.sendAskBlueCmd(jiyi2)
        }, 200);
        setTimeout(() => {
          this.sendAskBlueCmd(kandianshi)
        }, 300);
        setTimeout(() => {
          this.sendAskBlueCmd(lingyali)
        }, 400);
        setTimeout(() => {
          this.sendAskBlueCmd(zhihan)
        }, 500);
      } else {
        cur.setData({
          askType: '1'
        })
        // 记忆1
        var jiyi1 = '2800091F0E';
        // 记忆2
        var jiyi2 = '310009CEC9';
        // 看电视
        var kandianshi = '1600097EC2';
        // 零压力
        var lingyali = '1F0009AEC0';
        // 止鼾
        var zhihan = '3A0009BF0B';
        setTimeout(() => {
          cur.sendAskBlueCmd(jiyi1)
        }, 100);
        setTimeout(() => {
          this.sendAskBlueCmd(jiyi2)
        }, 200);
        setTimeout(() => {
          this.sendAskBlueCmd(kandianshi)
        }, 300);
        setTimeout(() => {
          this.sendAskBlueCmd(lingyali)
        }, 400);
        setTimeout(() => {
          this.sendAskBlueCmd(zhihan)
        }, 500);
      }

    },


  

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      var prefix = cmd.substr(0, 14).toUpperCase();
      console.info('kuaijie-k2->askBack', cmd, prefix);
      var askType = that.data.askType;
      if (askType == '1') {
        if (prefix == askReply1Prefix) {
          var status = cmd.substr(14, 2).toUpperCase();
          if ('AA' == status) {
            that.setData({
              jiyi1: true
            })
          }
          if ('AB' == status) {
            that.setData({
              jiyi2: true
            })
          }
          if ('A5' == status) {
            that.setData({
              kandianshi: true
            })
          }
          if ('A9' == status) {
            that.setData({
              lingyali: true
            })
          }
          if ('AF' == status) {
            that.setData({
              zhihan: true
            })
          }
        }
      } else {
        if (prefix == askReply2Prefix) {
          var status = cmd.substr(14, 2).toUpperCase();
          if ('0A' == status) {
            that.setData({
              jiyi1: true
            })
          }
          if ('0B' == status) {
            that.setData({
              jiyi2: true
            })
          }
          if ('05' == status) {
            that.setData({
              kandianshi: true
            })
          }
          if ('09' == status) {
            that.setData({
              lingyali: true
            })
          }
          if ('0F' == status) {
            that.setData({
              zhihan: true
            })
          }
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
     * 记忆1的点击事件
     */
    tapJiyi1() {
      console.info("tapJiyi1");
      var that = this;
      var longClick = this.longClick();
      var jiyi1Status = this.data.jiyi1;
      if (!jiyi1Status) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('A00A2F07', ({
            success: (res) => {
              console.info('tapJiyi1->发送成功');
              that.setData({
                jiyi1: true
              });
            },
            fail: (res) => {
              console.error('tapJiyi1->发送失败', res);
            }
          }));
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('AF0A2AF7', ({
            success: (res) => {
              console.info('tapJiyi1->发送成功');
              that.setData({
                jiyi1: false
              });
            },
            fail: (res) => {
              console.error('tapJiyi1->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('A10A2E97');
        }
      }
    },



    /**
     * 记忆2的点击事件
     */
    tapJiyi2() {
      console.info("tapJiyi2");
      var that = this;
      var longClick = this.longClick();
      var jiyi2Status = this.data.jiyi2;
      if (!jiyi2Status) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('B00BE307', ({
            success: (res) => {
              console.info('tapJiyi2->发送成功');
              that.setData({
                jiyi2: true
              });
            },
            fail: (res) => {
              console.error('tapJiyi2->发送失败', res);
            }
          }));
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('BF0BE6F7', ({
            success: (res) => {
              console.info('tapJiyi2->发送成功');
              that.setData({
                jiyi2: false
              });
            },
            fail: (res) => {
              console.error('tapJiyi2->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('B10BE297');
        }
      }
    },


    /**
     * 看电视的点击事件
     */
    tapKandianshi() {
      console.info("tapKandianshi");
      this.setData({
        currentAnjian: {
          anjian: 'kandianshi',
          name: '看电视'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var kandianshiStatus = this.data.kandianshi;
      if (!kandianshiStatus) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('50052B03', ({
            success: (res) => {
              console.info('kandianshi->发送成功');
              that.setData({
                kandianshi: true
              });
            },
            fail: (res) => {
              console.error('kandianshi->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('00051703');
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('5F052EF3', ({
            success: (res) => {
              console.info('kandianshi->发送成功');
              that.setData({
                kandianshi: false
              });
            },
            fail: (res) => {
              console.error('kandianshi->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('51052A93');
        }
      }
    },


    /**
     * 零压力的点击事件
     */
    tapLingyali() {
      console.info("tapLingyali");
      this.setData({
        currentAnjian: {
          anjian: 'lingyali',
          name: '零压力'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var lingyaliStatus = this.data.lingyali;
      if (!lingyaliStatus) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('90097B06', ({
            success: (res) => {
              console.info('tapLingyali->发送成功');
              that.setData({
                lingyali: true
              });
            },
            fail: (res) => {
              console.error('tapLingyali->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('00091706');
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('9F097EF6', ({
            success: (res) => {
              console.info('tapLingyali->发送成功');
              that.setData({
                lingyali: false
              });
            },
            fail: (res) => {
              console.error('tapLingyali->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('91097A96');
        }
      }
    },

    /**
     * 止鼾的点击事件
     */
    tapZhihan() {
      console.info("tapZhihan");
      this.setData({
        currentAnjian: {
          anjian: 'zhihan',
          name: '止鼾'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var zhihanStatus = this.data.zhihan;
      if (!zhihanStatus) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('F00FD304', ({
            success: (res) => {
              console.info('tapZhihan->发送成功');
              that.setData({
                zhihan: true
              });
            },
            fail: (res) => {
              console.error('tapZhihan->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('000F9704');
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('FF0FD6F4', ({
            success: (res) => {
              console.info('tapZhihan->发送成功');
              that.setData({
                zhihan: false
              });
            },
            fail: (res) => {
              console.error('tapZhihan->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('F10FD294');
        }
      }
    },


    /**
     * 复原的点击事件
     */
    tapFuyuan() {
      console.info("tapFuyuan");
      this.setData({
        currentAnjian: {
          anjian: 'fuyuan',
          name: '复原'
        }
      })
      // 单击
      this.sendBlueCmd('0008D6C6');
    },


  },

})