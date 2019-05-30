(function (RongClass, dependencies, components) {
  'use strict';
  var common = RongClass.common,
    dialog = RongClass.dialog,
    utils = RongClass.utils,
    ENUM = RongClass.ENUM,
    DisplayType = ENUM.DisplayType,
    RoleENUM = ENUM.Role,
    Event = ENUM.Event;
  
  var emitter = utils.EventEmitter,
    server = RongClass.dataModel.server,
    rtcServer = RongClass.dataModel.rtc,
    DefaultDisplay = {
      type: DisplayType.NONE,
      whiteboardId: null,
      userId: ''
    };

  function displayRecent(context, displayParams) {
    server.display(displayParams).then(function () {
      context.display = displayParams;
      context.isScreenSharePublished = displayParams.type === DisplayType.SCREEN;
    });
  }

  function closeScreenShare(context) {
    if (context.isScreenSharePublished) {
      rtcServer.unPublishScreenShare();
      context.isScreenSharePublished = false;
    }
  }

  function showScreenPluginInstallDiloag() {
    var path = RongClass.setting.rtc.screenPluginPath;
    dialog.confirm({
      content: '首次使用屏幕共享, 请下载并安装插件',
      cancelName: '不需要',
      confirmName: '下载插件',
      confirmed: function () {
        utils.download(path);
      }
    });
  }

  function setDisplayWhenChanged(context) {
    emitter.on(Event.USER_CLAIM_DISPLAY, function (display) {
      context.display = display;
    });
  }

  function setWhiteBoardWhenChanged(context) {
    emitter.on(Event.WHITEBOARD_CREATED, function (whiteboardDetail) {
      context.whiteboardList.push(whiteboardDetail);
    });
    emitter.on(Event.WHITEBOARD_DELETED, function (whiteboardDetail) {
      var whiteboardIdList = context.whiteboardList.map(function (whiteboard) {
        return whiteboard.whiteboardId;
      });
      var index = whiteboardIdList.indexOf(whiteboardDetail.whiteboardId);
      index >= 0 && context.whiteboardList.splice(index, 1);
    });
  }

  function hideSourceListWhenFullClick(context) {
    var instance = RongClass.instance;
    instance.$on('fullClick', function (event) {
      var target = event.target;
      var notHideSelector = '.rong-display-icon-box, .rong-recent-share-box';
      var inWrap = utils.closest(target, notHideSelector);
      if (!inWrap) {
        context.isShowResourceList = false;
      }
    });
  }

  // function watchFullClick() {
    
  // }

  function watchWindowBlur() {
    // win.addEventListener('blur', function () {
    //   rtcServer.clearScreenShareChooseBox();
    // });
  }

  function setDefaultDisplay(params, context) {
    var display = params.display;
    context.display = common.formatDisplayString(display) || DefaultDisplay;
  }

  function getMethods() {
    return {
      displayRecent: function (displayParams) {
        if (this.isResourceEnable) {
          displayRecent(this, displayParams);
          this.isShowResourceList = false;
        }
      },
      createWhiteboard: function () {
        var context = this;
        dialog.createWB({
          success: function (whiteboardId) {
            context.whiteboardList.push({ whiteboardId: whiteboardId });
            var display = {
              type: DisplayType.WHITEBOARD,
              uri: whiteboardId
            };
            displayRecent(context, display);
          }
        });
      },
      displayScreenShare: function () {
        var context = this,
          loginUserId = server.getLoginUserId();
        if (context.isScreenShareDisable) {
          return;
        }
        var display = {
          type: DisplayType.SCREEN,
          userId: loginUserId
        };
        rtcServer.publishScreenShare().then(function (user) {
          var mediaStream = user.stream.mediaStream;
          mediaStream.oninactive = function () {
            closeScreenShare(context);
            // 如果当前展示的不是自己的屏幕共享, 则不需要主动调用清空
            var isDisplaySelfScreen = context.display.userId === loginUserId;
            isDisplaySelfScreen = isDisplaySelfScreen && context.display.type === DisplayType.SCREEN;
            isDisplaySelfScreen && displayRecent(context, DefaultDisplay);
          };
          displayRecent(context, display);
        }).catch(function (error) {
          !error.message && showScreenPluginInstallDiloag();
        });
      },
      getUserById: function (id) {
        return common.getUserById(this.userList, id);
      }
    };
  }

  components.display = function (resolve) {
    var options = {
      name: 'display',
      template: '#rong-template-display',
      props: ['loginUser', 'userList', 'assistant', 'teacher'],
      data: function () {
        return {
          display: DefaultDisplay,
          whiteboardList: [],
          isShowResourceList: false,
          isScreenSharePublished: false
        };
      },
      computed: {
        DisplayType: function () {
          return DisplayType;
        },
        hasOptPermission: function () {
          var user = this.loginUser;
          return [RoleENUM.ASSISTANT, RoleENUM.TEACHER].indexOf(user.role) !== -1;
        },
        hasDisplayAuth: function () {
          var displayType = this.display.type,
            displayId = this.display.userId;
          var hasDisplayAuth = true;
          var isWb = displayType == DisplayType.WHITEBOARD;
          if (!utils.isNull(displayId) && !isWb) { // 兼容角色变换但 server 未发送更换 display 消息, 不展示学生、旁观者的用户视频
            var user = server.getUserById(displayId);
            hasDisplayAuth = [RoleENUM.ASSISTANT, RoleENUM.TEACHER].indexOf(user.role) !== -1;
          }
          var isDisplayNull = utils.isNull(displayType) || displayType === DisplayType.NONE;
          return !isDisplayNull && hasDisplayAuth;
        },
        isShowResource: function () {
          var user = this.loginUser;
          return [RoleENUM.ASSISTANT, RoleENUM.TEACHER, RoleENUM.STUDENT].indexOf(user.role) !== -1;
        },
        isResourceEnable: function () {
          var user = this.loginUser;
          return [RoleENUM.ASSISTANT, RoleENUM.TEACHER ].indexOf(user.role) !== -1;
        },
        isScreenShareDisplaying: function () {
          var display = this.display;
          return display.type === DisplayType.SCREEN;
        },
        isChrome: function () {
          var browserName = utils.getBrowser().type;
          return browserName === 'Chrome';
        },
        isScreenShareDisable: function () {
          return this.isScreenShareDisplaying || !this.isChrome;
        }
      },
      components: {
        'resourceList': components.resourceList,
        'rtc-user': components.rtcUser,
        'whiteboard': components.whiteboard
      },
      methods: getMethods(),
      watch: {
        'display.type': function () {
          closeScreenShare(this);
        }
      },
      mounted: function () {
        var routeParams = this.$route.params,
          context = this;
        context.whiteboardList = routeParams.whiteboards;
        setWhiteBoardWhenChanged(context);
        setDisplayWhenChanged(context);
        setDefaultDisplay(routeParams, context);
        hideSourceListWhenFullClick(context);
        watchWindowBlur();
      }
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);