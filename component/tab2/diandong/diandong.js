// component/diandong/diandong.js
const util = require('../../../utils/util')
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
const app = getApp();
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const imgSanjiaoBottomSelected = '../../../images/' + app.globalData.skin + '/sanjiao-bottom-selected@3x.png';
const imgSanjiaoBottomNormal = '../../../images/' + app.globalData.skin + '/sanjiao-bottom-normal@3x.png';
const imgSanjiaoTopSelected = '../../../images/' + app.globalData.skin + '/sanjiao-top-selected@3x.png';
const imgSanjiaoTopNormal = '../../../images/' + app.globalData.skin + '/sanjiao-top-normal@3x.png';


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
    imgSanjiao: {
      imgSanjiaoBottomSelected: imgSanjiaoBottomSelected,
      imgSanjiaoBottomNormal: imgSanjiaoBottomNormal,
      imgSanjiaoTopSelected: imgSanjiaoTopSelected,
      imgSanjiaoTopNormal: imgSanjiaoTopNormal
    },
    animationPosition: 1, //动画，1，2，3 或者 3，2，1 初始化都是1
    animationStop: true, //停止动画
    startTime: '',
    endTime: '',
    connected: {},
    mode: 0,//选择模式
    beibutzTop: false,
    beibutzBottom: false,
    tuibutzTop: false,
    tuibutzBottom: false,
    jiyi1: false,
    jiyi2: false,
    kandianshi: false,
    lingyali: false,
    zhihan: false,
    anMoStatus: false,
    alarmStatus: '未设置',
    alarmSwitch:false
  },

  /**
   * 页面的生命周期
   */
  pageLifetimes: {
    show: function () {
      console.log("diandong show")
      // 设置当前的皮肤样式
      this.setData({
        skin: app.globalData.skin,
        imgSanjiao: {
          imgSanjiaoBottomSelected: '../../../images/' + app.globalData.skin + '/sanjiao-bottom-selected@3x.png',
          imgSanjiaoBottomNormal: '../../../images/' + app.globalData.skin + '/sanjiao-bottom-normal@3x.png',
          imgSanjiaoTopSelected: '../../../images/' + app.globalData.skin + '/sanjiao-top-selected@3x.png',
          imgSanjiaoTopNormal: '../../../images/' + app.globalData.skin + '/sanjiao-top-normal@3x.png'
        },
      })

      //闹钟
      let connected = configManager.getCurrentConnected();
      let alarmStatus = this.data.alarmStatus;
      let alarmSwitch = false;
      if (util.isNotEmptyObject(connected)) {
        let alarm = configManager.getAlarm(connected.deviceId);
        alarmSwitch = configManager.showAlarmSwitch(connected.deviceId);
        console.log("闹钟功能",alarmSwitch)
        if (util.isNotEmptyObject(alarm)) {
          if (alarm.isOpenAlarm) {
            alarmStatus = '已开启';
          } else {
            if (alarm.time) {
              alarmStatus = '已关闭';
            } else {
              alarmStatus = '未设置';
            }
          }
        } else {
          alarmStatus = '未设置';
        }
      } else {
        alarmStatus = '未连接';
      }
      this.setData({
        alarmStatus: alarmStatus,
        alarmSwitch: alarmSwitch
      })
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("diandong-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
      WxNotificationCenter.addNotification("BLUEREPLY", that.blueReply, that);
    },
    ready: function () {
      // 在组件在视图层布局完成后执行
      console.info("diandong-->ready");
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached" + app.globalData.screenHeight + "-" + app.globalData.navHeight);
      this.setData({
        display: app.globalData.display,
        // 屏幕高度-顶部高度-tab高度-预留5px底部距离
        containerHeight: app.globalData.screenHeight - app.globalData.navHeight - 10
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("diandong-->detached");
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
      console.info('diandong->initConnected:', connected, this.observer);
      console.log(connected)
      that.setData({
        connected: connected,
      })
      that.askJiyiStatus(connected, that);
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
    },

    /**
     * 询问记忆状态 （合并询问码）
     */
    askJiyiStatus(connected, cur) {
      // 合并询问码
      var cmd = 'FFFFFFFF01002A1400000000000000000000';
      cmd = cmd + crcUtil.HexToCSU16(cmd);
      console.log(cmd)
      cur.sendAskBlueCmd(cmd);
    },

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      console.error('diandong->blueReply', cmd);
      cmd = cmd.toUpperCase();

      if(cmd.indexOf("FFFFFFFF01002A14")>-1){
        var anMoStatus = cmd.substr(20, 2).toUpperCase();
        if (anMoStatus == '01') {
          that.setData({
            anMoStatus: true
          })
        }
        var status = cmd.substr(16, 2).toUpperCase();
        var result = util.byteToBitsBylowe('0x' + status)
        console.log("智能床架" , result)
        if (result.length == 8) {
          if (result[0] == 1) {
            that.setData({
              kandianshi: true
            })
          }
          if (result[1] == 1) {
            that.setData({
              lingyali: true
            })
          }
          if (result[2] == 1) {
            that.setData({
              jiyi1: true
            })
          }
          if (result[3] == 1) {
            that.setData({
              jiyi2: true
            })
          }
          if (result[4] == 1) {
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
      util.sendBlueCmd(connected, cmd);
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
      return false;
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
     * 放平
     * @param {*} e 
     */
    tapFangping(e) {
      // 单击
      this.sendBlueCmd('0008D6C6');
    },

    /**
    * 按下事件
    * @param {*} e 
    */
    touchWTStart(e) {
      this.startTime = e.timeStamp;
      console.log("touchStart", this.startTime);
      var type = e.currentTarget.dataset.type;
      if (type) {
        console.info('touchStart', type);
        // 启动动画
        this.setData({
          animationStop: false
        })
      }
      if (type == 'beibutzTop') {
        this.setData({
          currentAnjian: {
            anjian: 'beibutz',
            name: '背部调整'
          },
          beibutzTop: true
        });
        this.donghua(true, this);
        this.tapBeibutz(true, true);
      } else if (type == 'beibutzBottom') {
        this.setData({
          currentAnjian: {
            anjian: 'beibutz',
            name: '背部调整'
          },
          beibutzBottom: true
        });
        this.donghua(false, this);
        this.tapBeibutz(false, true);
      } else if (type == 'tuibutzTop') {
        this.setData({
          currentAnjian: {
            anjian: 'tuibutz',
            name: '腿部调整'
          },
          tuibutzTop: true
        });
        this.donghua(true, this);
        this.tapTuibutz(true, true);
      } else if (type == 'tuibutzBottom') {
        this.setData({
          currentAnjian: {
            anjian: 'tuibutz',
            name: '腿部调整'
          },
          tuibutzBottom: true
        });
        this.donghua(false, this);
        this.tapTuibutz(false, true);
      }
    },
    /**
     * 抬起事件
     * @param {*} e 
     */
    touchWTEnd(e) {
      this.endTime = e.timeStamp;
      console.log("touchEnd", this.endTime);
      var type = e.currentTarget.dataset.type;
      if (type) {
        // 停止动画
        console.info('touchEnd', type);
        this.setData({
          animationStop: true
        })
      }
      // 还原动画
      this.setData({
        animationPosition: 1
      });
      if (type == 'beibutzTop') {
        this.setData({
          beibutzTop: false
        });
        this.tapBeibutz(true, false);
      } else if (type == 'beibutzBottom') {
        this.setData({
          beibutzBottom: false
        });
        this.tapBeibutz(false, false);
      } else if (type == 'tuibutzTop') {
        this.setData({
          tuibutzTop: false
        });
        this.tapTuibutz(true, false);
      } else if (type == 'tuibutzBottom') {
        this.setData({
          tuibutzBottom: false
        });
        this.tapTuibutz(false, false);
      }
    },

    /**
    * 腿部调整
    * @param {*} top 上
    * @param {*} start 按下
    */
    tapTuibutz(top, start) {
      var cmd = '';
      if (!start) {
        // 松开 发停止码
        cmd = '0000D700';
        this.sendBlueCmd(cmd);
      } else {
        // 按下
        if (top) {
          cmd = '00065702';
        } else {
          cmd = '000796C2';
        }
        this.sendBlueCmd(cmd);
      }
    },

    /**
   * 背部调整
   * @param {*} top 上
   * @param {*} start 按下
   */
    tapBeibutz(top, start) {
      var cmd = '';
      if (!start) {
        // 松开 发停止码
        cmd = '0000D700';
        this.sendBlueCmd(cmd);
      } else {
        // 按下
        if (top) {
          cmd = '00039701';
        } else {
          cmd = '0004D6C3';
        }
        this.sendBlueCmd(cmd);
      }
    },




    //点击按摩
    tapAnmo() {
      wx.navigateTo({
        url: '/pages/mainv2/anmo/anmo',
      })
    },

    //点击灯光
    tapDengguang() {
      wx.navigateTo({
        url: '/pages/mainv2/dengguang/dengguang',
      })
    },

    //点击定时
    tapDingshi() {
      wx.navigateTo({
        url: '/pages/alarm/alarm',
      })
    },

    /********************动画处理 */
    /**
     * 顺序就是1，2，3，倒序就是3，2，1
     * @param {是否倒序} reversal 
     */
    donghua(reversal, cur) {
      var that = cur;
      console.info('donghua', that);
      var stop = that.data.animationStop;
      var position = that.data.animationPosition;
      if (stop) {
        // 还原初始值
        that.setData({
          animationPosition: 1
        })
        // 停止
        return;
      }
      if (reversal) {
        // 倒序
        position--;
        if (position <= 0) {
          position = 3;
        }
      } else {
        // 顺序
        position++;
        if (position >= 4) {
          position = 1;
        }
      }
      that.setData({
        animationPosition: position
      });
      setTimeout(that.donghua, 400, reversal, that);
    },


  }
})
