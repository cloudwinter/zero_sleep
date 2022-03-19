// pages/report/report.js
const util = require('../../utils/util');
const time = require('../../utils/time');
const crcUtil = require('../../utils/crcUtil');
const configManager = require('../../utils/configManager')
const WxNotificationCenter = require('../../utils/WxNotificationCenter');
const wxCharts = require('../../utils/wxcharts.js');
const app = getApp();
const preCMD = 'FFFFFFFF050000';

var lineChart = null;

var preCategories = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
var middleCategories = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'];
var nextCategories = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];

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
    pageType: '0', // 0 表示实时在床数据，1表示睡眠日报告
    UV: '00',
    OZ: '00',
    selectedDate: '',
    pageData: {
      navTitle: '实时在床数据', // 顶部标题
      dataTitle: '实时在床数据', // 数据标题
      graphTitle: '', // 曲线标题
    },
    unit: '分钟',
    timeShuimian: '489',
    timePingtang: '489',
    timeCetang: '489',
    timeFanshen: '489',
    graphData: [],
    preData: [],
    middleData: [],
    nextData: [],
    graphHidden: true,
    preDisable: true,
    nextDisable: true,
    currentGraphType: 'middle' // 当前曲线类型

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let pageType = options.pageType;
    console.log('pageType:' + pageType);
    let connected = configManager.getCurrentConnected();
    let date = time.getDateInfo(new Date(new Date().getTime() - 24 * 60 * 60 * 1000));
    let preDay = date.day;
    let UV = this.data.UV;
    let OZ = this.data.OZ;
    let graphHidden = this.data.graphData;
    let selectedDate = this.data.selectedDate;
    let pageData = {};
    let unit;
    if (pageType == 1) {
      UV = options.UV;
      OZ = options.OZ;
      graphHidden = true;
      selectedDate = options.selectedDate;
      pageData.navTitle = '日睡眠报告';
      pageData.dataTitle = selectedDate.substr(0, 4) + '年' + selectedDate.substr(5, 2) + '月' + selectedDate.substr(8, 2) + '日睡眠报告';
      pageData.graphTitle = '';
      unit = '小时';
    } else {
      graphHidden = false;
      pageData.navTitle = '实时在床数据';
      pageData.dataTitle = '实时在床数据';
      pageData.graphTitle = '20' + date.year + '年' + date.month + '月' + preDay + '日翻身统计';
      unit = '分钟';
    }
    this.setData({
      skin: app.globalData.skin,
      connected: connected,
      pageData: pageData,
      pageType: pageType,
      unit: unit,
      UV: UV,
      OZ: OZ,
      graphHidden: graphHidden,
      selectedDate: selectedDate
    })
    this.setCategories();
    this.onLoadlineChart();
    WxNotificationCenter.addNotification("BLUEREPLY", this.blueReply, this);
    this.sendInitCmd();
  },


  /**
   * 设置曲线底部
   */
  setCategories() {
    let OZ = this.data.OZ;
    let middleCate = [];
    if (OZ == '00') {
      middleCate = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'];
    } else if (OZ == '01') {
      middleCate = ['21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'];
    } else if (OZ == '02') {
      middleCate = ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00'];
    } else if (OZ == '03') {
      middleCate = ['23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00'];
    } else if (OZ == '04') {
      middleCate = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
    }
    middleCategories = middleCate;
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
    if (pageType == 1) {
      // 日报告
      let UV = this.data.UV;
      cmd = 'FFFFFFFF0200130B' + UV
      end = crcUtil.HexToCSU16(cmd);
    } else {
      // 实时在床数据
      cmd = 'FFFFFFFF0200030B01'
      end = crcUtil.HexToCSU16(cmd);
    }
    // 发送蓝牙询问命令


    // TEST
    // let that = this;
    // setTimeout(function(){
    //   let cmd = 'FF FF FF FF 02 00 05 14 01 20 20 40 0C 0D 0E 0F 10 11 EE 04'.replace(/\s*/g,"");
    //   that.blueReply(cmd);
    // },1000)
    // setTimeout(function(){
    //   let cmd = 'FF FF FF FF 02 00 05 14 02 12 13 14 15 16 17 00 01 02 96 04'.replace(/\s*/g,"");
    //   that.blueReply(cmd);
    // },2000)
    // setTimeout(function(){
    //   let cmd = 'FF FF FF FF 02 00 05 14 03 03 04 05 06 07 08 09 0A 0B 58 04'.replace(/\s*/g,"");
    //   that.blueReply(cmd);
    // },3000)

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
    var askType = cmd.substr(12, 2);
    if (!(askType == '04' || askType == '05' || askType == '14')) {
      console.error('report->askBack 返回码非当日或实时返回码', cmd);
      return;
    }
    var frameNo = cmd.substr(16, 2);
    if (frameNo == '01' || frameNo == '06' || frameNo == '3C') {
      // TODO 时间和测试超过限制处理
      let pingtangTime;
      let cetangTime;
      let unit = this.data.unit;
      let pageType = this.data.pageType;
      if (pageType == 1) {
        // 单位6分钟计1个单位
        pingtangTime = (util.str16To10(cmd.substr(18, 2)) * 0.1).toFixed(1);
        cetangTime = (util.str16To10(cmd.substr(20, 2)) * 0.1).toFixed(1);
      } else {
        if (frameNo == '01') {
          pingtangTime = util.str16To10(cmd.substr(18, 2));
          cetangTime = util.str16To10(cmd.substr(20, 2));
          unit = '分钟';
        } else if (frameNo == '06') {
          pingtangTime = (util.str16To10(cmd.substr(18, 2)) * 0.1).toFixed(1);
          cetangTime = (util.str16To10(cmd.substr(20, 2)) * 0.1).toFixed(1);
          unit = '小时';
        } else if (frameNo == '3C') {
          pingtangTime = util.str16To10(cmd.substr(18, 2));
          cetangTime = util.str16To10(cmd.substr(20, 2));
          unit = '小时';
        }
      }

      let shuimianTime = (parseFloat(pingtangTime) + parseFloat(cetangTime)).toFixed(1);
      // 获取翻身次数
      let fanshenNum = util.str16To10(cmd.substr(22, 2));
      this.setData({
        unit: unit,
        timeShuimian: shuimianTime,
        timePingtang: pingtangTime,
        timeCetang: cetangTime,
        timeFanshen: fanshenNum
      })
      let data = [];
      let time1200 = util.str16To10(cmd.substr(24, 2));
      data.push(time1200);
      let time1300 = util.str16To10(cmd.substr(26, 2));
      data.push(time1300);
      let time1400 = util.str16To10(cmd.substr(28, 2));
      data.push(time1400);
      let time1500 = util.str16To10(cmd.substr(30, 2));
      data.push(time1500);
      let time1600 = util.str16To10(cmd.substr(32, 2));
      data.push(time1600);
      let time1700 = util.str16To10(cmd.substr(34, 2));
      data.push(time1700);
      this.setData({
        timeShuimian: shuimianTime,
        timePingtang: pingtangTime,
        timeCetang: cetangTime,
        timeFanshen: fanshenNum,
        graphData: data
      })

    } else if (frameNo == '02') {
      let data = this.data.graphData;
      let time1800 = util.str16To10(cmd.substr(18, 2));
      data.push(time1800);
      let time1900 = util.str16To10(cmd.substr(20, 2));
      data.push(time1900);
      let time2000 = util.str16To10(cmd.substr(22, 2));
      data.push(time2000);
      let time2100 = util.str16To10(cmd.substr(24, 2));
      data.push(time2100);
      let time2200 = util.str16To10(cmd.substr(26, 2));
      data.push(time2200);
      let time2300 = util.str16To10(cmd.substr(28, 2));
      data.push(time2300);
      let time0000 = util.str16To10(cmd.substr(30, 2));
      data.push(time0000);
      let time0100 = util.str16To10(cmd.substr(32, 2));
      data.push(time0100);
      let time0200 = util.str16To10(cmd.substr(34, 2));
      data.push(time0200);
      this.setData({
        graphData: data
      })
    } else if (frameNo == '03') {
      let data = this.data.graphData;
      let time0300 = util.str16To10(cmd.substr(18, 2));
      data.push(time0300);
      let time0400 = util.str16To10(cmd.substr(20, 2));
      data.push(time0400);
      let time0500 = util.str16To10(cmd.substr(22, 2));
      data.push(time0500);
      let time0600 = util.str16To10(cmd.substr(24, 2));
      data.push(time0600);
      let time0700 = util.str16To10(cmd.substr(26, 2));
      data.push(time0700);
      let time0800 = util.str16To10(cmd.substr(28, 2));
      data.push(time0800);
      let time0900 = util.str16To10(cmd.substr(30, 2));
      data.push(time0900);
      let time1000 = util.str16To10(cmd.substr(32, 2));
      data.push(time1000);
      let time1100 = util.str16To10(cmd.substr(34, 2));
      data.push(time1100);

      // 分割数据
      this.splitDataByTime(data);
    }
  },

  /**
   * 将数据分割为三分,设置前后可点击
   * 1、12:00~00:00
   * 2、20:00~08:00
   * 3、00:00~12:00
   * @param {*} data 
   */
  splitDataByTime: function (data) {
    let preData = [];
    let middleData = [];
    let nextData = [];
    let pageType = this.data.pageType;
    if (pageType == 1) {
      // 日报告
      let OZ = this.data.OZ;
      let prei = 7;
      let endi = 20;
      if (OZ == '00') {
        prei = 7;
        endi = 20;
      } else if (OZ == '01') {
        prei = 8;
        endi = 21;
      } else if (OZ == '02') {
        prei = 9;
        endi = 22;
      } else if (OZ == '03') {
        prei = 10;
        endi = 23;
      } else if (OZ == '04') {
        prei = 10;
        endi = 24;
      }
      for (let i = 0; i < data.length; i++) {
        if (i > prei && i < endi) {
          middleData.push(data[i]);
        }
      }
      this.setData({
        graphData: data,
        preData: preData,
        middleData: middleData,
        nextData: nextData,
        graphHidden: true,
        currentGraphType: 'middle'
      })
    } else {
      for (let i = 0; i < data.length; i++) {
        if (i < 12) {
          preData.push(data[i]);
        }
        if (i > 7 && i < 20) {
          middleData.push(data[i]);
        }
        if (i > 11) {
          nextData.push(data[i]);
        }
      }
      this.setData({
        graphData: data,
        preData: preData,
        middleData: middleData,
        nextData: nextData,
        preDisable: false,
        nextDisable: false,
        currentGraphType: 'middle'
      })
      console.info('blueReply 曲线对象：', data);
    }
    this.updateData(this.data.middleData, middleCategories);
  },


  /**
   * 加载曲线图
   */
  onLoadlineChart: function () {
    let width = app.globalData.screenWidth;
    console.info('onLoadlineChart->width', width);
    var simulationData = this.createSimulationData();
    lineChart = new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      categories: simulationData.categories,
      animation: true,
      background: '#1E1F24',
      series: [{
        name: '翻身（次数）',
        data: simulationData.data,
        color: '#5EA2D7',
        format: function (val, name) {
          return val + '次';
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        min: 0,
        max: 25
      },
      width: width,
      height: 250,
      dataLabel: false,
      dataPointShape: true,
      legend: false,
      extra: {
        lineStyle: 'curve'
      }
    });
  },



  /**
   * 初始化曲线图数据
   */
  createSimulationData: function () {
    // 初始化测试数据
    var data = [10, 11, 15, 12, 17, 23, 18, 19, 22, 21, 20, 15]
    return {
      categories: middleCategories,
      data: data
    }
  },


  /**
   * 更新图标
   * @param {*}} data Y轴数据数组
   * @param {*} categories X轴数据数组
   */
  updateData: function (data, categories) {
    var series = [{
      name: '翻身（次数）',
      data: data,
      format: function (val, name) {
        return val + '次';
      }
    }];
    lineChart.updateData({
      categories: categories,
      series: series
    });
  },


  touchHandler: function (e) {
    lineChart.showToolTip(e, {
      // background: '#7cb5ec',
      format: function (item, category) {
        console.log('touchHandler', category, item.name, item.data);
        return item.name + '：' + item.data
      }
    });
  },

  /**
   * 前一个图形曲线
   * @param {*} e 
   */
  pre: function (e) {
    let currentGraphType = this.data.currentGraphType;
    let categories;
    let data;
    let preDisable;
    let nextDisable;
    if (currentGraphType == 'pre') {
      util.showModal('当前已经是最前面了');
      return;
    } else if (currentGraphType == 'middle') {
      categories = preCategories;
      data = this.data.preData;
      preDisable = true;
      nextDisable = false;
      currentGraphType = 'pre';
    } else if (currentGraphType == 'next') {
      categories = middleCategories;
      data = this.data.middleData;
      preDisable = false;
      nextDisable = false;
      currentGraphType = 'middle';
    }
    this.setData({
      currentGraphType: currentGraphType,
      preDisable: preDisable,
      nextDisable: nextDisable,
    })
    this.updateData(data, categories);
  },

  /**
   * 后一个图形曲线
   * @param {*} e 
   */
  next: function (e) {
    let currentGraphType = this.data.currentGraphType;
    let categories;
    let data;
    let preDisable;
    let nextDisable;
    if (currentGraphType == 'next') {
      util.showModal('当前已经是最后面了');
      return;
    } else if (currentGraphType == 'middle') {
      categories = nextCategories;
      data = this.data.nextData;
      preDisable = false;
      nextDisable = true;
      currentGraphType = 'next';
    } else if (currentGraphType == 'pre') {
      categories = middleCategories;
      data = this.data.middleData;
      preDisable = false;
      nextDisable = false;
      currentGraphType = 'middle';
    }
    this.setData({
      currentGraphType: currentGraphType,
      preDisable: preDisable,
      nextDisable: nextDisable,
    })
    this.updateData(data, categories);
  }


})