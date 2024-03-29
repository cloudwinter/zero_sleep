// component/tab/weitiao/weitiao-W14.js


const app = getApp();
const util = require('../../../utils/util')
const WxNotificationCenter = require('../../../utils/WxNotificationCenter')
const sendPrefix = 'FFFFFFFF050000'; // 发送码前缀
const sendXHPrefix = 'FFFFFFFF050005'; // 循环发送码前缀
const imgSanjiaoBottomSelected = '../../../images/' + app.globalData.skin + '/sanjiao-bottom-selected@3x.png';
const imgSanjiaoBottomNormal = '../../../images/' + app.globalData.skin + '/sanjiao-bottom-normal@3x.png';
const imgSanjiaoTopSelected = '../../../images/' + app.globalData.skin + '/sanjiao-top-selected@3x.png';
const imgSanjiaoTopNormal = '../../../images/' + app.globalData.skin + '/sanjiao-top-normal@3x.png';



Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    skin: app.globalData.skin,
    display: app.globalData.display,
    imgSanjiao: {
      imgSanjiaoBottomSelected: imgSanjiaoBottomSelected,
      imgSanjiaoBottomNormal: imgSanjiaoBottomNormal,
      imgSanjiaoTopSelected: imgSanjiaoTopSelected,
      imgSanjiaoTopNormal: imgSanjiaoTopNormal
    },
    connected: {},
    currentType: 'tiaozheng', // tiaozheng,xunhuan
    currentAnjian: {
      anjian: 'toubutz', // beibutz,yaobutz,toubutz,tuibutz
      name: '头部调整' // 背部调整，腰部调整，头部调整，腿部调整
    },
    currentXHAnjian: {
      anjian: 'toubuxh', // quanshengxh,yaobuxh,toubuxh,tuibuxh
      name: '头部循环' // 全身循环，腰部循环，头部循环，腿部循环
    },
    animationPosition: 1, //动画，1，2，3 或者 3，2，1 初始化都是1
    animationStop: true, //停止动画
    startTime: '',
    endTime: '',
    beibutzTop: false,
    beibutzBottom: false,
    yaobutzTop: false,
    yaobutzBottom: false,
    toubutzTop: false,
    toubutzBottom: false,
    tuibutzTop: false,
    tuibutzBottom: false,
  },


  /**
   * 页面的生命周期
   */
  pageLifetimes: {
    show: function () {
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
    }
  },

  lifetimes: {
    created: function () {
      // 在组件实例刚刚被创建时执行
      console.info("weitiao-W2-->created");
      var that = this;
      WxNotificationCenter.addNotification("INIT", that.initConnected, that);
    },
    attached: function () {
      // 在组件实例进入页面节点树时执行
      console.info("attached");
      this.setData({
        display:app.globalData.display
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.info("detached");
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
      console.info('weitiao-W2->initConnected:', connected, this.observer);
      that.setData({
        connected: connected,
      })
      //WxNotificationCenter.removeNotification("INIT", that);
    },


    /**
     * 发送蓝牙命令
     */
    sendBlueCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, sendPrefix + cmd, options);
    },

    /**
     * 循环蓝牙发送命令
     * @param {}} cmd 
     * @param {*} options 
     */
    sendBlueXHCmd(cmd, options) {
      var connected = this.data.connected;
      util.sendBlueCmd(connected, sendXHPrefix + cmd, options);
    },


    /***************** 点击事件 */
    /**
     * 按下事件
     * @param {*} e 
     */
    touchStart(e) {
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
      } else if (type == 'yaobutzTop') {
        this.setData({
          currentAnjian: {
            anjian: 'yaobutz',
            name: '腰部调整'
          },
          yaobutzTop: true
        });
        this.donghua(true, this);
        this.tapYaobutz(true, true);
      } else if (type == 'yaobutzBottom') {
        this.setData({
          currentAnjian: {
            anjian: 'yaobutz',
            name: '腰部调整'
          },
          yaobutzBottom: true
        });
        this.donghua(false, this);
        this.tapYaobutz(false, true);
      } else if (type == 'toubutzTop') {
        this.setData({
          currentAnjian: {
            anjian: 'toubutz',
            name: '头部调整'
          },
          toubutzTop: true
        });
        this.donghua(true, this);
        this.tapToubutz(true, true);
      } else if (type == 'toubutzBottom') {
        this.setData({
          currentAnjian: {
            anjian: 'toubutz',
            name: '头部调整'
          },
          toubutzBottom: true
        });
        this.donghua(false, this);
        this.tapToubutz(false, true);
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
      }else if (type == 'ztsjTop') {
        this.setData({
          currentAnjian: {
            anjian: 'ztsj',
            name: '整体升降'
          },
        });
        this.tabZtsj(true, true);
      } else if (type == 'ztsjBottom') {
        this.setData({
          currentAnjian: {
            anjian: 'ztsj',
            name: '整体升降'
          },
        });
        this.tabZtsj(false, true);
      } else if (type == 'ztqxTop') {
        this.setData({
          currentAnjian: {
            anjian: 'ztqx',
            name: '整体倾斜'
          },
        });
        this.tabZtqx(true, true);
      } else if (type == 'ztqxBottom') {
        this.setData({
          currentAnjian: {
            anjian: 'ztqx',
            name: '整体倾斜'
          },
        });
        this.tabZtqx(false, true);
      }
    },
    /**
     * 抬起事件
     * @param {*} e 
     */
    touchEnd(e) {
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
      } else if (type == 'yaobutzTop') {
        this.setData({
          yaobutzTop: false
        });
        this.tapYaobutz(true, false);
      } else if (type == 'yaobutzBottom') {
        this.setData({
          yaobutzBottom: false
        });
        this.tapYaobutz(false, false);
      } else if (type == 'toubutzTop') {
        this.setData({
          toubutzTop: false
        });
        this.tapToubutz(true, false);
      } else if (type == 'toubutzBottom') {
        this.setData({
          toubutzBottom: false
        });
        this.tapToubutz(false, false);
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
      } else if (type == 'ztsjTop') {
        this.tabZtsj(true, false);
      } else if (type == 'ztsjBottom') {
        this.tabZtsj(false, false);
      }else if (type == 'ztqxTop') {
        this.tabZtqx(true, false);
      } else if (type == 'ztqxBottom') {
        this.tabZtqx(false, false);
      }
    },



    /**
     * 长按切换动画区
     */
    tapDonghuaquClick() {
      console.info('tapDonghuaquClick', this.endTime, this.startTime);
      if (this.endTime - this.startTime > 1000) {
        var currentType = this.data.currentType;
        this.setData({
          currentType: currentType == 'tiaozheng' ? 'xunhuan' : 'tiaozheng'
        })
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


    /**
     * 腰部调整
     * @param {*} top 上
     * @param {*} start 按下
     */
    tapYaobutz(top, start) {
      var cmd = '';
      if (!start) {
        // 松开 发停止码
        cmd = '0000D700';
        this.sendBlueCmd(cmd);
      } else {
        // 按下
        if (top) {
          cmd = '000D16C5';
        } else {
          cmd = '000E56C4';
        }
        this.sendBlueCmd(cmd);
      }
    },


    /**
     * 头部调整
     * @param {*} top 上
     * @param {*} start 按下
     */
    tapToubutz(top, start) {
      var cmd = '';
      if (!start) {
        // 松开 发停止码
        cmd = '0000D700';
        this.sendBlueCmd(cmd);
      } else {
        // 按下
        if (top) {
          cmd = '000116C0';
        } else {
          cmd = '000256C1';
        }
        this.sendBlueCmd(cmd);
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
     * 整体升降
     * @param {*} top 
     * @param {*} start 
     */
    tabZtsj(top, start) {
      var cmd = '';
      if (!start) {
        // 松开 发停止码
        cmd = '0000D700';
        this.sendBlueCmd(cmd);
      } else {
        // 按下
        if (top) {
          cmd = '00211718';
        } else {
          cmd = '00225719';
        }
        this.sendBlueCmd(cmd);
      }
    },


    /**
     * 整体倾斜
     * @param {*} top 
     * @param {*} start 
     */
    tabZtqx(top, start) {
      var cmd = '';
      if (!start) {
        // 松开 发停止码
        cmd = '0000D700';
        this.sendBlueCmd(cmd);
      } else {
        // 按下
        if (top) {
          cmd = '0028D71E';
        } else {
          cmd = '002916DE';
        }
        this.sendBlueCmd(cmd);
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

    /**
     * 循环点击事件
     * @param {*} e 
     */
    tapXH(e) {
      var type = e.currentTarget.dataset.xhtype;
      var name = e.currentTarget.dataset.xhname;
      this.setData({
        currentXHAnjian: {
          anjian: type,
          name: name
        }
      })
      var cmd = '';
      if (type == 'quanshengxh') {
        cmd = '00E4C74A';
      } else if (type == 'yaobuxh') {
        cmd = '00E6468B';
      } else if (type == 'toubuxh') {
        cmd = '00E38688';
      } else if (type == 'tuibuxh') {
        cmd = '00E5068A';
      }
      this.sendBlueXHCmd(cmd);
    }
  }
})

