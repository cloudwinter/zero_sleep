// component/tab/kuaijie/kuaijie-K18.js
const util = require('../../../../utils/util')
const configManager = require('../../../../utils/configManager')
const WxNotificationCenter = require('../../../../utils/WxNotificationCenter')
const crcUtil = require('../../../../utils/crcUtil');
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
      anjian: 'lingya', // 
      name: '零压' // 
    },
    startTime: '',
    endTime: '',
    tongbukzShow: false, // 同步控制显示
    tongbukzStatus: false, // 同步控制状态
    guanying: false,//观影
    lingya: false,//零压
  },

  /**
   * 页面的生命周期
   */
  pageLifetimes: {
    show: function () {
      console.info("kuaijie-K17-->show");
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin
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
      // 看电视
      var guanying = '1600097EC2';
      // 零压力
      var lingya = '1F0009AEC0';
      setTimeout(() => {
        cur.sendAskBlueCmd(guanying)
        setTimeout(() => {
          cur.sendAskBlueCmd(lingya)
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
            lingya: true
          })
        }
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
     * 零压的点击事件
     */
    tapLingya() {
      console.info("tapLingya");
      this.setData({
        currentAnjian: {
          anjian: 'lingya',
          name: '零压'
        }
      })

      var that = this;
      var longClick = this.longClick();
      var lingya = this.data.lingya;
      if (!lingya) {
        // 无记忆
        if (longClick) {
          // 长按
          this.sendBlueCmd('90097B06', ({
            success: (res) => {
              console.info('lingya->发送成功');
              that.setData({
                lingya: true
              });
            },
            fail: (res) => {
              console.error('lingya->发送失败', res);
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
              console.info('lingya->发送成功');
              that.setData({
                lingya: false
              });
            },
            fail: (res) => {
              console.error('lingya->发送失败', res);
            }
          }));
        } else {
          // 单击
          this.sendBlueCmd('91097A96');
        }
      }
    },

    /**
     * 休闲的点击事件
     */
    tapXiuxian() {
      console.info("xiuxian");
      this.setData({
        currentAnjian: {
          anjian: 'xiuxian',
          name: '休闲'
        }
      })
      // 单击 
      this.sendBlueCmd('01051693');
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
     * 微醺小憩的点击事件
     */
    tapWeixunxiaoqi() {
      console.info("tapWeixunxiaoqi");
      this.setData({
        currentAnjian: {
          anjian: 'weixunxiaoqi',
          name: '微醺小憩'
        }
      })
      // 单击
      this.sendBlueCmd('02739785');
    },

    /**
     * 护肤躺的点击事件
     */
    tapHufutang() {
      console.info("tapHufutang");
      this.setData({
        currentAnjian: {
          anjian: 'hufutang',
          name: '护肤躺'
        }
      })

      // 单击
      this.sendBlueCmd('04739425');
    },

    /**
    * C拉伸的点击事件
    */
    tapClashen() {
      console.info("tapClashen");
      this.setData({
        currentAnjian: {
          anjian: 'clashen',
          name: 'C拉伸'
        }
      })
      // 单击
      this.sendBlueCmd('000A5707');
    },

    /**
    * V卷腹的点击事件
    */
    tapVjuanfu() {
      console.info("tapVjuanfu");
      this.setData({
        currentAnjian: {
          anjian: 'vjuanfu',
          name: 'V卷腹'
        }
      })
      // 单击
      this.sendBlueCmd('000F9704');
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
    * 动态拉伸的点击事件
    */
    tapDongtailashen() {
      console.info("tapDongtailashen");
      this.setData({
        currentAnjian: {
          anjian: 'dongtailashen',
          name: '动态拉伸'
        }
      })
      // 单击
      this.sendBlueCmd('006A572F');
    },

    /**
    * 动态卷腹的点击事件
    */
    tapDongtaijuanfu() {
      console.info("tapDongtaijuanfu");
      this.setData({
        currentAnjian: {
          anjian: 'dongtaijuanfu',
          name: '动态卷腹'
        }
      })
      // 单击
      this.sendBlueCmd('026A564F');
    },

    /**
    * 动态摇摆的点击事件
    */
    tapDongtaiyaobai() {
      console.info("tapDongtaiyaobai");
      this.setData({
        currentAnjian: {
          anjian: 'dongtaiyaobai',
          name: '动态摇摆'
        }
      })
      // 单击
      this.sendBlueCmd('016A56BF');
    },

    /**
    * 躺平的点击事件
    */
    tapTangping() {
      console.info("tapTangping");
      this.setData({
        currentAnjian: {
          anjian: 'tangping',
          name: '躺平'
        }
      })
      // 单击
      this.sendBlueCmd('0008D6C6');
    },
  }
})