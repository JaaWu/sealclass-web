(function (RongClass, dependencies) {
  'use strict';
  var utils = RongClass.utils,
    common = RongClass.common,
    emitter = utils.EventEmitter,
    Promise = dependencies.win.Promise,
    RongScreenShare = dependencies.RongScreenShare,
    ENUM = RongClass.ENUM,
    Event = ENUM.Event,
    RTCTag = ENUM.RTCTag;

  var appkey = RongClass.setting.im.appKey;

  var RongIMLib = dependencies.RongIMLib,
    RongRTC = dependencies.RongRTC,
    RongMedia = dependencies.RongMedia;

  var rongRTC, rongRTCRoom, rongRTCStream;

  var loginUserId /* loginUserScreenShare */;

  function clearScreenShareChooseBox() {
    RongScreenShare.clearChooseBox();
  }

  function getStreamType(videoEnable, audioEnable) {
    var StreamType = rongRTC.StreamType;
    var streamType;
    if (videoEnable && audioEnable) {
      streamType = StreamType.AUDIO_AND_VIDEO;
    } else if (videoEnable) {
      streamType = StreamType.VIDEO;
    } else if (audioEnable) {
      streamType = StreamType.AUDIO;
    } else {
      streamType = StreamType.NONE;
    }
    return streamType;
  }

  function getStreamSwitch(streamType) {
    var StreamType = rongRTC.StreamType;
    var video = true, audio = true;
    switch(streamType) {
    case StreamType.NONE:
      video = false;
      audio = false;
      break;
    case StreamType.VIDEO:
      audio = false;
      break;
    case StreamType.AUDIO:
      video = false;
      break;
    }
    return {
      audio: audio,
      video: video
    };
  }

  function getSelfMedia(resolution, videoEnable, audioEnable) {
    resolution = resolution || RongClass.setting.rtc.resolution.default;
    var video = videoEnable ? resolution : false;
    return RongMedia.get({ audio: !!audioEnable, video: video });
  }

  function setRoomListener(roomId) {
    rongRTCRoom = new rongRTC.Room({
      id: roomId,
      joined: function (user) {
        common.console.warn({ RTCJoined: user });
        emitter.emit(Event.USER_JOINED, user);
      },
      left: function (user) {
        common.console.warn({ RTCLeft: user });
        emitter.emit(Event.USER_LEFT, user);
      }
    });
  }

  function setStreamListener() {
    rongRTCStream = new rongRTC.Stream({
      published: function (user) {
        common.console.warn({ RTCPublished: user });
        rongRTCStream.subscribe(user).then(function (user) {
          common.console.warn({ RTCSubscribedSuccess: user });
          var enable = user.stream.enable;
          user.stream.type = getStreamType(enable.video, enable.audio);
          emitter.emit(Event.STREAM_ADDED, user);
        }).catch(function () {
          common.console.error({ RTCSubscribedError: user });
        });
      },
      unpublished: function (user) {
        common.console.warn({ RTCUnPublished: user });
        emitter.emit(Event.STREAM_REMOVED, user);
      },
      disabled: function (user) {
        common.console.warn({ RTCDisabled: user });
        emitter.emit(Event.VIDEO_DISABLED, user);
      },
      enabled: function (user) {
        common.console.warn({ RTCEnabled: user });
        emitter.emit(Event.VIDEO_ENABLED, user);
      },
      muted: function (user) {
        common.console.warn({ RTCMuted: user });
        emitter.emit(Event.AUDIO_MUTED, user);
      },
      unmuted: function (user) {
        common.console.warn({ RTCUnMuted: user });
        emitter.emit(Event.AUDIO_UNMUTED, user);
      }
    });
  }

  function publishScreenShare() {
    var user = {
      id: loginUserId,
      stream: {
        tag: RTCTag.SCREENSHARE,
        type: getStreamType(true, true),
        mediaStream: null
      }
    };
    // TODO 暂时弹框, 后续先在 login 判断
    var loading = RongClass.dialog.loading({ content: '正在加载屏幕共享插件...' });
    return RongScreenShare.get().then(function (stream) {
      user.stream.mediaStream = stream;
      loading.destroy();
      return rongRTCStream.publish(user);
    }, function (error) {
      loading.destroy();
      return Promise.reject(error);
    }).then(function () {
      emitter.emit(Event.STREAM_ADDED, user);
      return Promise.resolve(user);
    });
  }

  function unPublishScreenShare() {
    var user = {
      id: loginUserId,
      stream: {
        tag: RTCTag.SCREENSHARE,
        type: getStreamType(true, true)
      }
    };
    return rongRTCStream.unpublish(user).then(function () {
      emitter.emit(Event.STREAM_REMOVED, user);
    });
  }

  function publishSelf(resolution, videoEnable, audioEnable) {
    var user = {
      id: loginUserId,
      stream: {
        tag: RTCTag.RTC,
        type: getStreamType(videoEnable, audioEnable)
      }
    };
    if (!videoEnable && !audioEnable) {
      emitter.emit(Event.STREAM_ADDED, user);
      return Promise.resolve(user);
    }
    return getSelfMedia(resolution, videoEnable, audioEnable).then(function (stream) {
      user.stream.mediaStream = stream;
      return rongRTCStream.publish(user);
    }).then(function () {
      emitter.emit(Event.STREAM_ADDED, user);
      return Promise.resolve(user);
    });
  }

  function unPublishSelf() {
    var user = {
      id: loginUserId,
      stream: {
        tag: RTCTag.RTC,
        type: getStreamType(true, true)
      }
    };
    return rongRTCStream.unpublish(user).then(function () {
      emitter.emit(Event.STREAM_REMOVED, user);
    });
  }

  function switchAudio(isOpen, user) {
    var Audio = rongRTCStream.audio;
    var muteFuc = isOpen ? Audio.unmute : Audio.mute;
    var eventKey = isOpen ? Event.AUDIO_UNMUTED : Event.AUDIO_MUTED;
    user.stream = user[RTCTag.RTC];
    return muteFuc(user).then(function () {
      emitter.emit(eventKey, user);
      return Promise.resolve(user);
    });
  }

  function switchVideo(isOpen, user) {
    var Video = rongRTCStream.video;
    var muteFuc = isOpen ? Video.enable : Video.disable;
    var eventKey = isOpen ? Event.VIDEO_ENABLED : Event.VIDEO_DISABLED;
    user.stream = user[RTCTag.RTC];
    return muteFuc(user).then(function () {
      if (user.stream.tag === RTCTag.SCREENSHARE) {
        user.stream = user[RTCTag.RTC];
      }
      emitter.emit(eventKey, user);
      return Promise.resolve(user);
    });
  }

  function openAudio(user) {
    return switchAudio(true, user);
  }

  function closeAudio(user) {
    return switchAudio(false, user);
  }

  function openVideo(user) {
    return switchVideo(true, user);
  }

  function closeVideo(user) {
    return switchVideo(false, user);
  }

  function leave() {
    return rongRTCRoom.leave();
  }

  /**
   * 初始化 rtc
   * @param {object} params 
   * @param {String} params.roomId
   * @param {String} params.userId
   * @param {String} params.token
   * @param {String} params.resolution
   */
  function init(params) {
    var roomId = params.roomId,
      userId = params.userId,
      token = params.token;
    
    rongRTC = new RongRTC({
      appkey: appkey,
      logger: function (/* log */) {
        // common.console.log(JSON.stringify(log));
      },
      RongIMLib: RongIMLib,
      error: function (error) {
        common.console.error('rtc error', error);
        emitter.emit(Event.RTC_ERRORED);
      }
    });
    loginUserId = userId;
    
    setRoomListener(roomId);
    setStreamListener();

    var user = {
      id: userId,
      token: token
    };
    return rongRTCRoom.join(user).then(function () {
      emitter.emit(Event.USER_JOINED, user);
    });
  }

  var rtc = {
    init: init,
    leave: leave,
    publishSelf: publishSelf,
    unPublishSelf: unPublishSelf,

    openAudio: openAudio,
    closeAudio: closeAudio,
    openVideo: openVideo,
    closeVideo: closeVideo,

    clearScreenShareChooseBox: clearScreenShareChooseBox,
    publishScreenShare: publishScreenShare,
    unPublishScreenShare: unPublishScreenShare,

    getStreamSwitch: getStreamSwitch
  };

  RongClass.dataModel = RongClass.dataModel || {};
  utils.extend(RongClass.dataModel, {
    rtc: rtc
  });

})(window.RongClass, {
  RongIMLib: window.RongIMLib,
  RongRTC: window.RongRTC,
  RongMedia: window.RongMedia,
  RongScreenShare: window.RongScreenShare,
  win: window
});