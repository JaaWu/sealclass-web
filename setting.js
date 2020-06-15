(function (win) {
  var setting = {
    version: '2.0.0',
    lang: 'zh',
    // server: 'https://120.92.22.211/sealclass', // SealClass Server 地址
    server: 'https://ke.rongcloud.cn/api/v2', // 线上 Server 地址
    im: {
      appKey: 'pkfcgjstp8888',
      // navi: 'https://navqa.cn.ronghub.com', // navi 地址, 私有云可不填
      // api: '',
      // protobuf: '',
      reconnectUrl: 'cdn.ronghub.com/RongIMLib-2.2.6.min.js' // 重连地址
    },
    emoji: {
      size: 16 // emoji 字体大小
      // url: ''
    },
    upload: {
      url: 'https://upload.qiniu.com' // 上传文件地址
    },
    rtc: {
      resolution: { // 分辨率选项
        list: [
          { width: 320, height: 240 },
          { width: 640, height: 480 },
          { width: 1280, height: 720 }
        ],
        default: { width: 640, height: 480 }
      },
      screenPluginPath: 'assets/plugin/screenshare-addon.zip' // 屏幕共享插件地址
    },
    class: {
      appleySpeechWaitTime: 30000,
      toastTime: 30000,
      maxPersonCount: 16
    },
    whiteboard: {
      url: 'new-whiteboard/index.html' // 白板相对路径
    },
    isDebug: true,
    isPrivate: false
  };

  win.RongClass = win.RongClass || {
    locale: {},
    components: {},
    dialog: {},
    setting: setting
  };
  
})(window);