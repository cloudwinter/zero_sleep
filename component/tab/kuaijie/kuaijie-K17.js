// component/tab/kuaijie/kuaijie-K17.js
const util = require('../../../utils/util')
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
const app = getApp();
const askPrefix = 'FFFFFFFF0300'; // 询问码前缀
const askReply1Prefix = 'FFFFFFFF031200'; // 询问码1回复前缀
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
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
    currentAnjian: {
      anjian: 'zhumian', // zhumian,lingyali,zhihan,tingyinyue,fuyuan,tuibufangsong
      name: '助眠' // 
    },
    startTime: '',
    endTime: '',
    guanying: false,//观影
    lashencxing: false,//拉伸C型
    xiuqisxing: false,//休憩S型
    lingyayxing: false,//零压Y型
    childLock: false,//童锁显示
    childLockSwitch: false,//童锁状态
  },

  /**
   * 页面的生命周期
   */
  pageLifetimes: {
    show: function () {
      console.info("kuaijie-K17-->show");
      var childLock = configManager.getChildLockStatus(this.data.connected.deviceId)
      var childLockSwitch = configManager.getChildLockSwitch(this.data.connected.deviceId)
      // 设置当前的皮肤样式
      this.setData({
        skin: 'blue',//app.globalData.skin
        childLock: childLock,
        childLockSwitch: childLockSwitch,
      })
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("kuaijie-K17-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("kuaijie-K17-->ready");
      var that = this;
      var childLock = configManager.getChildLockStatus(that.data.connected.deviceId)
      var childLockSwitch = configManager.getChildLockSwitch(that.data.connected.deviceId)

      that.setData({
        childLock: childLock,
        childLockSwitch: childLockSwitch
      })
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached" + app.globalData.screenHeight + "-" + app.globalData.navHeight);
      this.setData({
        display: app.globalData.display,
        // 屏幕高度-顶部高度-tab高度-预留5px底部距离
        containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 62
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("kuaijie-K17-->detached");
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
      console.info('kuaijie-K17->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
      that.askJiyiStatus(connected, that);
    },

    /**
    * 询问记忆状态
    */
    askJiyiStatus(connected, cur) {
      // 记忆1
      var lashencxing = '2800091F0E';
      // 记忆2
      var xiuqisxing = '310009CEC9';
      // 看电视
      var guanying = '1600097EC2';
      // 零压力
      var lingyayxing = '1F0009AEC0';
      setTimeout(() => {
        cur.sendAskBlueCmd(lashencxing)
        setTimeout(() => {
          cur.sendAskBlueCmd(xiuqisxing)
          setTimeout(() => {
            cur.sendAskBlueCmd(guanying)
            setTimeout(() => {
              cur.sendAskBlueCmd(lingyayxing)
              setTimeout(() => {
                cur.sendFullBlueCmd('FFFFFFFF0500000F0CD2F5');//查询童锁的状态
              }, 500)
            }, 400);
          }, 300);
        }, 200);
      }, 100);
    },


    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      cmd = cmd.toUpperCase();
      var prefix = cmd.substr(0, 14).toUpperCase();
      console.info('kuaijie-K17->askBack', cmd, prefix);
      if (prefix == askReply1Prefix) {
        var status = cmd.substr(14, 2).toUpperCase();
        if ('AA' == status) {
          that.setData({
            lashencxing: true
          })
        }
        if ('AB' == status) {
          that.setData({
            xiuqisxing: true
          })
        }
        if ('A5' == status) {
          that.setData({
            guanying: true
          })
        }
        if ('A9' == status) {
          that.setData({
            lingyayxing: true
          })
        }
      } else if (cmd.indexOf('FFFFFFFF0500050A0CC1A4') >= 0) {//回复关锁成功
        configManager.putChildLockSwitch(false, that.data.connected.deviceId)
        that.setData({
          childLockSwitch: false
        })
      } else if (cmd.indexOf('FFFFFFFF050005000CC704') >= 0) {//回复开锁成功
        configManager.putChildLockSwitch(true, that.data.connected.deviceId)
        that.setData({
          childLockSwitch: true
        })
      } else if (cmd.indexOf('FFFFFFFF0500000C0CD205') >= 0) {//童锁状态
        configManager.putChildLockStatus(true, that.data.connected.deviceId)//有童锁
        configManager.putChildLockSwitch(true, that.data.connected.deviceId)//童锁开启状态

        that.setData({
          childLock: true,
          childLockSwitch: true
        })
      } else if (cmd.indexOf('FFFFFFFF0500000A0CD1A5') >= 0) {//非童锁状态
        console.log(that.data.connected.deviceId,"设置童锁")
        configManager.putChildLockStatus(true, that.data.connected.deviceId)//有童锁
        configManager.putChildLockSwitch(false, that.data.connected.deviceId)//童锁关闭状态
        that.setData({
          childLock: true,
          childLockSwitch: false
        })
      }
    },

    /**
 * 发送询问记忆状态命令
 * @param {}} cmd 
 */
    sendAskBlueCmd(cmd) {
      console.error('K17 -> sendAskBlueCmd ', cmd, new Date().getTime());
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
     * 发送完整的蓝牙命令
     * @param {} cmd 
     * @param {*} options 
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
      console.log("点击了");
      return false;
    },

    /**
     * 助眠的点击事件
     */
    tapZhumian() {
      console.info("tapZhumian");
      this.setData({
        currentAnjian: {
          anjian: 'zhumian',
          name: '助眠'
        }
      })
      // 单击
      this.sendBlueCmd('006A572F');
    },

    /**
     * 放平的点击事件
     */
    tapFangping() {
      console.info("tapFangping");
      this.setData({
        currentAnjian: {
          anjian: 'fangping',
          name: '放平'
        }
      })
      // 单击
      this.sendBlueCmd('0008D6C6');
    },

    /**
     * 醉酒的点击事件
     */
    tapZuijiu() {
      console.info("tapZuijiu");
      this.setData({
        currentAnjian: {
          anjian: 'zuijiu',
          name: '醉酒'
        }
      })
      // 单击
      this.sendBlueCmd('02739785');
    },

    /**
     * 哺乳的点击事件
     */
    tapBuru() {
      console.info("tapBuru");
      this.setData({
        currentAnjian: {
          anjian: 'buru',
          name: '哺乳'
        }
      })
      // 单击
      this.sendBlueCmd('03739615');
    },

    /**
     * 观影的点击事件
     */
    tapGuanying() {
      console.info("tapGuanying");
      this.setData({
        currentAnjian: {
          anjian: 'guanying',
          name: '观影'
        }
      })

      var that = this;
      var longClick = this.longClick();
      var guanying = this.data.guanying;
      if (!guanying) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('50052B03', ({
            success: (res) => {
              console.info('guanying->发送成功');
              that.setData({
                guanying: true
              });
            },
            fail: (res) => {
              console.error('guanying->发送失败', res);
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
              console.info('guanying->发送成功');
              that.setData({
                guanying: false
              });
            },
            fail: (res) => {
              console.error('guanying->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('51052A93');
        }
      }
    },

    /**
    * 开肩式的点击事件
    */
    tapKaijianshi() {
      console.info("tapKaijianshi");
      this.setData({
        currentAnjian: {
          anjian: 'kaijianshi',
          name: '开肩式'
        }
      })
      // 单击
      this.sendBlueCmd('08739125');
    },

    /**
    * 顶腰瑜伽的点击事件
    */
    tapDingyaoyj() {
      console.info("tapDingyaoyj");
      this.setData({
        currentAnjian: {
          anjian: 'dingyaoyujia',
          name: '顶腰瑜伽'
        }
      })
      // 单击
      this.sendBlueCmd('014E56A4');
    },

    /**
    * 飞燕瑜伽的点击事件
    */
    tapFeiyanyj() {
      console.info("tapFeiyanyj");
      this.setData({
        currentAnjian: {
          anjian: 'feiyanyujia',
          name: '飞燕瑜伽'
        }
      })
      // 单击
      this.sendBlueCmd('024E5654');
    },

    /**
    * 拉伸C型的点击事件
    */
    tapLashencxing() {
      console.info("tapLashencxing");
      this.setData({
        currentAnjian: {
          anjian: 'lashencxing',
          name: '拉伸C型'
        }
      })

      var that = this;
      var longClick = this.longClick();
      var lashencxing = this.data.lashencxing;
      if (!lashencxing) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('A00A2F07', ({
            success: (res) => {
              console.info('lashencxing->发送成功');
              that.setData({
                lashencxing: true
              });
            },
            fail: (res) => {
              console.error('lashencxing->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('000A5707');
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('AF0A2AF7', ({
            success: (res) => {
              console.info('lashencxing->发送成功');
              that.setData({
                lashencxing: false
              });
            },
            fail: (res) => {
              console.error('lashencxing->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('A10A2E97');
        }
      }
    },

    /**
    * 躺椅L型的点击事件
    */
    tapTangyilxing() {
      console.info("tapTangyilxing");
      this.setData({
        currentAnjian: {
          anjian: 'tangyilxing',
          name: '躺椅L型'
        }
      })
      // 单击
      this.sendBlueCmd('0048D736');
    },

    /**
    * 休憩S型的点击事件
    */
    tapXiuqisxing() {
      console.info("tapXiuqisxing");
      this.setData({
        currentAnjian: {
          anjian: 'xiuqisxing',
          name: '休憩S型'
        }
      })

      var that = this;
      var longClick = this.longClick();
      var xiuqisxing = this.data.xiuqisxing;
      if (!xiuqisxing) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('B00BE307', ({
            success: (res) => {
              console.info('xiuqisxing->发送成功');
              that.setData({
                xiuqisxing: true
              });
            },
            fail: (res) => {
              console.error('xiuqisxing->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('000B96C7');
        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('BF0BE6F7', ({
            success: (res) => {
              console.info('xiuqisxing->发送成功');
              that.setData({
                xiuqisxing: false
              });
            },
            fail: (res) => {
              console.error('xiuqisxing->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('B10BE297');
        }
      }
    },

    /**
    * 女王U型的点击事件
    */
    tapNvwanguxing() {
      console.info("tapNvwanguxing");
      this.setData({
        currentAnjian: {
          anjian: 'nvwanguxing',
          name: '女王U型'
        }
      })
      // 单击
      this.sendBlueCmd('0D739275');
    },

    /**
    * 零压Y型的点击事件
    */
    tapLingyayxing() {
      console.info("tapLingyayxing");
      this.setData({
        currentAnjian: {
          anjian: 'lingyayxing',
          name: '零压Y型'
        }
      })

      var that = this;
      var longClick = this.longClick();
      var lingyayxing = this.data.lingyayxing;
      if (!lingyayxing) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('90097B06', ({
            success: (res) => {
              console.info('lingyayxing->发送成功');
              that.setData({
                lingyayxing: true
              });
            },
            fail: (res) => {
              console.error('lingyayxing->发送失败', res);
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
              console.info('lingyayxing->发送成功');
              that.setData({
                lingyayxing: false
              });
            },
            fail: (res) => {
              console.error('lingyayxing->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('91097A96');
        }
      }
    },

    /**
    * 卷腹V型的点击事件
    */
    tapJuanfuvxing() {
      console.info("tapJuanfuvxing");
      this.setData({
        currentAnjian: {
          anjian: 'juanfuvxing',
          name: '卷腹V型'
        }
      })
      // 单击
      this.sendBlueCmd('000F9704');
    },

    /**
     * 童锁开启关闭
     */
    childLockTap() {
      var childLockSwitch = this.data.childLockSwitch
      var cmd
      if (childLockSwitch) {//关锁
        cmd = 'FFFFFFFF0500000A0CD1A5'
      } else {//开锁
        cmd = 'FFFFFFFF0500000C0CD205'
      }
      this.sendFullBlueCmd(cmd);
    },

  }
})