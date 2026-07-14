// component/diandong/diandong.js
const util = require('../../../utils/util')
const time = require('../../../utils/time');
const configManager = require('../../../utils/configManager')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const crcUtil = require('../../../utils/crcUtil');
const app = getApp();
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const imgSanjiaoBottomSelected = '../../../images/' + app.globalData.skin + '/sanjiao-bottom-selected@3x.png';
const imgSanjiaoBottomNormal = '../../../images/' + app.globalData.skin + '/sanjiao-bottom-normal@3x.png';
const imgSanjiaoTopSelected = '../../../images/' + app.globalData.skin + '/sanjiao-top-selected@3x.png';
const imgSanjiaoTopNormal = '../../../images/' + app.globalData.skin + '/sanjiao-top-normal@3x.png';
const weekArray = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '日',
];


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
    imgSanjiao: {
      imgSanjiaoBottomSelected: imgSanjiaoBottomSelected,
      imgSanjiaoBottomNormal: imgSanjiaoBottomNormal,
      imgSanjiaoTopSelected: imgSanjiaoTopSelected,
      imgSanjiaoTopNormal: imgSanjiaoTopNormal
    },
    periodList: [{
      id: 1,
      name: '周一',
      checked: false
    },
    {
      id: 2,
      name: '周二',
      checked: false
    },
    {
      id: 3,
      name: '周三',
      checked: false
    },
    {
      id: 4,
      name: '周四',
      checked: false
    },
    {
      id: 5,
      name: '周五',
      checked: false
    },
    {
      id: 6,
      name: '周六',
      checked: false
    },
    {
      id: 7,
      name: '周日',
      checked: false
    },
    ],
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
    anMoCheck: false,//按摩状态
    dengguangCheck: false,//灯光状态
    isOpenAlarm: false,
    showZhinengjiance: false,//是否有智能检测
    zhinengjianceType: '00',//智能检测类型
    isFirstAlarm: false,//是否首次设置闹钟
    selectIndex: -1,//0:看电视 1：止鼾 2：零压 3：记忆1 4：摇篮 5：记忆2 6：放平
  },

  /**
   * 页面的生命周期
   */
  pageLifetimes: {
    show: function () {
      console.log("diandong show")
      //闹钟
      let connected = configManager.getCurrentConnected();
      let isOpenAlarm = false;
      if (util.isNotEmptyObject(connected)) {
        var alarm = configManager.getAlarm(connected.deviceId)
        if (alarm) {
          isOpenAlarm = alarm.isOpenAlarm
        }
        console.log("闹钟功能", isOpenAlarm)
      }
      this.setData({
        isOpenAlarm: isOpenAlarm
      })
      setTimeout(() => {
        this.askJiyiStatus(this);
      }, 400)
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
      var that = this;
      let connected = configManager.getCurrentConnected();
      that.setData({
        connected: connected,
      })
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached" + app.globalData.screenHeight + "-" + app.globalData.navHeight);
      let connected = configManager.getCurrentConnected();
      var containerHeight = 0
      console.log(connected)
      if (connected.name.indexOf("TL-Q") > -1) {
        containerHeight = app.globalData.screenHeight - app.globalData.navHeight - 60
      } else {
        containerHeight = app.globalData.screenHeight - app.globalData.navHeight
      }
      this.setData({
        display: app.globalData.display,
        // 屏幕高度-顶部高度-tab高度-预留5px底部距离
        containerHeight: containerHeight
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
      // 删除回调
      WxNotificationCenter.removeNotification("INIT", that);
    },

    /**
     * 询问记忆状态 （合并询问码）
     */
    askJiyiStatus(cur) {
      // 合并询问码
      var cmd = 'FFFFFFFF01002A1400000000000000000000';
      cmd = cmd + crcUtil.HexToCSU16(cmd);
      console.log(cmd)
      this.sendAskBlueCmd(cmd);
      setTimeout(() => {
        this.sendRequestAlarmCmd();
      }, 200)
    },

    /**
  * 初始化发送时间校验闹钟请求
  */
    sendRequestAlarmCmd() {
      console.info('main->sendInitCmd 发送闹钟指令 time ', new Date().getTime());
      let cmdPrefix = 'FFFFFFFF01000111';
      let date = time.getDateInfo(new Date());
      let cmdTime = date.hour + date.minute + date.second + date.week + date.year + date.month + date.day;
      let cmdCrc = crcUtil.HexToCSU16(cmdPrefix + cmdTime);
      let cmd = cmdPrefix + cmdTime + cmdCrc;
      console.log('sendRequestAlarmCmd:', cmd);

      this.sendAskBlueCmd(cmd);
    },

    /**
     * 蓝牙回复回调
     * @param {*} cmd 
     */
    blueReply(cmd) {
      var that = this.observer;
      console.error('diandong->blueReply', cmd);
      cmd = cmd.toUpperCase();
      if (cmd.indexOf("FFFFFFFF01002A14") > -1) {
        var status = cmd.substr(16, 2).toUpperCase();
        var result = util.byteToBitsBylowe('0x' + status)
        console.log("智能床架", result)
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

        var type = cmd.substr(18, 2).toUpperCase();
        if (type != '00') {
          setTimeout(() => {
            that.sendAskBlueCmd("FFFFFFFF01000C0B0F2304")
          }, 200)
        }

        var anMost = cmd.substr(20, 2).toUpperCase();
        var anMoStatus = false
        if (anMost == '01') {
          anMoStatus = true
        }

        var dengguangCk = cmd.substr(22, 2).toUpperCase();
        var dengguangCheck = false
        if (dengguangCk == '01') {
          dengguangCheck = true
        }

        var anMoCk = cmd.substr(24, 2).toUpperCase();
        var anMoCheck = false
        if (anMoCk == '01') {
          anMoCheck = true
        }

        that.setData({
          anMoStatus: anMoStatus,
          dengguangCheck: dengguangCheck,
          anMoCheck: anMoCheck
        })

      } else if (cmd.indexOf('FFFFFFFF0100030B00') >= 0 ||
        cmd.indexOf('FFFFFFFF01000413') >= 0) {//电动床实时时间校验
        var deviceId = that.data.connected.deviceId;
        // 有闹钟功能
        that.setAlarm(that, cmd, deviceId);
        return;
      } else if (cmd.indexOf('FFFFFFFF01000C11') > -1) {//查询心率带mac地址以及类型
        var type = cmd.substr(16, 2).toUpperCase();
        var macCmd = cmd.substr(18, 12).toUpperCase;
        var showZhinengjiance = false
        var appId = ""
        if (type == '01') {
          showZhinengjiance = true
          appId = "wxbbdd4b1b88358610"
        } else if (type == '02') {
          showZhinengjiance = true
          appId = "wx89783978e44773d0"
        } else if (type == '03') {
          showZhinengjiance = true
        }
        that.setData({
          showZhinengjiance: true,
          zhinengjianceType: type
        })
        var macCmd = cmd.substr(22, 12);
        app.globalData.mac = macCmd;
        app.globalData.appId = appId;
      }
    },

    /**
   * 有闹钟功能
   * @param {*} cmd 
   * @param {*} deviceId 
   */
    setAlarm: function (that, cmd, deviceId) {
      console.error('diandong->setAlarm-->开启闹钟设置', cmd, deviceId);
      let alarm = {};
      var isFirstAlarm = false
      if (cmd.indexOf('FFFFFFFF0100030B00') >= 0) {
        // 有闹钟未设置
        isFirstAlarm = true
        configManager.putAlarmSwitch(true, deviceId);
        alarm.isOpenAlarm = false;
        configManager.putAlarm(alarm, deviceId);

        that.setData({
          isFirstAlarm: isFirstAlarm,
          isOpenAlarm: false
        })
      } else if (cmd.indexOf('FFFFFFFF01000413') >= 0) {
        // 有闹钟已设置
        configManager.putAlarmSwitch(true, deviceId)
        let cmdStatus = cmd.substr(16, 2);
        if ('0F' == cmdStatus || '1F' == cmdStatus) {
          // 开启
          alarm.isOpenAlarm = true;
        } else {
          // 关闭
          alarm.isOpenAlarm = false;
        }
        // 时间
        let timeHour = cmd.substr(18, 2);
        let timeMin = cmd.substr(20, 2);
        alarm.time = timeHour + ':' + timeMin;

        // 星期
        let cmdWeek = util.str16To2(cmd.substr(24, 2));
        let cmdweekArray = util.strToArray(cmdWeek, 1);
        let period = [];
        let periodDesc = '';
        for (let i = cmdweekArray.length - 2; i >= 0; i--) {
          if (cmdweekArray[i] == '1') {
            period.push(this.data.periodList[6 - i].id);
          }
        }
        console.log('bedstead.alarm->blueReply :period:,' + period);
        if (period.length > 0) {
          period.forEach(j => {
            periodDesc += weekArray[j - 1];
          });
        } else {
          periodDesc = '不重复';
        }
        alarm.period = period;
        alarm.periodDesc = periodDesc;

        // 重复
        // let cmdRepeat = cmd.substr(26, 2);
        // alarm.repeat = cmdRepeat == '01' ? true : false;

        // 模式
        let cmdMode = cmd.substr(28, 2);
        if ('01' == cmdMode) {
          alarm.modeVal = 'lingyali';
          alarm.modeName = '零压力';
        } else if ('02' == cmdMode) {
          alarm.modeVal = 'jiyi1';
          alarm.modeName = '记忆一';
        } else if ('04' == cmdMode) {
          alarm.modeVal = 'lingyaliLeft';
          alarm.modeName = '左侧零压力';
        } else if ('05' == cmdMode) {
          alarm.modeVal = 'lingyaliRight';
          alarm.modeName = '右侧零压力';
        } else if ('06' == cmdMode) {
          alarm.modeVal = 'lingyaliAll';
          alarm.modeName = '零压力';
        } else {
          alarm.modeVal = 'close';
          alarm.modeName = '不动作';
        }

        // 按摩
        let cmdAnmo = cmd.substr(30, 2);
        alarm.anmo = '01' == cmdAnmo ? true : false;

        // 响铃
        let cmdRing = cmd.substr(32, 2);
        alarm.ring = '01' == cmdRing ? true : false;
        configManager.putAlarm(alarm, deviceId);

        that.setData({
          isOpenAlarm: alarm.isOpenAlarm
        })
      }
    },

    /**
     * 发送询问记忆状态命令
     * @param {}} cmd 
     */
    sendAskBlueCmd(cmd) {
      var connected = this.data.connected;
      console.log(connected)
      util.sendBlueCmd(connected, cmd);
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
     * 记忆1的点击事件
     */
    tapJiyi1() {
      this.setData({
        selectIndex: 3
      })
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
      this.setData({
        selectIndex: 5
      })
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
      this.setData({
        selectIndex: 0
      })
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
      this.setData({
        selectIndex: 2
      })
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
      this.setData({
        selectIndex: 1
      })
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
     * 摇篮
     * @param {*} e 
     */
    tapYaoLan(e) {
      this.setData({
        selectIndex: 4
      })
      // 单击
      this.sendBlueCmd('006A572F');
    },

    /**
     * 放平
     * @param {*} e 
     */
    tapFangping(e) {
      this.setData({
        selectIndex: 6
      })
      // 单击
      this.sendBlueCmd('0008D6C6');
    },

    //点击电动床设置
    diandongSetTap() {
      wx.navigateTo({
        url: '/pages/mainv2/diandongset/diandongset'
      })
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
          beibutzTop: true,
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
    anmoChange(event) {
      if (event.detail.value) {//按摩开
        this.sendBlueCmd("011CD759");
      } else {//按摩关
        this.sendBlueCmd("001CD6C9");
      }
    },

    //点击灯光
    dengguangChange(event) {
      if (event.detail.value) {//灯光开
        this.sendBlueCmd("004A56F7");
      } else {//灯光关
        this.sendBlueCmd("004B9737");
      }
    },

    //点击定时
    alarmChange(event) {
      if (this.data.isFirstAlarm) {
        var that = this
        wx.showModal({
          title: '提示',
          content: '需要先设置闹钟',
          complete: (res) => {
            if (res.cancel) {
              that.setData({
                isOpenAlarm: false
              })
            }

            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/mainv2/diandongset/diandongset?isFirstAlarm=1',
              })
            }
          }
        })
      } else {
        var openAlarm = event.detail.value
        let connected = this.data.connected;
        let alarm = configManager.getAlarm(connected.deviceId);
        let time = alarm.time;

        // 前缀
        let sendAlarmCmdPre = 'FFFFFFFF01000213';
        // 状态
        if (openAlarm) {
          sendAlarmCmdPre += '01';
        } else {
          sendAlarmCmdPre += 'A1';
        }
        // 时间
        if (time == '') {
          sendAlarmCmdPre += '000000';
        } else {
          sendAlarmCmdPre += time.substr(0, 2) + time.substr(3, 2) + '00';
        }

        // 星期
        let period = alarm.period;
        if (!util.isNotEmptyStr(period) || period.length == 0) {
          sendAlarmCmdPre += '00';
        } else {
          let week2cmd = '';
          for (let i = 7; i >= 1; i--) {
            if (period.includes(i)) {
              week2cmd += '1';
            } else {
              week2cmd += '0';
            }
          }
          week2cmd += '0';
          sendAlarmCmdPre += util.str2To16(week2cmd);
        }

        // 重复
        // let repeat = alarm.repeat;
        if (!util.isNotEmptyStr(period) || period.length == 0) {
          sendAlarmCmdPre += '00';
        } else {
          sendAlarmCmdPre += '01';
        }
        // if (repeat) {
        //   sendAlarmCmdPre += '01';
        // } else {
        //   sendAlarmCmdPre += '00';
        // }

        // 模式
        let mode = alarm.modeVal;
        if ('lingyali' == mode) {
          sendAlarmCmdPre += '01';
        } else if ('jiyi1' == mode) {
          sendAlarmCmdPre += '02';
        } else if ('close' == mode) {
          sendAlarmCmdPre += '03';
        } else if ('lingyaliLeft' == mode) {
          sendAlarmCmdPre += '04';
        } else if ('lingyaliRight' == mode) {
          sendAlarmCmdPre += '05';
        } else if ('lingyaliALL' == mode) {
          sendAlarmCmdPre += '06';
        } else {
          sendAlarmCmdPre += '03';
        }

        // 按摩
        let anmo = alarm.anmo;
        if (anmo) {
          sendAlarmCmdPre += '01';
        } else {
          sendAlarmCmdPre += '00';
        }

        // 响铃
        let ring = alarm.ring;
        if (ring) {
          sendAlarmCmdPre += '01';
        } else {
          sendAlarmCmdPre += '00';
        }

        let cmdCrc = crcUtil.HexToCSU16(sendAlarmCmdPre);
        let cmd = sendAlarmCmdPre + cmdCrc;

        // 发送蓝牙命令
        console.log('diandongAlarmTap->', cmd);
        util.sendBlueCmd(connected, cmd);

        alarm.isOpenAlarm = openAlarm;
        configManager.putAlarm(alarm, connected.deviceId);
      }
    },

    /**
     * 长按按摩区域 解绑心率带 透传MAC 时，增加1D
     */
    tapZhinengCancel() {
      var longClick = this.longClick();
      if (longClick) {
        var type = this.data.zhinengjianceType;
        if (type == '01' || type == '02') {
          var jumpPath = 'pages/index/index?mac=' + app.globalData.mac + '&type=1D';
          console.log("开始跳转", jumpPath, app.globalData.appId)
          wx.navigateToMiniProgram({
            appId: app.globalData.appId,
            path: jumpPath,
            envVersion: 'trial', //develop,trial,release
          })
        }
      }
    },

    //点击智能监测
    tapZhinengjiance() {
      var type = this.data.zhinengjianceType;
      if (type == '01' || type == '02') {
        var jumpPath = 'pages/index/index?mac=' + app.globalData.mac;
        wx.navigateToMiniProgram({
          appId: app.globalData.appId,
          path: jumpPath,
          envVersion: 'trial', //develop,trial,release
        })
      } else if (type == '03') {
        wx.navigateTo({
          url: '/pages/mainv2/zhinengjiance/zhinengjiance',
        })
      } else {
        this.sendAskBlueCmd("FFFFFFFF01000C0B0F2304")
      }
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
