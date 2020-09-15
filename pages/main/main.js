const configManager = require('../../utils/configManager')
const util = require('../../utils/util')
const WxNotificationCenter = require('../../utils/WxNotificationCenter')
const app = getApp();

Page({
  data: {
    skin:app.globalData.skin,
    navbar:{
      loading: false,
      color: '#FFFFFF',
      show: true,
      animated: false,
    },
    nowPage: "kuaijie",
    nowIndex: 0,
    tabBar: [{
        "selectedIconPath": "../../images/"+app.globalData.skin+"/tab_kuaijie_selected@2x.png",
        "iconPath": "../../images/"+app.globalData.skin+"/tab_kuaijie_normal@2x.png",
        "text": "快捷",
        "tapFunction": "toKuaijie",
        "active": "active"
      },
      {
        "selectedIconPath": "../../images/"+app.globalData.skin+"/tab_weitiao_selected@2x.png",
        "iconPath": "../../images/"+app.globalData.skin+"/tab_weitiao_normal@2x.png",
        "text": "微调",
        "tapFunction": "toWeitiao",
        "active": ""
      },
      {
        "selectedIconPath": "../../images/"+app.globalData.skin+"/tab_anno_selected@2x.png",
        "iconPath": "../../images/"+app.globalData.skin+"/tab_anno_normal@2x.png",
        "text": "按摩",
        "tapFunction": "toAnmo",
        "active": "active"
      },
      {
        "selectedIconPath": "../../images/"+app.globalData.skin+"/tab_dengguang_selected@2x.png",
        "iconPath": "../../images/"+app.globalData.skin+"/tab_dengguang_normal@2x.png",
        "text": "灯光",
        "tapFunction": "toDengguang",
        "active": ""
      }
    ],
    kuaijieType:'',
    weitiaoType:'',
    connected:{},
  },

  /**
   * 初始化加载
   */
  onLoad: function (option) {
    console.info('main.Onshow');
    if(option && option.connected){
      console.info("main.onLoad option",option);
      var connected = JSON.parse(option.connected);
      console.info("main->onLoad connected:",connected);
      this.setData({
        connected:connected,
        kuaijieType:option.kuaijieType,
        weitiaoType:option.weitiaoType
      })
      this.notifyBLECharacteristicValueChange();
      //this.getBLService(connected.deviceId);
    }
  },

  /**
   * 显示时触发
   */
  onShow:function() {
    // 获取皮肤
    console.info('main.Onshow');
    var skin = app.globalData.skin;
    this.setData({
      skin:skin
    })

    //WxNotificationCenter.postNotificationName('INIT',this.data.connected);
  },


  /******------>tab切换 start */
  
  toKuaijie() {
    this.setData({
      nowPage: "kuaijie",
      nowIndex: 0
    })
  },
  toWeitiao() {
    this.setData({
      nowPage: "weitiao",
      nowIndex: 1
    })
  },
  toAnmo() {
    this.setData({
      nowPage: "anmo",
      nowIndex: 2
    })
  },
  toDengguang() {
    this.setData({
      nowPage: "dengguang",
      nowIndex: 3
    })
  },

  /******------>tab切换 end */


  /*******-------------->蓝牙回调 start */



    /**
     * 获取连接设备的service服务
     */
    getBLService(deviceId) {
      var that = this;
      wx.getBLEDeviceServices({
        deviceId: deviceId,
        success: function (res) {
          console.log('device services:', JSON.stringify(res.services));
          var services = res.services;
          if (services && services.length > 0) {
            for (let i = 0; i < services.length; i++) {
              if (services[i].isPrimary) {
                // 获取 主serviceId 
                console.log('getBLEDeviceServices:[' + i + "]", services[i])
                that.setData({
                  ['connected.serviceId']:services[i].uuid
                })
                setTimeout(function () {
                  //获取characterstic值
                  that.getBLcharac(deviceId, services[i].uuid);
                }, 100)
                return;
              }
            }
          }
        },
        fail: function (res) {
          wx.hideLoading();
          util.showModal(res.errMsg);
        }
      })
    },
    
    /**
     * 获取特征值
     * @param {*} deviceId 
     * @param {*} serviceId 
     */
    getBLcharac(deviceId,serviceId) {
      var that = this;
      wx.getBLEDeviceCharacteristics({
        deviceId: deviceId,
        serviceId: serviceId,
        success: function (res) {
          console.log("getBLcharac", res);
          for (var i = 0; i < res.characteristics.length; i++) {
            if (res.characteristics[i].properties.notify) {
              console.log("getBLcharac", res.characteristics[i].uuid);
              that.setData({
                ['connected.notifyCharacId']:res.characteristics[i].uuid
              })
            }
            if (res.characteristics[i].properties.write) {
              that.setData({
                ['connected.writeCharacId']:res.characteristics[i].uuid
              })
            } else if (res.characteristics[i].properties.read) {
              that.setData({
                ['connected.readCharacId']:res.characteristics[i].uuid
              })
            }
          }
          console.log('device connected:', that.data.connected);
          that.notifyBLECharacteristicValueChange()
        },
        fail: function (res) {
          console.error("getBLcharac->fail",res);
          
          util.showModal(res.errMsg);
        },
        complete: function () {
          wx.hideLoading();
          
        }
      })
    },




  /**
   * 开启监听
   */
  notifyBLECharacteristicValueChange:function() {
    var that = this;
    var connected = this.data.connected;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能  
      deviceId: connected.deviceId,
      serviceId: connected.serviceId,
      characteristicId: connected.notifyCharacId,
      success:function() {
        console.info("notifyBLECharacteristicValueChange->success");
        // 初始化通知
        WxNotificationCenter.postNotificationName('INIT',that.data.connected);
      },
      fail:function(res) {
        console.error("main->notifyBLECharacteristicValueChange error",res);
        util.showModal('开启监听失败，请重新进入');
      }
    });
    wx.onBLECharacteristicValueChange((res) => {
      console.info('main->onBLECharacteristicValueChange',res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received',received);
      WxNotificationCenter.postNotificationName('BLUEREPLY',received);
    });

    // setTimeout(function(){
    //   util.sendBlueCmd(connected,'FFFFFFFF05000500E4C74A');
    // },1000)
    
  },

  /**
   * 蓝牙回传
   */
  onBLECharacteristicValueChange:function() {
    wx.onBLECharacteristicValueChange(function (res){
      console.info('main->onBLECharacteristicValueChange',res);
      var buffer = res.value;
      var received = util.ab2hex(buffer);
      console.info('main->onBLECharacteristicValueChange-->received',received);
      WxNotificationCenter.postNotificationName('BLUEREPLY',received);
    })
  }
  /*******-------------->蓝牙回调 end */





  





})