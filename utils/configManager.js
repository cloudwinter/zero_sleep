
const _STORAGE_KEY = 'bleConf'
const _SKIP_KEY = 'skip'
const _LAST_CONNECT_KEY = 'last_connected'
const _PROPS = {
  _ID: 'id'
}
let _cache = []

/**
 * 创建配置
 * @param {*} id 
 */
function createConf(id) {
  return {
    [_PROPS._ID]: id,
  }
}

/**
 * 初始化
 */
function init() {
  clear();
  load();
}


/**
 * 添加设备配置
 * @param {*} id 设备id
 * @param {*} key 
 * @param {*} value 
 */
function putKeyValue(id, key, value) {
  console.log('config.putKeyValue:', id, key, value);
  if (id && key) {
    let index = findIndex(_cache, id);
    if (index >= 0) {
      _cache[index][key] = value || '';
    } else {
      _cache.push({
        [_PROPS._ID]: id,
        [key]: value || ''
      });
    }
    console.log('config.putKeyValue:', _cache);
    commit();
  }
}

function get(id) {
  return clone(find(_cache, id));
}

function find(arr, id) {
  if (arr && id) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][_PROPS._ID] === id) {
        return arr[i];
      }
    }
  }
  return null;
}

function findIndex(arr, id) {
  if (arr && id) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][_PROPS._ID] === id) {
        return i;
      }
    }
  }
  return -1;
}

function commit() {
  console.log('config.commit:', _cache);
  if (_cache && _cache.length > 0) {
    wx.setStorage({
      data: JSON.stringify(_cache),
      key: _STORAGE_KEY,
      success: (res) => {
        console.log('config.commit.success:', res);
      },
      fail: (res) => {
        console.log('config.commit.fail:', res);
      }
    })
  }
}

function clear() {
  _cache = [];
}

function load() {
  wx.getStorage({
    key: _STORAGE_KEY,
    success: (res) => {
      console.log('config.init.success:', res);
      if (res.data) {
        const arr = JSON.parse(res.data);
        if (arr && arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            put(arr[i][_PROPS._ID], arr[i]);
          }
        }
      }
    },
    fail: (res) => {
      console.log('config.init.fail:', res);
    }
  })
}

function clone(obj) {
  if (obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  return null;
}


/********** 换肤 ************/
/**
 * 存储当前样式
 * dark
 * orange
 */
function setSkin(style){
  wx.setStorage({
    data: style,
    key: _SKIP_KEY,
  })
  console.log("setSkin",style);
}

function getSkin(){
  var skipStyle = wx.getStorageSync(_SKIP_KEY);
  console.log("getSkin",skipStyle);
  if(skipStyle != '') {
    return skipStyle;
  }
  return 'dark';
}

/**
 * 存储最近一次连接的设备
 * @param {*} deviceId 
 */
function putLastConnected(deviceId){
  wx.setStorage({
    data: deviceId,
    key: _LAST_CONNECT_KEY,
  })
  console.log("putLastConnected",deviceId);
}

/**
 * 获取最后一次连接设备的设备id
 */
function getLastConnected() {
  var deviceId = wx.getStorageSync(_LAST_CONNECT_KEY);
  console.log("putLastConnected",deviceId);
  return deviceId;
}






module.exports = {
  _PROPS,
  init,
  reload: load,
  get,
  putKeyValue,
  clear,
  createConf,
  setSkin,
  getSkin,
  putLastConnected,
  getLastConnected,
}