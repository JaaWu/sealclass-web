(function(win) {
  var config = {
    version: '2.0,0', // 白板模块版本号
    upload: {
      url: 'https://upload.qiniup.com' // 上传文件地址
    }
  }
   
  win.RongWhite = win.RongWhite || {
    config: config
  };
  console.log('config',win.RongWhite)
})(window)