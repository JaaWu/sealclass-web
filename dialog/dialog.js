(function (RongClass/* dependencies */) {
  'use strict';
  var utils = RongClass.utils;
  // win = dependencies.win;
  var setting = RongClass.setting,
    components = RongClass.components,
    toastTime = setting.class.toastTime,
    ENUM = RongClass.ENUM,
    DialogType = ENUM.DialogType,
    ButtonsType = DialogType.BUTTONS;

  var ShowShadowLayerTypes = [
    DialogType.CONFIRM, DialogType.ALERT, DialogType.LOADING, DialogType.APPLY
  ];

  var OnTopTypes = [
    DialogType.CALL, DialogType.TOAST, DialogType.APPLY
  ];

  var AutoDestroyType = [
    DialogType.APPLY, DialogType.CALL, DialogType.TOAST, DialogType.ALERT
  ];

  var removeSelf = function (context) {
    if (context.isShow) {
      context.isShow = false;
      var parent = context.$el.parentElement;
      parent.removeChild(context.$el);
    }
  };

  var getDefaultBtns = function (buttons) {
    buttons.forEach(function (btn) {
      if (!btn.type) {
        btn.type = ButtonsType.CONFIRM;
      }
      if (btn.type === ButtonsType.CONFIRM) {
        btn.name = btn.name || '确定';
      }
      if (btn.type === ButtonsType.CANCEL) {
        btn.name = btn.name || '取消';
      }
    });
    return buttons;
  };

  var getDefaultContent = function (content, type) {
    if (type === DialogType.LOADING) {
      content = content || '加载中 ...';
    }
    return content;
  };

  var getDefaultAudoDestroy = function (type, autoDestory) {
    if (autoDestory) {
      return autoDestory;
    }
    if (AutoDestroyType.indexOf(type) !== -1) {
      return true;
    }
    return false;
  }

  /**
   * @param {Object} options
   * @param {string} options.type 类型
   * @param {string} options.content 文本
   * @param {string} options.title 标题
   * @param {string} options.user 用户信息
   * @param {boolean} options.autoDestroy 是否自动销毁
   * @param {string} options.destroyTimeout 自动销毁倒计时时间
   * @param {Array} options.buttons 自动销毁倒计时时间
   * @param {Object} options.position 坐标
   */
  var dialog = function (options) {
    options = options || {};
    var autoDestroy = getDefaultAudoDestroy(options.type, options.autoDestroy);
    var destroyTimeout = options.destroyTimeout || toastTime;
    var onDestoryed = options.onDestoryed || utils.noop;

    var common = RongClass.common;

    return common.mountDialog({
      name: 'rong-dialog',
      template: '#rong-template-dialog',
      data: function () {
        return {
          isShow: true,
          type: options.type || DialogType.CONFIRM,
          title: options.title,
          content: getDefaultContent(options.content, options.type),
          buttons: getDefaultBtns(options.buttons || []),
          user: options.user
        };
      },
      computed: {
        DialogType: function () {
          return DialogType;
        },
        ButtonsType: function () {
          return ButtonsType;
        },
        isShowShadowLayer: function () {
          var type = this.type;
          return ShowShadowLayerTypes.indexOf(type) !== -1;
        },
        isOnTop: function () {
          var type = this.type;
          return OnTopTypes.indexOf(type) !== -1;
        },
        isContentCenter: function () {
          var content = this.content,
            user = this.user;
          return user || content.length < 15;
        },
        dialogStyle: function () {
          return options.position;
        }
      },
      components: {
        'user-avatar': components.userAvatar
      },
      mounted: function () {
        var context = this;
        autoDestroy && setTimeout(function () {
          if (context.isShow) {
            context.destroy();
            onDestoryed();
          }
        }, destroyTimeout);
      },
      methods: {
        click: function (opt) {
          var isKeep = opt.isKeep;
          opt.onclick && opt.onclick();
          !isKeep && removeSelf(this);
        },
        destroy: function () {
          removeSelf(this);
        }
      }
    });
  };

  var dialogs = {
    confirm: function (options) {
      options.title = options.title || '提示';
      options.buttons = [];
      if (!options.isHideCancel) {
        options.buttons.push({ type: ButtonsType.CANCEL, onclick: options.canceled, name: options.cancelName });
      }
      options.buttons.push({ type: ButtonsType.CONFIRM, onclick: options.confirmed, name: options.confirmName });
      dialog(options);
    },
    call: function (options) {
      options.buttons = [
        { type: ButtonsType.REJECT, onclick: options.rejected },
        { type: ButtonsType.ACCEPT, onclick: options.accpeted }
      ];
      options.type = DialogType.CALL;
      return dialog(options);
    },
    apply: function (options) {
      options.type = DialogType.APPLY;
      options.buttons = [
        { type: ButtonsType.CANCEL, onclick: options.rejected, name: '拒绝申请' },
        { type: ButtonsType.CONFIRM, onclick: options.degraded, name: '降级学员' }
      ];
      return dialog(options);
    },
    alert: function (options) {
      options.type = DialogType.ALERT;
      return dialog(options);
    },
    loading: function (options) {
      options = options || {};
      options.type = DialogType.LOADING;
      return dialog(options);
    },
    toast: function (options) {
      options.type = DialogType.TOAST;
      return dialog(options);
    }
  };

  RongClass.dialog = utils.extend(dialog, dialogs);

})(window.RongClass, {
  win: window
});