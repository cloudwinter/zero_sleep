// pages/wifiselect/wifiselect.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: app.globalData.skin, //当前皮肤样式
    navbar: {
      loading: false,
      color: '#FFFFFF',
      background: '#0A0A0C',
      show: true,
      animated: false,
    }, // 导航栏
    wifiList: [],
    iosWifiDialog: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置当前的皮肤样式
    this.setData({
      skin: app.globalData.skin,
      iosWifiDialog: app.globalData.isIos
    })
  },




  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},




  /**
   * 获取wifi列表
   */
  getWifiList() {
    let that = this;
    wx.startWifi({
      success: function (res) {
        console.log(res.errMsg, 'wifi初始化成功');
        wx.getWifiList({
          success(res) {
            wx.onGetWifiList((result) => {
              console.log("wifiList", result);
              let wifiList = that.data.wifiList;
              result.wifiList.forEach(info => {
                if(info.SSID.length > 1) {
                  wifiList.push(info.SSID);
                }
              });
              that.setData({
                wifiList:wifiList
              })
            })
          }
        });
      },
      fail: function (res) {
        console.log(res.errMsg, 'wifi初始化失败')
      }
    })
  },

  /**
   * 点击对话框
   */
  wifiDialogClick() {
    this.setData({
      iosWifiDialog: false
    })
    this.getWifiList();
  },

  /**
   * 点击事件
   * @param {*} e 
   */
  itemClick(e) {
    const name = e.currentTarget.dataset.item;
    console.info("name",name);
    var pages = getCurrentPages();   //当前页面
    var prevPage = pages[pages.length - 2];   //上个页面
    // 直接给上一个页面赋值
    prevPage.setData({
      wifiSSID: name,
      wifiPwd:''
    });
    // 返回上一个页面
    wx.navigateBack({
      delta: 1
    })

  }
})