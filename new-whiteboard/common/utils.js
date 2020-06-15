(function(win) {
  var RongIMLib = win.parent.RongIMLib;
  var RongIMClient = win.parent.RongIMClient;
  var UploadUrl = win.RongWhite.config.upload.url;
  var Dom = {
    getById: function(id) {
      return win.document.getElementById(id);
    }
  }
  /* 空函数 */
  function noop() {}

  /* 是否为图片文件 */
  function isImageFile(type) {
    var flag = false;
    var imgTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'pic'];
    if(imgTypes.indexOf(type.toLowerCase()) > -1){
      flag = true;
    }
    return flag;
  }

  function EventEmitter() {
    var events = {};

    var on = function (name, event) {
      var currentEventList = events[name] || [];
      currentEventList.push(event);
      events[name] = currentEventList;
    };

    var off = function (name, event) {
      if (!event) {
        delete events[name];
      } else {
        var currentEventList = events[name];
        currentEventList && currentEventList.forEach(function (currentEvent) {
          if (currentEvent === event) {
            var index = currentEventList.indexOf(currentEvent);
            currentEventList.splice(index, 1);
          }
        });
      }
    };

    var emit = function (name, data) {
      let currentEventList = events[name] || [];
      currentEventList.forEach(function (event) {
        event(data);
      });
    };

    var clear = function () {
      events = {};
    };

    return {
      on: on,
      off: off,
      emit: emit,
      clear: clear
    };
  }

  function uploadServer(url, file, token, callbacks) {
    var form = new win.FormData();
    form.append('file', file);
    form.append('token', token);
    var xhr = new XMLHttpRequest();
    xhr.open('post', url, true);
    xhr.onload = callbacks.onComplete;
    xhr.onerror = callbacks.onError;
    xhr.upload.onprogress = callbacks.onProgress;
    xhr.upload.onloadstart = callbacks.onLoadStart;
    xhr.send(form);
  }
	
  function upload(type, file, callbacks) {
    var onLoadStart = callbacks.onLoadStart || noop,
      onError = callbacks.onError || noop,
      onProgress = callbacks.onProgress || noop,
      onComplete = callbacks.onComplete || noop;
    var instance = RongIMClient.getInstance();

    var getFileUrl = function (fileName, oriName) {
      instance.getFileUrl(type, fileName, oriName, {
        onSuccess: onComplete,
        onError: onError
      });
    };

    var uploadSuccsss = function (content) {
      var target = content.target,
        response = target.response;
      response = JSON.parse(response);
      var hash = response.hash,
        name = response.name;
      getFileUrl(hash, name);
    };

    instance.getFileToken(type, {
      onSuccess: function (result) {
        uploadServer(UploadUrl, file, result.token, {
          onLoadStart: onLoadStart,
          onError: onError,
          onProgress: onProgress,
          onComplete: uploadSuccsss
        });
      },
      onError: onError
    });
  }

  function uploadImage(file, callbacks) {
    var type = RongIMLib.FileType.IMAGE;
    upload(type, file, callbacks);
  }

  function uploadFile(file, callbacks) {
    var type = RongIMLib.FileType.FILE;
    upload(type, file, callbacks);
  }
  
  function isIllegalFileType(type) {
    var types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/svg'];
    return types.indexOf(type) === -1;
  }
  
  var Utils = {
    Dom: Dom,
    isImageFile: isImageFile,
    EventEmitter: EventEmitter,
    uploadImage: uploadImage,
    uploadFile: uploadFile,
    isIllegalFileType: isIllegalFileType
  }

  win.RongWhite.utils = Utils;

  console.log('util',win.RongWhite)
})(window)