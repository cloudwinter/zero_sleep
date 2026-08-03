// component/kuaijie/kuaijie-K5.js

const util = require('../../../../utils/util')
const configManager = require('../../../../utils/configManager')
const WxNotificationCenter = require('../../../../utils/WxNotificationCenter')
const app = getApp();
const askPrefix = 'FFFFFFFF0300'; // 询问码前缀
const askReplyPrefix = 'FFFFFFFF031200'; // 询问码回复前缀
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
      anjian: 'kandianshi', // kandianshi,jiyi,fuyuan
      name: '看电视' // 看电视，记忆，复原，
    },
    currentType: 'fenti',
    kandianshiLeft: false,
    kandianshiRight: false,
    jiyiLeft: false,
    jiyiRight: false,
    tongbukzShow: false, // 同步控制显示
    tongbukzStatus: false, // 同步控制状态
    childLock: false,//童锁显示
    childLockSwitch: false,//童锁状态
  },


  /**
   * 页面的生命周期
   */
  pageLifetimes: {
    show: function () {
      var childLock = configManager.getChildLockStatus(this.data.connected.deviceId)
      var childLockSwitch = configManager.getChildLockSwitch(this.data.connected.deviceId)
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin,
        childLock: childLock,
        childLockSwitch: childLockSwitch,
      })
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("kuaijie-k5-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("kuaijie-k5-->ready");
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
      console.info("attached");
      this.setData({
        display: app.globalData.display,
        // 屏幕高度-顶部高度-tab高度-预留5px底部距离
        containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 62
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("kuaijie-k5-->detached");
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
      console.info('kuaijie-K5->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
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

      // 记忆左
      setTimeout(() => {
        cur.sendAskBlueCmd('7600097EDC')
      }, 600);

      // 记忆右
      setTimeout(() => {
        cur.sendAskBlueCmd('7F0009AEDE')
      }, 800);

      setTimeout(() => {
        // cur.sendBlueFullCmd('FFFFFFFF0500000F0CD2F5');//查询童锁的状态
      }, 1000)

    },

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      console.error('kuaijie-K5->blueReply', cmd);
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

      var prefix = cmd.substr(0, 14).toUpperCase();
      console.info('kuaijie-k5->askBack', cmd, prefix);
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
            jiyiLeft: true
          })
        }
        if ('34' == status) {
          that.setData({
            jiyiRight: true
          })
        }
      }

      if (cmd.indexOf('FFFFFFFF0500050A0CC1A4') >= 0) {//回复关锁成功
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
        console.log(that.data.connected.deviceId, "设置童锁")
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
     * 发蓝牙全命令
     * @param {*} cmd 
     */
    sendBlueFullCmd(cmd) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, cmd, null);
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
    tapJiyiLeft() {
      console.info("tapJiyiLeft");
      this.setData({
        currentAnjian: {
          anjian: 'jiyi',
          name: '记忆'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var jiyiLeft = this.data.jiyiLeft;
      if (!jiyiLeft) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('30338315', ({
            success: (res) => {
              console.info('tapJiyiLeft->发送成功');
              that.setData({
                jiyiLeft: true
              });
            },
            fail: (res) => {
              console.error('tapJiyiLeft->发送失败', res);
            }
          }));
        } else {

        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('3F3386E5', ({
            success: (res) => {
              console.info('tapJiyiLeft->发送成功');
              that.setData({
                jiyiLeft: false
              });
            },
            fail: (res) => {
              console.error('tapJiyiLeft->发送失败', res);
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
    tapJiyiRight() {
      console.info("tapJiyiRight");
      this.setData({
        currentAnjian: {
          anjian: 'jiyi',
          name: '零压力'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var jiyiRight = this.data.jiyiRight;
      if (!jiyiRight) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('4034E717', ({
            success: (res) => {
              console.info('tapJiyiRight->发送成功');
              that.setData({
                jiyiRight: true
              });
            },
            fail: (res) => {
              console.error('tapJiyiRight->发送失败', res);
            }
          }));
        } else {

        }
      } else {
        // 有记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('4F34E2E7', ({
            success: (res) => {
              console.info('tapJiyiRight->发送成功');
              that.setData({
                jiyiRight: false
              });
            },
            fail: (res) => {
              console.error('tapJiyiRight->发送失败', res);
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
      this.sendBlueCmd('0008D6C6');
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
      this.sendBlueCmd('0008D6C6');
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
      this.setData({
        currentAnjian: {
          anjian: anjian,
          name: name
        }
      })
      var cmd = '';
      if (anjian == 'kandianshi') {
        this.sendBlueFullCmd('FFFFFFFF050005003E46D1');
        return;
      } else if (anjian == 'fuyuan') {
        cmd = '003B96D3';
      }
      if (cmd) {
        this.sendBlueCmd(cmd);
      }
    },



    // ***********此处是方法结束处
  },



})