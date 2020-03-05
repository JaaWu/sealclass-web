(function (RongClass) {
  'use strict';

  var RTCTag = RongClass.ENUM.RTCTag;
  var common = RongClass.common,
    server = RongClass.dataModel.server,
    rtcServer = RongClass.dataModel.rtc,
    RoleENUM = RongClass.ENUM.Role;

  var DialogHandle = {
    Dialogs: {},
    addDialog: function (userId, dialog) {
      DialogHandle.Dialogs[userId] = dialog;
    },
    removeDialog: function (userId) {
      delete DialogHandle.Dialogs[userId];
    },
    destory: function (userId) {
      var dialog = DialogHandle.Dialogs[userId];
      dialog && dialog.destroy();
      delete DialogHandle.Dialogs[userId];
    },
    hasOpened: function (userId) {
      return !!DialogHandle.Dialogs[userId];
    },
    clear: function () {
      for (var userId in DialogHandle.Dialogs) {
        var dialog = DialogHandle.Dialogs[userId];
        dialog && dialog.destroy();
        DialogHandle.removeDialog(userId);
      }
    }
  };

  function resizeStream(context, options) {
    options = options || {};
    var isMax = options.isMax;
    var user = context.user;
    var rtcStream = user[RTCTag.RTC];
    user && !context.isSelf && rtcServer.resizeStream({
      id: user.userId,
      stream: rtcStream
    }, isMax).then(function () {
      common.console.warn(context.user.userId + '切换小流成功');
    }).catch(function (error) {
      common.console.warn(context.user.userId + '切换小流失败');
      common.console.error(error);
    });
  }

  function removeSelf(context) {
    if (context.isShow) {
      context.isShow = false;
      var parent = context.$el.parentElement;
      parent.removeChild(context.$el);
      resizeStream(context, {
        isMax: false
      });
    }
  }

  var dialog = function (user, options) {
    options = options || {};
    DialogHandle.clear();
    return common.mountDialog({
      name: 'rtc-window',
      template: '#rong-template-dialog-rtc',
      data: function () {
        return {
          isShow: true,
          user: user
        };
      },
      computed: {
        isSelf: function () {
          var loginUserId = server.getLoginUserId(),
            user = this.user;
          return loginUserId === user.id;
        },
        selfVideoClassName: function () {
          return RongClass.instance.selfVideoClassName;
        },
        displayUserName: function () {
          var user = this.user;
          return common.getUserName(user);
        },
        isVideoOpened: function () {
          var user = this.user || {};
          var rtcStream = user[RTCTag.RTC] || {};
          return rtcStream.video;
        },
        isAudience: function () {
          var user = this.user || {};
          var role = user.role;
          return role === RoleENUM.AUDIENCE;
        }
      },
      mounted: function () {
        var context = this;
        var user = context.user;
        context.$nextTick(function () {
          var videoEl = context.$refs.rtcVideo;
          var mediaStream = context.user[RTCTag.RTC].mediaStream;
          videoEl.srcObject = mediaStream;
        });
        DialogHandle.addDialog(user.userId, context);
        
        resizeStream(context, {
          isMax: true
        });
      },
      methods: {
        cancel: function () {
          removeSelf(this);
          options.canceled && options.canceled();
          DialogHandle.removeDialog(this.user.userId);
        },
        destroy: function () {
          this.cancel();
        }
      }
    });
  };

  var rtcWindow = dialog;
  rtcWindow.Handler = DialogHandle;

  RongClass.dialog.rtcWindow = rtcWindow;

})(window.RongClass);