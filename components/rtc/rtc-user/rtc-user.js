(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    utils = RongClass.utils,
    server = RongClass.dataModel.server,
    rtcServer = RongClass.dataModel.rtc;
  
  var RTCTag = RongClass.ENUM.RTCTag,
    RoleEnum = RongClass.ENUM.Role,
    RTCKey = RTCTag.RTC,
    ScreenShareKey = RTCTag.SCREENSHARE,
    hasOpenedRTCWindow = RongClass.dialog.rtcWindow.Handler.hasOpened;
  
  var rtcBigDialog;

  function closeRTCWindow() {
    rtcBigDialog && rtcBigDialog.destroy();
  }

  function showRTCWindow(isShow, context) {
    if (context.isBanZoom || !context.isVideoOpened) {
      return;
    }
    if (isShow) {
      var user = context.user;
      rtcBigDialog = RongClass.dialog.rtcWindow(user, {
        canceled: function () {
          context.isShowBig = false;
        }
      });
    } else {
      closeRTCWindow();
    }
    context.isShowBig = isShow;
  }

  function showStream(context, tag) {
    tag = tag || RTCKey;
    var refName = tag === RTCKey ? 'userVideoRTC' : 'userVideoScreen';
    context.$nextTick(function () {
      var videoEl = context.$refs[refName];
      if (!context.user) {
        return;
      }
      var mediaStream = context.user[tag].mediaStream;
      if (context.isShowBigStream) {
        rtcServer.resizeStream({
          id: context.user.userId,
          stream: context.user[tag]
        }, true).then(function () {
          common.console.warn(context.user.userId + '切换大流成功');
        }).catch(function (error) {
          common.console.warn(context.user.userId + '切换大流失败');
          common.console.error(error);
        });
      }
      if (videoEl && mediaStream.id) {
        context.isShowThumbnail && videoEl.addEventListener('play', function () {
          // context.thumbnail = utils.getThumbnailByVideo(videoEl);
        });
        videoEl.srcObject = mediaStream;
      }
    });
  }

  function hasMediaStream(user) {
    user = user || {};
    var mediaStream = user.mediaStream || {};
    return !!mediaStream.id;
  }

  function getMethods() {
    return {
      showRTCWindow: function () {
        showRTCWindow(!this.isShowBig, this);
      }
    };
  }

  function getWatch() {
    var watchs = {};
    var mediaStreamChanged = function (user, tag, context) {
      if (hasMediaStream(user)) {
        showStream(context, tag);
      }
    };
    watchs['user.' + RTCKey] = function (newUser, oldUser) {
      if (newUser.mediaStream !== oldUser.mediaStream) {
        mediaStreamChanged(newUser, RTCKey, this);
      }
    };
    watchs['user.' + ScreenShareKey] = function (user) {
      mediaStreamChanged(user, ScreenShareKey, this);
    };
    return watchs;
  }

  components.rtcUser = function (resolve) {
    var options = {
      name: 'rtc-user',
      template: '#rong-template-rtc-user',
      props: ['user', 'isBanZoom', 'isShowScreenShare', 'isShowThumbnail', 'isShowBigStream'],
      data: function () {
        return {
          isShowBig: false,
          thumbnail: null
        };
      },
      computed: {
        isSelf: function () {
          var loginUserId = server.getLoginUserId(),
            user = this.user;
          return loginUserId === user.id;
        },
        isShowVideo: function () {
          var isShow = true;
          if (!this.isShowScreenShare) {
            isShow = this.isVideoOpened;
          }
          return isShow
        },
        isVideoOpened: function () {
          var user = this.user || {};
          var rtcStream = user[RTCKey] || {};
          return rtcStream.video;
        },
        role: function () {
          var role = this.user.role;
          var roleName = RoleEnum[role];
          return this.locale.class[roleName];
        },
        isSelfScreenShare: function () {
          var loginUserId = server.getLoginUserId(),
            user = this.user,
            isShowScreenShare = this.isShowScreenShare;
          return loginUserId === user.id && isShowScreenShare;
        },
        selfVideoClassName: function () {
          return RongClass.instance.selfVideoClassName;
        }
      },
      watch: utils.extend({
        'user.isLoading': function () {
          !this.isLoading && showStream(this);
        },
        isShowScreenShare: function (isShow) {
          if (isShow && !this.isSelfScreenShare) {
            showStream(this, ScreenShareKey);
          }
          // 组件未销毁, 且不再展示屏幕共享时, 展示视频流
          if (!isShow) {
            showStream(this, RTCKey);
          }
        }
      }, getWatch()),
      destroyed: function () {
        var context = this;
        if (context.isShowBigStream) {
          rtcServer.resizeStream({
            id: context.user.userId,
            stream: context.user[RTCTag.RTC]
          }, false).then(function () {
            common.console.warn(context.user.userId + '切换小流成功');
          }).catch(function (error) {
            common.console.warn(context.user.userId + '切换小流失败');
            common.console.error(error);
          });
        }
      },
      mounted: function () {
        var context = this,
          screenUser = context.user[ScreenShareKey];
        if (!context.user.isLoading) {
          showStream(context);
        }
        if (hasMediaStream(screenUser) && context.isShowScreenShare) {
          showStream(context, ScreenShareKey);
        }
        var isShowBig = hasOpenedRTCWindow(context.user.userId);
        showRTCWindow(isShowBig, context);
      },
      components: {
        'user-avatar': components.userAvatar
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };
  
})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);