(function (RongClass, dependencies) {
  'use strict';
  var Vue = dependencies.Vue,
    win = dependencies.win,
    utils = RongClass.utils;

  function getRole() {
    var ENUM = RongClass.ENUM;
    var role = utils.getUrlParam('role'); // TODO 待无意义化
    role = Number(role);
    var Default = RongClass.ENUM.Role.STUDENT;
    if (!ENUM.Role[role]) {
      return Default;
    }
    return role || Default;
  }

  function textFormat(content, size) {
    var RongIMEmoji = win.RongIMLib.RongIMEmoji;
    content = utils.encodeHtmlStr(content);
    return RongIMEmoji.emojiToHTML(content, size);
  }

  function dateFormat(fmt, date) {
    var o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      'S': date.getMilliseconds()
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (var k in o)
      if (new RegExp('(' + k + ')').test(fmt))
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    return fmt;
  } 

  function console() {
    var isOpen = RongClass.setting.isDebug;
    var consoleDateTpl = 'yyyy-MM-dd hh:mm:ss';
    var logTypes = ['log', 'info', 'error', 'warn'];
    var logs = {};
    logTypes.forEach(function (type) {
      logs[type] = isOpen ? function (info) {
        var date = new Date();
        var dateString = dateFormat(consoleDateTpl, date);
        var isArrayOrObject = utils.isArray(info) || utils.isObject(info);
        info = isArrayOrObject ? JSON.stringify(info) : info;
        win.console[type](dateString, info);
      } : utils.noop;
    });
    return logs;
  }

  /**
   * 本地存储
   */
  function storage() {
    var keyNS = 'rong-class-' + getRole();

    function isKeyExist(key) {
      // do not depend on value cause of '和0
      return Object.prototype.hasOwnProperty.call(localStorage, key)
        || Object.prototype.hasOwnProperty.call(sessionStorage, key);
    }

    function get(key) {
      var tempKey = keyNS + key;
      if (!isKeyExist(tempKey)) {
        return null;
      }
      var val = localStorage.getItem(tempKey) || sessionStorage.getItem(tempKey);
      val = JSON.parse(val);
      if (val !== null
        && Object.prototype.hasOwnProperty.call(val, 'type')
        && Object.prototype.hasOwnProperty.call(val, 'data')) {
        return val.data;
      }
      return null;
    }
    
    function set(key, val, isTemp) {
      var store;
      if (isTemp) {
        store = sessionStorage;
      } else {
        store = localStorage;
      }
      store.setItem(keyNS + key, JSON.stringify({
        data: val,
        type: (typeof val)
      }));
    }

    function remove(key) {
      var tempKey = keyNS + key;
      localStorage.removeItem(tempKey);
      sessionStorage.removeItem(tempKey);
    }

    return {
      get: get,
      set: set,
      remove: remove
    };
  }

  function getUserName(user) {
    return user.userName || user.name || user.userId
      || user.id || user.toUserId;
  }

  function getUserId(user) {
    return user.userId || user.id;
  }

  function getVueComputed() {
    var ENUM = RongClass.ENUM;
    return {
      classRole: function () {
        return getRole();
      },
      isTeacher: function () {
        var role = this.classRole;
        var isTeacher = role == ENUM.Role.TEACHER;
        return isTeacher;
      },
      classDisplays: function () {
        var isTeacher = this.isTeacher;
        return isTeacher ? ENUM.Displays.TEACHER : ENUM.Displays.STUDENT;
      }
    };
  }

  /**
   * 封装弹框组件
   * @param {object} options 
   */
  function mountDialog(options) {
    var classInstance = RongClass.instance;
    options.parent = classInstance;
    var mixins = [
      RongClass.mixins.locale
    ];
    var methods = {
      getUserName: getUserName
    };
    var computed = getVueComputed();
    options.methods = utils.extend(methods, options.methods || {});
    options.computed = utils.extend(computed, options.computed || {});
    var currentMixins = options.mixins || [];
    options.mixins = mixins.concat(currentMixins);
    var Dialog = Vue.extend(options);
    var instance = new Dialog({
      el: document.createElement('div')
    });
    var wrap = document.getElementsByTagName('body')[0];
    wrap.appendChild(instance.$el);
    return instance;
  }

  function component(options, resolve) {
    var mixins = [
      RongClass.mixins.locale
    ];
    var currentMixins = options.mixins || [];
    var methods = {
      getUserName: getUserName
    };
    var computed = getVueComputed();
    var name = options.name;
    options.mixins = mixins.concat(currentMixins);
    options.methods = utils.extend(methods, options.methods || {});
    options.computed = utils.extend(computed, options.computed || {});
    resolve(Vue.component(name, options));
  }
  
  function addArrayById(list, detail) {
    var ENUM = RongClass.ENUM,
      RTCTag = ENUM.RTCTag;
    var newList = list.concat();
    var detailId = detail.userId || detail.id;
    var idList = newList.map(function (value) {
      return value.userId || value.id;
    });
    var index = idList.indexOf(detailId);
    if (index === -1) {
      newList.push(detail);
    } else {
      var current = newList[index];
      if (detail[RTCTag.RTC] && utils.isNull(detail[RTCTag.RTC].video)) {
        detail[RTCTag.RTC].video = current[RTCTag.RTC].video;
      }
      if (detail[RTCTag.RTC] && utils.isNull(detail[RTCTag.RTC].audio)) {
        detail[RTCTag.RTC].audio = current[RTCTag.RTC].audio;
      }
      if (detail[RTCTag.RTC] && utils.isNull(detail[RTCTag.RTC].mediaStream)) {
        detail[RTCTag.RTC].mediaStream = current[RTCTag.RTC].mediaStream;
      }
      newList[index] = utils.extend(current, detail);
    }
    return newList;
  }
  
  function removeArrayById(list, detail) {
    var detailId = getUserId(detail);
    var idList = list.map(function (value) {
      return getUserId(value);
    });
    var index = idList.indexOf(detailId);
    if (index !== -1) {
      list.splice(index, 1);
    } else {
      // do nothing
    }
    return list;
  }

  function getLoginUser(list, loginUserId) {
    var auth = RongClass.instance.auth || {};
    loginUserId = auth.userId || loginUserId;
    var loginUser = {};
    list.forEach(function (user) {
      if (user.id === loginUserId) {
        loginUser = user;
      }
    });
    return loginUser;
  }

  function getUserByRole(list, role) {
    var roleUser;
    list.forEach(function (user) {
      if (user.role === role) {
        roleUser = user;
      }
    });
    return roleUser;
  }

  function getUserById(list, id) {
    var user;
    list.forEach(function (item) {
      if (item.userId === id || item.id === id) {
        user = item;
      }
    });
    return user;
  }

  function generateUser(id, name) {
    return {
      userId: id,
      userName: name || id
    };
  }

  function formatDisplayString(displayString) {
    if (!displayString) {
      return null;
    }
    var url = displayString;
    var formattedParams = {};
    var params = url.split('display://')[1];
    if (params.indexOf('?uri') !== -1) {
      params = params.split('?uri');
      params[1] = 'uri' + params[1];
      var otherParams = params[0].split('?');
      params = otherParams.concat(params[1]);
    } else {
      params = params.split('?');
    }
    for (let i = 0; i < params.length; i++) {
      var value = params[i];
      var index = value.indexOf('=');
      formattedParams[value.substring(0, index)] = value.substring(index + 1);
    }
    formattedParams.type = Number(formattedParams.type);
    return formattedParams;
  }

  function sortByRole(list, userId) {
    var RolePriority = RongClass.ENUM.RolePriority;
    var newList = list.sort(function (beforeUser, afterUser) {
      var beforePriority = RolePriority.indexOf(beforeUser.role);
      var afterPriority = RolePriority.indexOf(afterUser.role);
      return beforePriority - afterPriority;
    });
    if (userId) {
      newList = newList.sort(function (beforeUser) {
        if (beforeUser.userId === userId || beforeUser.id === userId) {
          return -1;
        }
        return 0;
      });
    }
    newList = newList.sort(function (beforeUser) {
      if (!beforeUser.role) {
        return 1;
      }
      return 0;
    });
    return newList;
  }

  function DialogQueue() {
    this.isRunning = false;
    this.list = [];
  }
  DialogQueue.prototype.add = function (fn) {
    var context = this;
    var run = function () {
      context.isRunning = true;
      var index = context.list.indexOf(run);
      context.list.splice(index, 1);
      var runNext = function () {
        context.isRunning = false;
        context.run();
      };
      fn(runNext);
    };
    context.list.push(run);
  };
  DialogQueue.prototype.run = function () {
    if (this.list.length && !this.isRunning) {
      var run = this.list[0];
      run && run();
    }
  };

  var toastQueue = new DialogQueue(),
    callDialogQueue = new DialogQueue();

  function toast(content) {
    var destroyTimeout = 5000;
    var fn = function (runNext) {
      RongClass.dialog.toast({
        content: content,
        destroyTimeout: destroyTimeout,
        onDestoryed: runNext
      });
    };
    toastQueue.add(fn);
    toastQueue.run();
  }

  function callDialog(user, content, callbacks) {
    callbacks = callbacks || {};
    var onAccepted = callbacks.onAccepted,
      onRejected = callbacks.onRejected,
      onDestoryed = callbacks.onDestoryed;
    var fn = function (runNext) {
      var proceed = function (func) {
        runNext();
        func && func();
      };
      RongClass.dialog.call({
        user: user,
        content: content,
        accpeted: function () {
          proceed(onAccepted);
        },
        rejected: function () {
          proceed(onRejected);
        },
        onDestoryed: function () {
          proceed(onDestoryed);
        }
      });
    };
    callDialogQueue.add(fn);
    callDialogQueue.run();
  }

  function stopAllTrack() {
    var videoElList = document.querySelectorAll('video');
    for (var i = 0, max = videoElList.length; i < max; i++) {
      var videoEl = videoElList[i];
      var stream = videoEl.srcObject || {};
      stream.getTracks && stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
  }

  RongClass = RongClass || {};
  RongClass.common = {
    textFormat: textFormat,
    mountDialog: mountDialog,
    storage: storage(),
    console: console(),
    dateFormat: dateFormat,
    component: component,
    addArrayById: addArrayById,
    removeArrayById: removeArrayById,
    getLoginUser: getLoginUser,
    getUserByRole: getUserByRole,
    formatDisplayString: formatDisplayString,
    getUserById: getUserById,
    getUserName: getUserName,
    getUserId: getUserId,
    sortByRole: sortByRole,
    generateUser: generateUser,
    toast: toast,
    callDialog: callDialog,
    getRole: getRole,
    getVueComputed: getVueComputed,
    stopAllTrack: stopAllTrack
  };
})(window.RongClass, {
  Vue: window.Vue,
  win: window
});