(function (RongClass, dependencies, components) {
  'use strict';
  var common = RongClass.common,
    utils = RongClass.utils,
    dataModel = RongClass.dataModel,
    rtcServer = dataModel.rtc;
    // server = dataModel.server;
  
  var ENUM = RongClass.ENUM,
    RTCTag = RongClass.ENUM.RTCTag,
    RTCKey = RTCTag.RTC,
    RoleENUM = ENUM.Role;

  function getMethods() {
    return {
      switchVolume: function () {
        var isMuted = !this.isMuted;
        var instance = RongClass.instance;
        utils.setAllMute(isMuted);
        instance.setMute(isMuted);
      },
      switchAudio: function () {
        if (this.isDisabled) {
          return;
        }
        var isAudioOpenedNow = this.isAudioOpened;
        var audioEnable = !isAudioOpenedNow;
        var switchEvent = audioEnable ? rtcServer.openAudio : rtcServer.closeAudio;
        var loginUser = this.loginUser;
        switchEvent(loginUser);
        // server.syncMicroStatus(audioEnable);
      },
      switchVideo: function () {
        if (this.isDisabled) {
          return;
        }
        var isVideoOpenedNow = this.isVideoOpened;
        var videoEnable = !isVideoOpenedNow;
        var switchEvent = videoEnable ? rtcServer.openVideo : rtcServer.closeVideo;
        var loginUser = this.loginUser;
        switchEvent(loginUser);
        // server.syncCameraStatus(videoEnable);
      },
      confirmHungup: function () {
        var context = this;
        RongClass.dialog.confirm({
          content: '确定要退出课堂吗 ?',
          confirmed: function () {
            context.hungup(true);
          }
        });
      }
    };
  }

  components.selfRTCOperate = function (resolve) {
    var options = {
      name: 'self-rtc-operate',
      template: '#rong-template-selfoperate',
      props: ['userList', 'loginUser', 'hungup'],
      data: function () {
        return {
        };
      },
      computed: {
        isLoading: function () {
          var user = this.loginUser || {};
          return user.isLoading;
        },
        isAudioOpened: function () {
          var user = this.loginUser || {};
          var rtcStream = user[RTCKey] || {};
          return rtcStream.audio;
        },
        isVideoOpened: function () {
          var user = this.loginUser || {};
          var rtcStream = user[RTCKey] || {};
          return rtcStream.video;
        },
        isDisabled: function () {
          var user = this.loginUser;
          var isAudience = user.role === RoleENUM.AUDIENCE;
          return isAudience || this.isLoading;
        },
        isMuted: function () {
          var instance = RongClass.instance;
          return instance.isMuted;
        }
      },
      mounted: function () {
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);