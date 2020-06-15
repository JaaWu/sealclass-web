(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    ENUM = RongClass.ENUM,
    utils = RongClass.utils,
    win = dependencies.win,
    Event = ENUM.Event,
    emitter = utils.EventEmitter,
    dialog = RongClass.dialog,
    isPrivate = RongClass.setting.isPrivate,
    server = RongClass.dataModel.server,
    whiteboradUrl = RongClass.setting.whiteboard.url;

  var loadingWB;

  function unWatchWindowResize(context) {
    win.removeEventListener('resize', context.resize);
  }

  function watchWindowResize(context) {
    context.resize = function () {
      unWatchWindowResize(context);
      if (context.isZoom) {
        context.isZoom = false;
      }
    };
    win.addEventListener('resize', context.resize);
  }

  function loadIframe(context) {
    var auth = RongClass.instance.auth,
      loginUser = auth.loginUser,
      loadingWBUpload;
    
    if(!context.hasLoadingWB){
      loadingWB = dialog.loading({
        content: '白板正在加载中'
      });
      context.hasLoadingWB = true;
    }
    context.$nextTick(function () {
      var whiteInfo = context.display.uri ? context.display.uri : context.display;
      if(!utils.isObject(whiteInfo)){
        return;
      }
      var iframe = context.$refs.wbIframe;
      if(!isPrivate){
        iframe.onload = function () {
          var iframeWin = iframe.contentWindow.window;
          var RongWhite = iframeWin.RongWhite;
          RongWhite.white.join({
            uuid: whiteInfo.id ? whiteInfo.id : whiteInfo.whiteboardId,
            roomToken: whiteInfo.roomToken ? whiteInfo.roomToken : whiteInfo.whiteboardRoomToken,
            isStu: context.isTeacher ? false : true
          }).then(function(){
            context.RongWhite = iframeWin.RongWhite;
            loadingWB.destroy();
          })
          RongWhite.white.whiteEvent.on('room-upload-start', function(){
            loadingWBUpload = dialog.loading({
              content: '正在上传中'
            });
          })
          RongWhite.white.whiteEvent.on('room-upload-end', function(){
            loadingWBUpload.destroy()
          })
          RongWhite.white.whiteEvent.on('room-upload-error', function(errType){
            loadingWBUpload.destroy();
            let errMsg = '不支持的文件格式! \n 当前支持文件: PPT、PPTX、Word、PDF 图片: PNG、 JPG、 JPEG ' ;
            common.toast(errMsg)
          })
          RongWhite.white.whiteEvent.on('room-destroy', function(){
            dialog.confirm({
              content: '当前已是最后一页，删除后将销毁此白板，是否继续删除？',
              position: utils.getCenterPosition(),
              confirmed: function () {
                // TODO 1、调用 Server 删除接口, 调用成功后 Server 会发送消息通知老师学生，然后修改页面
                // iframeWin.RongWhite.whiteRoom.disconnect()
                var id = whiteInfo.id ? whiteInfo.id : whiteInfo.whiteboardId
                server.deleteWhiteboard(id);
                whiteInfo.whiteboardId = id;
                emitter.emit(Event.WHITEBOARD_DELETED,whiteInfo);
              }
            });
          })
        };
        try {
          iframe.contentWindow.onclick = function (event) {
            RongClass.instance.$emit('fullClick', event);
          };
          // var iframeWin = iframe.contentWindow.window;
          // watchWindowKeydown(context, iframeWin);
        } catch (e) {
          common.console.log('iframe 与 本地非同域');
        }
      }else {
        //TODO 使用开源版本，兼容私有云
        iframe.onload = function () {
          loadingWB.destroy();
        };
        try {
          iframe.contentWindow.onclick = function (event) {
            RongClass.instance.$emit('fullClick', event);
          };
        } catch (e) {
          common.console.log('iframe 与 本地非同域');
        }
      }
    });
  }

  function setFullScreen(isZoom, context) {
    context.$nextTick(function () {
      var el = context.$el;
      context.isZoom = isZoom;
      isZoom ? utils.entryFullScreen(el) : utils.quitFullScreen(el);
      if(!isPrivate){
        setTimeout(() => {
          context.RongWhite.whiteRoom.refreshViewSize(); //白板 div 大小变化时需更新白板宽高数据
        }, 900)
      }
      if (isZoom) {
        setTimeout(() => {
          watchWindowResize(context);
        }, 800);
      } else {
        unWatchWindowResize(context);
      }
    });
  }

  function getMethods() {
    return {
      entryFullScreen: function () {
        setFullScreen(true, this);
      },
      cancelFullScreen: function () {
        setFullScreen(false, this);
      }
    };
  }

  components.whiteboard = function (resolve) {
    var options = {
      name: 'whiteboard',
      template: '#rong-template-whiteboard',
      props: ['display'],
      data: function () {
        return {
          isZoom: false
        };
      },
      computed: {
        displayUrl: function () {
          var auth = RongClass.instance.auth,
            loginUser = auth.loginUser;
          var uri = this.display.uri;
          uri += '&role={role}&roomId={roomId}&authorization={authorization}';
          uri = utils.tplEngine(uri, {
            role: loginUser.role,
            roomId: auth.roomId,
            authorization: auth.authorization
          });
          // uri = uri.replace('https://ke.rongcloud.cn/wb/index.html', 'https://imqa.rongcloud.net/web-mess/rongcloud-wb/index.html');
          if(!isPrivate){
            uri = whiteboradUrl;
          }
          return uri;
        }
      },
      destroyed: function () {
        unWatchWindowResize(this);
        loadingWB && loadingWB.destroy();
      },
      watch: {
        'display.uri': function () {
          loadIframe(this);
        }
      },
      mounted: function () {
        loadIframe(this);
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);