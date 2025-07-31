// pages/mainv2/diandongset/diandongset.js
const util = require('../../../utils/util')
const time = require('../../../utils/time');
const crcUtil = require('../../../utils/crcUtil');
const configManager = require('../../../utils/configManager')
const app = getApp()
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const toubuReplyPrefix = 'FFFFFFFF05000001';
const tuibuReplyPrefix = 'FFFFFFFF05000002';
const anmopinglvReplyPrefix = 'FFFFFFFF05000003';
const WxNotificationCenter = require('../../../utils/WxNotificationCenter');
const weekArray = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '日',
];
const alarmPre = 'FFFFFFFF0100';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {}, // 当前连接的设备
    skin: app.globalData.skin, //当前皮肤样式
    display: app.globalData.display,
    containerHeight: app.globalData.screenHeight - app.globalData.navHeight,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      set: false,
      animated: false,
      showRSSI: false
    }, // 导航栏
    anMoModeIndex: true,
    dengGuangModeIndex: false,
    alarmModeIndex: false,
    modeItems: [{
      value: 'lingyali',
      name: '零压力',
    },
    {
      value: 'jiyi1',
      name: '记忆一',
    },
    {
      value: 'close',
      name: '不动作',
    },
    ],
    dialogShow: false,
    alarm: { // 闹钟设置
      isOpenAlarm: false, // 闹钟开关
      time: '',
      repeat: false,
      periodDesc: '',
      period: [],
      remark: '',
      modeVal: 'close',
      modeName: '不动作',
      anmo: false,
      ring: false
    },
    periodDialogShow: false, // 周期选择对话框
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
    remarkInputValue: '',
    modeDialogShow: false,
    mode2DialogShow: false,
    modeSelectRadio: '',
    isMode2: false, // 是否是模式2
    tempLeftLingyaliChecked: false,
    tempRightLingyaliChecked: false,
    leftLingyaliChecked: false,
    rightLingyaliChecked: false,
    //按摩相关
    currentTimeSelected: '',
    anmopinglv: 0, // 0,1,2,3,4
    toubu: 0, //0,1,2,3
    tuibu: 0, //0,1,2,3
    //灯光相关
    currentDengguangSelected: '',
    isLightShow: false,
    lineItems: [], //灯光亮度
    isFirstAlarm: false,//是否首次设置闹钟
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let isFirstAlarm = options.isFirstAlarm
    let connected = configManager.getCurrentConnected();
    let isMode2 = false;
    let alarmModeIndex = false
    let anMoModeIndex = true
    let isAudio = configManager.getAlarmAudio(connected.deviceId)
    if (isAudio) {
      isMode2 = true;
    } else {
      isMode2 = false;
    }
    if (isFirstAlarm) {
      anMoModeIndex = false
      alarmModeIndex = true
    }
    this.setData({
      skin: app.globalData.skin,
      connected: connected,
      isMode2: isMode2,
      isFirstAlarm: isFirstAlarm,
      alarmModeIndex: alarmModeIndex,
      anMoModeIndex:anMoModeIndex
    })
    if (util.isNotEmptyObject(connected)) {
      // 如果缓存中有设置缓存回显
      let alarm = configManager.getAlarm(connected.deviceId);
      if (util.isNotEmptyObject(alarm)) {
        let periodList = this.data.periodList;
        if (alarm.period.length > 0) {
          periodList.forEach(item => {
            if (alarm.period.indexOf(item.id) >= 0) {
              item.checked = true;
            }
          })
        }
        this.setData({
          alarm: alarm,
          periodList: periodList
        });

      }
    }

    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);

    // 获取灯光状态指令 旧版本指令：sendBlueCmd("FF FF FF FF 05 00 05 FF 23 C7 28");
    var cmd = "FFFFFFFF01001C1402000000000000000000";
    cmd = cmd + crcUtil.HexToCSU16(cmd);
    this.sendFullBlueCmd(cmd);
    setTimeout(() => {
      // 获取按摩状态指令
      var cmd = "FFFFFFFF01001C1404000000000000000000";
      cmd = cmd + crcUtil.HexToCSU16(cmd);
      this.sendFullBlueCmd(cmd);
    }, 300)
    setTimeout(() => {
      // 发送闹钟指令
      this.sendRequestAlarmCmd();
    }, 500)
  },


  /**
 * 生命周期函数--监听页面卸载
 */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },

  //选择需要打开的模块
  selectModeTap(e) {
    var mode = e.currentTarget.dataset.index;
    var that = this
    switch (mode) {
      case 'anmo':
        var anMoModeIndex = !that.data.anMoModeIndex
        that.setData({
          anMoModeIndex: anMoModeIndex
        })
        break
      case 'dengguang':
        var dengGuangModeIndex = !that.data.dengGuangModeIndex
        that.setData({
          dengGuangModeIndex: dengGuangModeIndex
        })
        break
      case 'alarm':
        var alarmModeIndex = !that.data.alarmModeIndex
        that.setData({
          alarmModeIndex: alarmModeIndex
        })
        break
    }
  },

  /**
   * 初始化发送时间校验闹钟请求
   */
  sendRequestAlarmCmd: function () {
    let cmdPrefix = 'FFFFFFFF01000111';
    let date = time.getDateInfo(new Date());
    let cmdTime = date.hour + date.minute + date.second + date.week + date.year + date.month + date.day;
    let cmdCrc = crcUtil.HexToCSU16(cmdPrefix + cmdTime);
    let cmd = cmdPrefix + cmdTime + cmdCrc;
    console.log('sendRequestAlarmCmd:', cmd);

    this.sendFullBlueCmd(cmd)
  },

  /**
   * 闹钟开关
   * @param {}} e 
   */
  alarmSwitch: function (e) {
    var openAlarm = this.data.alarm.isOpenAlarm;
    this.setData({
      ['alarm.isOpenAlarm']: !openAlarm
    })
  },

  repeatSwitch: function (e) {
    var repeat = this.data.alarm.repeat;
    this.setData({
      ['alarm.repeat']: !repeat
    })
  },

  /**
   * 时间选择
   * @param {}} e 
   */
  bindTimeChange: function (e) {
    this.setData({
      ['alarm.time']: e.detail.value
    })
  },

  /**
   * 周期选择
   * @param {}} e 
   */
  periodTap: function (e) {
    this.setData({
      periodDialogShow: true
    })
  },

  periodItemSelect: function (e) {
    let index = e.currentTarget.dataset.index;
    let newli = 'periodList[' + index + '].checked';
    this.setData({
      [newli]: !this.data.periodList[index].checked
    })
  },

  /**
   * 周期对话框操作按钮
   * @param {*} e 
   */
  onModalPeriodClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        periodDialogShow: false
      })
      return;
    }
    let periodDesc = '';
    let period = [];
    let i = 0;
    this.data.periodList.forEach(item => {
      if (item.checked) {
        period.push(item.id);
        i++;
      }
    });
    if (period.length > 0) {
      period.forEach(j => {
        periodDesc += weekArray[j - 1];
      });
    } else {
      periodDesc = '不重复';
    }
    console.log('onModalPeriodClick period=' + period + ' periodDesc=' + periodDesc);
    this.setData({
      periodDialogShow: false,
      ['alarm.period']: period,
      ['alarm.periodDesc']: periodDesc,
    })

  },

  /**
   * 模式
   * @param {*} e 
   */
  modeTap: function (e) {
    let isMode2 = this.data.isMode2;
    if (isMode2) {
      let leftLingyaliChecked = this.data.leftLingyaliChecked;
      let rightLingyaliChecked = this.data.rightLingyaliChecked;
      let modeVal = this.data.alarm.modeVal;
      if (modeVal == 'lingyaliALL') {
        leftLingyaliChecked = true;
        rightLingyaliChecked = true;
      } else if (modeVal == 'lingyaliLeft') {
        leftLingyaliChecked = true;
        rightLingyaliChecked = false;
      } else if (modeVal == 'lingyaliRight') {
        leftLingyaliChecked = false;
        rightLingyaliChecked = true;
      }

      this.setData({
        mode2DialogShow: true,
        tempLeftLingyaliChecked: leftLingyaliChecked,
        tempRightLingyaliChecked: rightLingyaliChecked
      });
    } else {
      this.setData({
        modeDialogShow: true
      });
    }
  },

  /**
   * 模式选择
   * @param {*} e 
   */
  modeRadioChange: function (e) {
    this.setData({
      modeSelectRadio: e.detail.value
    })
  },

  /**
   * 模式选择点击
   * @param {*} e 
   */
  onModalModeClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        modeDialogShow: false
      })
      return;
    }
    let modeSelectRadio = this.data.modeSelectRadio;
    let modeSelectName;
    this.data.modeItems.forEach(obj => {
      if (modeSelectRadio == obj.value) {
        modeSelectName = obj.name;
      }
    });
    this.setData({
      modeDialogShow: false,
      ['alarm.modeVal']: modeSelectRadio,
      ['alarm.modeName']: modeSelectName,
    })
  },


  /**
   * 模式2的零压力
   * @param {*} e 
   */
  mode2LingyaliCheck: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'left') {
      let tempLeftLingyaliChecked = this.data.tempLeftLingyaliChecked;
      this.setData({
        tempLeftLingyaliChecked: !tempLeftLingyaliChecked
      })
    } else if (cType == 'right') {
      let tempRightLingyaliChecked = this.data.tempRightLingyaliChecked;
      this.setData({
        tempRightLingyaliChecked: !tempRightLingyaliChecked
      })
    }

  },

  onModal2ModeClick: function (e) {
    let cType = e.currentTarget.dataset.ctype;
    if (cType == 'cancel') {
      this.setData({
        mode2DialogShow: false
      })
      return;
    }
    let modeVal = this.data.alarm.modeVal;
    let modeName = this.data.alarm.modeName;
    if (this.data.tempLeftLingyaliChecked && this.data.tempRightLingyaliChecked) {
      modeVal = 'lingyaliALL'
      modeName = '零压力';
    } else if (this.data.tempLeftLingyaliChecked && !this.data.tempRightLingyaliChecked) {
      modeVal = 'lingyaliLeft'
      modeName = '左侧零压力';
    } else if (!this.data.tempLeftLingyaliChecked && this.data.tempRightLingyaliChecked) {
      modeVal = 'lingyaliRight'
      modeName = '右侧零压力';
    } else {
      modeVal = 'close'
      modeName = '不动作';
    }
    this.setData({
      mode2DialogShow: false,
      leftLingyaliChecked: this.data.tempLeftLingyaliChecked,
      rightLingyaliChecked: this.data.tempRightLingyaliChecked,
      ['alarm.modeVal']: modeVal,
      ['alarm.modeName']: modeName,
    })
  },

  /**
   * 按摩选择
   * @param {*} e 
   */
  anmoSwitch: function (e) {
    this.setData({
      ['alarm.anmo']: !this.data.alarm.anmo
    })
  },

  /**
   * 响铃选择
   * @param {*} e 
   */
  ringSwitch: function (e) {
    this.setData({
      ['alarm.ring']: !this.data.alarm.ring
    })
  },


  /**
   * 保存闹钟操作
   * @param {*} e 
   */
  saveAlarmTap: function (e) {
    let connected = this.data.connected;

    let alarm = this.data.alarm;
    let openAlarm = false
    if (this.data.isFirstAlarm) {
      openAlarm = true
    } else {
      openAlarm = alarm.isOpenAlarm;
    }

    let time = alarm.time;

    if (openAlarm) {
      if (!util.isNotEmptyStr(time)) {
        util.showToast('请选择时间');
        return;
      }
    }

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
    console.log('saveTap->', cmd);
    this.sendFullBlueCmd(cmd);

    configManager.putAlarm(this.data.alarm, connected.deviceId);

  },


  //按摩设置相关
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

  //按摩保存
  saveAnmoTap() {
    let cmdAnmo = "FFFFFFFF01001C1401000000000000000000";
    this.sendFullBlueCmd(cmdAnmo + crcUtil.HexToCSU16(cmdAnmo));
  },


  //灯光设置相关
  dengguangClick(e) {
    var that = this;
    var currentDengguangSelected = this.data.currentDengguangSelected;
    var time = e.currentTarget.dataset.time;
    console.info('click->' + time);

    var cmd = '';
    if (time == '10min') {
      cmd = '001916CA';
    } else if (time == '8h') {
      cmd = '001A56CB';
    } else if (time == '10h') {
      cmd = '001B970B';
    }
    this.sendBlueCmd(cmd, ({
      success: (res) => {
        if (time == currentDengguangSelected) {
          that.setData({
            currentDengguangSelected: ''
          })
        } else {
          that.setData({
            currentDengguangSelected: time
          })
        }
      },
      fail: (res) => {

      }
    }));
  },

  /**
   * 亮度减小
   * @param {*} e 
   */
  tapDengguangMinus(e) {
    let lineItems = this.data.lineItems;
    if (lineItems.length == 0) {
      util.showToast('当前亮度已经调整到最小');
      return;
    }
    lineItems.splice(lineItems.length - 1, 1);
    this.sendDengguangLevelCmd(lineItems.length);
    this.setData({
      lineItems: lineItems
    })
  },

  /**
   * 亮度增加
   * @param {*} e 
   */
  tapDengguangPlus(e) {
    let lineItems = this.data.lineItems;
    if (lineItems.length == 10) {
      util.showToast('当前亮度已经调整到最大');
      return;
    }
    lineItems.push(1);
    this.sendDengguangLevelCmd(lineItems.length);
    this.setData({
      lineItems: lineItems
    })
  },

  sendDengguangLevelCmd(level) {
    let cmd = sendPrefix;
    switch (level) {
      case 0:
        cmd += '002396D9';
        break;
      case 1:
        cmd += '01239749';
        break;
      case 2:
        cmd += '022397B9';
        break;
      case 3:
        cmd += '03239629';
        break;
      case 4:
        cmd += '04239419';
        break;
      case 5:
        cmd += '05239589';
        break;
      case 6:
        cmd += '06239579';
        break;
      case 7:
        cmd += '072394E9';
        break;
      case 8:
        cmd += '08239119';
        break;
      case 9:
        cmd += '09239089';
        break;
      case 10:
        cmd += 'A0239079';
        break;
    }
    util.sendBlueCmd(this.data.connected, cmd)
  },


  //保存灯光
  saveDengGuangTap() {
    let cmdAnmo = "FFFFFFFF01001C1403000000000000000000";
    this.sendFullBlueCmd(cmdAnmo + crcUtil.HexToCSU16(cmdAnmo));
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
    console.error('diandongset->blueReply', cmd);
    cmd = cmd.toUpperCase();

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
    if (cmd.indexOf('FFFFFFFF050001') > -1) {//设置灯光
      var lineItems = that.data.lineItems;
      var prefix = cmd.substr(0, 14).toUpperCase();

      that.setData({
        isLightShow: true,
      })

      var level = cmd.substr(14, 2).toUpperCase();
      console.info('dengguang->blueReply 收到的蓝牙回复', cmd, level);
      if ('01' == level) {
        lineItems = [1];
      } else if ('02' == level) {
        lineItems = [1, 1];
      } else if ('03' == level) {
        lineItems = [1, 1, 1];
      } else if ('04' == level) {
        lineItems = [1, 1, 1, 1];
      } else if ('05' == level) {
        lineItems = [1, 1, 1, 1, 1];
      } else if ('06' == level) {
        lineItems = [1, 1, 1, 1, 1, 1];
      } else if ('07' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1];
      } else if ('08' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1, 1];
      } else if ('09' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1, 1, 1];
      } else if ('0A' == level) {
        lineItems = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      } else if ('00' == level) {
        lineItems = [];
        that.setData({
          currentDengguangSelected: ''
        })
      }
      that.setData({
        lineItems: lineItems
      })
    }


    if (cmd.indexOf("FFFFFFFF01001C1402") > -1) {//查询灯光状态回码
      var dgLevel = cmd.substr(20, 2);//灯光亮度
      var dengguang = util.str16To10(dgLevel)
      var lineItems = []
      for (var i = 0; i++; i < dengguang) {
        lineItems.push(1)
      }
      console.log("dengguang", dengguang)
      console.log("lineItems", lineItems)

      var dgTime = cmd.substr(22, 2);//灯光时间
      var currentDengguangSelected = ''
      if (dgTime == "00") {//关闭状态
        currentDengguangSelected = ''
      } else if (TextUtils.equals(dgTime, "01")) {
        currentDengguangSelected = '10min'
      } else if (TextUtils.equals(dgTime, "02")) {
        currentDengguangSelected = '8h'
      } else if (TextUtils.equals(dgTime, "03")) {
        currentDengguangSelected = '10h'
      }

      this.setData({
        lineItems: lineItems,
        currentDengguangSelected: currentDengguangSelected
      })

    } else if (cmd.indexOf("FFFFFFFF01001C1404") > -1) {//查询按摩状态回码

      let toubuLevel = cmd.substr(18, 2);//头部按摩
      var toubu = util.str16To10(toubuLevel)

      let tuibuLevel = cmd.substr(20, 2);//腿部按摩
      var tuibu = util.str16To10(tuibuLevel)

      let pinlvLevel = cmd.substr(22, 2);//按摩频率
      var anmopinglv = util.str16To10(pinlvLevel)

      let anmoTime = cmd.substr(24, 2);//按摩时长
      var currentTimeSelected = ''
      if (TanmoTime == "00") {
        currentTimeSelected == '10min'
      } else if (TextUtils.equals(anmoTime, "01")) {
        currentTimeSelected == '20min'
      } else if (TextUtils.equals(anmoTime, "02")) {
        currentTimeSelected == '30min'
      }
      this.setData({
        toubu: toubu,
        tuibu: tuibu,
        anmopinglv: anmopinglv,
        currentTimeSelected: currentTimeSelected
      })
    } else if (cmd.indexOf("FFFFFFFF01001C1401") > -1) {//设置按摩状态回码
      wx.showToast({
        title: '按摩设置成功!',
      })
    } else if (cmd.indexOf("FFFFFFFF01001C1403") > -1) {//设置灯光状态回码
      wx.showToast({
        title: '灯光设置成功!',
      })
    } else if (cmd.indexOf('FFFFFFFF0100030B00') >= 0 || cmd.indexOf('FFFFFFFF01000413') >= 0) {
      // 有闹钟功能
      let deviceId = this.data.connected.deviceId;
      this.setAlarm(cmd, deviceId);
    }
  },

  /**
   * 有闹钟功能
   * @param {*} cmd 
   * @param {*} deviceId 
   */
  setAlarm: function (cmd, deviceId) {
    console.error('diandongset->setAlarm-->开启闹钟设置', cmd, deviceId);
    let alarm = {};
    if (cmd.indexOf('FFFFFFFF0100030B00') >= 0) {
      // 有闹钟未设置
      let isAudio = cmd.substr(16, 2);//是否有音响
      if (isAudio == "00") {
        configManager.putAlarmAudio(false, deviceId)
      } else {
        configManager.putAlarmAudio(true, deviceId)
      }

      configManager.putAlarmSwitch(true, deviceId);
      alarm.isOpenAlarm = false;
      configManager.putAlarm(alarm, deviceId);
    } else if (cmd.indexOf('FFFFFFFF01000413') >= 0) {
      // 有闹钟已设置
      let isAudio = cmd.substr(16, 2);//是否有音响
      if (isAudio == "0F") {
        configManager.putAlarmAudio(false, deviceId)
      } else {
        configManager.putAlarmAudio(true, deviceId)
      }
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
    }
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
      // console.info('main->onBLECharacteristicValueChange', res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received', received);
      that.blueReply(received, connected);
    });
  },

})