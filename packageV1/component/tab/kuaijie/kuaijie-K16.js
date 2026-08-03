// component/tab/kuaijie/kuaijie-K16.js
const util = require('../../../../utils/util')
const configManager = require('../../../../utils/configManager')
const WxNotificationCenter = require('../../../../utils/WxNotificationCenter')
const crcUtil = require('../../../../utils/crcUtil');
const app = getApp();
const askPrefix = 'FFFFFFFF0300'; // 询问码前缀
const askReply2Prefix = 'FFFFFFFF030600'; // 询问码2回复前缀
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
      anjian: 'dianshi', // kandianshi,lingyali,zhihan,fuyuan
      name: '电视' // 电视，零压，睡眠，休闲，腿部舒压，摇摆放松
    },
    kandianshi: false,
    lingyali: false,
    shuimian: false,
    xiuxian: false,
    tuibushuya: false,
    yaobaifangsong: false,
    startTime: '',
    endTime: '',
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
      console.info('K16->show');
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
      console.info("kuaijie-k16-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("kuaijie-k16-->ready");
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
        containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 52 - 5
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("kuaijie-k16-->detached");
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
      console.info('kuaijie-K16->initConnected:', connected, this.observer);
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
      var name = connected.name;
      // 看电视
      var dianshi = '1800039F06';
      // 零压力
      var lingya = '2000031ECB';
      // 睡眠
      var shuimian = '3800039ECC';

      setTimeout(() => {
        cur.sendAskBlueCmd(dianshi)
        setTimeout(() => {
          cur.sendAskBlueCmd(lingya)
          setTimeout(() => {
            cur.sendAskBlueCmd(shuimian)
            setTimeout(() => {
              // cur.sendFullBlueCmd('FFFFFFFF0500000F0CD2F5');//查询童锁的状态
            }, 400)
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
      console.error('kuaijie-K16->blueReply', cmd);
      cmd = cmd.toUpperCase();

      var prefix = cmd.substr(0, 14).toUpperCase();
      console.info('kuaijie-k16->blueReply', cmd, prefix);

      if (prefix == askReply2Prefix) {
        var status = cmd.substr(14, 2).toUpperCase();
        if ('05' == status) {
          that.setData({
            dianshi: true
          })
        }
        if ('09' == status) {
          that.setData({
            lingya: true
          })
        }
        if ('0F' == status) {
          that.setData({
            shuimian: true
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
      console.error('K16 -> sendAskBlueCmd ', cmd, new Date().getTime());
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
     * 发送完整指令的蓝牙命令
     */
    sendFullBlueCmd(fullCmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, fullCmd, options);
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
     * 看电视的点击事件
     */
    tapdianshi() {
      console.info("tapdianshi");
      this.setData({
        currentAnjian: {
          anjian: 'dianshi',
          name: '电视'
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
              console.info('dianshi->发送成功');
              that.setData({
                kandianshi: true
              });
            },
            fail: (res) => {
              console.error('dianshi->发送失败', res);
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
              console.info('dianshi->发送成功');
              that.setData({
                kandianshi: false
              });
            },
            fail: (res) => {
              console.error('dianshi->发送失败', res);
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
    tapLingya() {
      console.info("tapLingyali");
      this.setData({
        currentAnjian: {
          anjian: 'lingya',
          name: '零压'
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
              console.info('tapLingya->发送成功');
              that.setData({
                lingyali: true
              });
            },
            fail: (res) => {
              console.error('tapLingya->发送失败', res);
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
              console.info('tapLingya->发送成功');
              that.setData({
                lingyali: false
              });
            },
            fail: (res) => {
              console.error('tapLingya->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('91097A96');
        }
      }
    },

    /**
     * 睡眠的点击事件
     */
    tapShuimian() {
      console.info("tapShuimian");
      this.setData({
        currentAnjian: {
          anjian: 'shuimian',
          name: '睡眠'
        }
      })
      var that = this;
      var longClick = this.longClick();
      var zhihanStatus = this.data.zhihan;
      if (!zhihanStatus) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('A00A2F07', ({
            success: (res) => {
              console.info('tapShuimian->发送成功');
              that.setData({
                zhihan: true
              });
            },
            fail: (res) => {
              console.error('tapShuimian->发送失败', res);
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
              console.info('tapShuimian->发送成功');
              that.setData({
                zhihan: false
              });
            },
            fail: (res) => {
              console.error('tapShuimian->发送失败', res);
            }
          }));

        } else {
          // 单击
          this.sendBlueCmd('A10A2E97');
        }
      }
    },


    /**
     * 休闲的点击事件
     */
    tapXiuxian() {
      console.info("tapXiuxian");
      this.setData({
        currentAnjian: {
          anjian: 'xiuxian',
          name: '休闲'
        }
      })
      // 单击
      this.sendBlueCmd('00479732');
    },

    /**
     * 腿部舒压的点击事件
     */
    tapTuibushuya() {
      console.info("tapTuibushuya");
      this.setData({
        currentAnjian: {
          anjian: 'tuibushuya',
          name: '腿部舒压'
        }
      })
      // 单击
      this.sendBlueCmd('00E5168B');
    },


    /**
     * 摇摆放松的点击事件
     */
    tapYaobaifangsong() {
      console.info("tapYaobaifangsong");
      this.setData({
        currentAnjian: {
          anjian: 'yaobaifangsong',
          name: '摇摆放松'
        }
      })
      // 单击
      this.sendBlueCmd('00E6568A');
    },


  },

})
