(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    utils = RongClass.utils,
    win = dependencies.win,
    dialog = RongClass.dialog;

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
    loadingWB = dialog.loading({
      content: '白板正在加载中'
    });
    context.$nextTick(function () {
      var iframe = context.$refs.wbIframe;
      iframe.onload = function () {
        loadingWB.destroy();
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
    });
  }

  function setFullScreen(isZoom, context) {
    context.$nextTick(function () {
      var el = context.$el;
      context.isZoom = isZoom;
      isZoom ? utils.entryFullScreen(el) : utils.quitFullScreen(el);
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