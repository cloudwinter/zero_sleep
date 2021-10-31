// pages/wmreport/wmreport.js
const util = require('../../utils/util');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter')
const app = getApp();
const preCMD = 'FFFFFFFF050000';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    connected: {}, // 当前连接的设备
    skin: app.globalData.skin,
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    },
    pageType: 'week', // 页面类型 week,month
    pageData: {
      navTitle: '周睡眠报告', // 顶部标题
      dataTitle: '最近7天睡眠数据统计', // 数据标题
    },
    zaichuang: {
      pingjunTime: 171,
      maxTime: 171,
      minTime: 171
    },
    fansheng: {
      pingjunNum: 171,
      maxNum: 171,
      minNum: 171
    },
    pingcetang: {
      pingTime: 171,
      ceTime: 171
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let pageType = options.pageType;
    let pageData = this.data.pageData;
    if (pageType == 'month') {
      pageData.navTitle = '月睡眠报告';
      pageData.dataTitle = '最近30天睡眠统计'
    }
    let connected = configManager.getCurrentConnected();
    this.setData({
      skin: app.globalData.skin,
      connected: connected,
      pageData: pageData,
      pageType: pageType
    })

    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    this.sendInitCmd();
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },



  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    WxNotificationCenter.removeNotification("BLUEREPLY", this);
  },

  /**
   * 发送初始化命令
   */
  sendInitCmd() {
    let pageType = this.data.pageType;
    let cmd = '';
    let end = '';
    if (pageType == 'month') {
      // 月报告
      cmd = 'FFFFFFFF0200030B1E'
      end = crcUtil.HexToCSU16(cmd);

    } else {
      // 周报告
      cmd = 'FFFFFFFF0200030B07'
      end = crcUtil.HexToCSU16(cmd);
    }

    // TEST
    // let that = this;
    // setTimeout(function () {
    //   let cmd = 'FF FF FF FF 02 00 07 13 05 4A 51 3B AA BC 85 55 55 98 07'.replace(/\s*/g, "");
    //   that.blueReply(cmd);
    // }, 1000)

    // 发送蓝牙询问命令
    util.sendBlueCmd(this.data.connected, cmd + end);
  },

  /**
   * 蓝牙回复回调
   * @param {*} cmd 
   */
  blueReply(cmd) {
    cmd = cmd.toUpperCase();
    var prefix = cmd.substr(0, 12);
    console.info('report->askBack', cmd, prefix);
    // 压力带蓝牙回复实时数据或者实时在床数据 ，会回复三次帧数据
    if (prefix != 'FFFFFFFF0200') {
      return;
    }
    var pageData = this.data.pageData;
    var flag = cmd.substr(12, 2);
    if (flag == '06' || flag == '07') {

      let days = util.str16To10(cmd.substr(16, 2));
      pageData.dataTitle = '最近' + days + '天睡眠统计';

      // 时间单位是6
      let pjsmTime = (util.str16To10(cmd.substr(18, 2)) * 0.1).toFixed(1);
      let maxsmTime = (util.str16To10(cmd.substr(20, 2)) * 0.1).toFixed(1);
      let minsmTime = (util.str16To10(cmd.substr(22, 2)) * 0.1).toFixed(1);
      let zaichuang = {
        pingjunTime: pjsmTime,
        maxTime: maxsmTime,
        minTime: minsmTime
      }

      let pjfsNum = util.str16To10(cmd.substr(24, 2));
      let maxfsNum = util.str16To10(cmd.substr(26, 2));
      let minfsNum = util.str16To10(cmd.substr(28, 2));
      let fansheng = {
        pingjunNum: pjfsNum,
        maxNum: maxfsNum,
        minNum: minfsNum
      }

      let ptTime = (util.str16To10(cmd.substr(30, 2)) * 0.1).toFixed(1);
      let ctTime = (util.str16To10(cmd.substr(32, 2)) * 0.1).toFixed(1);
      let pingcetang = {
        pingTime: ptTime,
        ceTime: ctTime
      }

      this.setData({
        zaichuang: zaichuang,
        fansheng: fansheng,
        pingcetang: pingcetang,
        pageData: pageData
      })
    }
  },






})