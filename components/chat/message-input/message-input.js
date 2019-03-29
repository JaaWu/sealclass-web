(function (RongClass, dependencies, components) {
  'use strict';

  var win = dependencies.win;

  var common = RongClass.common,
    utils = RongClass.utils,
    chatServer = RongClass.dataModel.chat,
    dialog = RongClass.dialog,
    ErrorCode = RongClass.ErrorCode;

  function upload(isImage, file) {
    var func = isImage ? chatServer.uploadImage : chatServer.uploadFile;
    return new win.Promise(function (resolve, reject) {
      func(file, {
        onComplete: function (result) {
          var url = result.downloadUrl;
          resolve(url);
        },
        onError: reject
      });
    });
  }

  function isEmptyFile(target) {
    var files = target.target.files;
    return files.length === 0;
  }

  function uploadAndSendImage(context, file) {
    win.Promise.all([utils.loadFileBase64(file), upload(true, file)])
      .then(function (resultList) {
        var base64 = resultList[0],
          url = resultList[1];
        context.sendImage(base64, url);
      })
      .catch(function (error) {
        var errorCode = ErrorCode.UPLOAD_FILE_ERROR;
        dialog.confirm({
          content: context.locale.errorCode[errorCode]
        });
        common.console.log('upload image error', error);
      });
  }

  function uploadAndSendFile(context, file) {
    upload(false, file).then(function (url) {
      context.sendFile({
        name: file.name,
        size: file.size,
        type: file.type,
        fileUrl: url
      });
    });
  }

  function clearContentText(context) {
    context.$nextTick(function () {
      context.content = '';
    });
  }

  function getMethods() {
    return {
      sendTextMsg: function () {
        var content = this.content;
        if (content) {
          this.sendText(content);
          clearContentText(this);
        }
      },
      uploadImage: function (content) {
        if (isEmptyFile(content)) {
          return;
        }
        var file = content.target.files[0];
        uploadAndSendImage(this, file);
      },
      uploadFile: function (content) {
        if (isEmptyFile(content)) {
          return;
        }
        var file = content.target.files[0];
        uploadAndSendFile(this, file);
      },
      controlEmojiPanel: function () {
        this.isShowEmojiPanel = !this.isShowEmojiPanel;
      },
      hideEmojiPanel: function () {
        this.isShowEmojiPanel = false;
      },
      selectEmoji: function (emoji) {
        this.content += emoji;
        var textarea = this.$refs.textarea;
        textarea.focus();
      },
      keydown: function (e) {
        var context = this;
        var ev = document.all ? window.event : e;
        if (ev.keyCode === 13 && !ev.shiftKey) {
          context.sendTextMsg();
          return ev.preventDefault();
        }
      }
    };
  }

  components.messageInput = function (resolve) {
    var options = {
      name: 'message-input',
      props: ['sendText', 'sendImage', 'sendFile'],
      data: function () {
        return {
          content: '',
          isShowEmojiPanel: false
        }
      },
      template: '#rong-template-messageinput',
      components: {
        'emoji-panel': components.emojiPanel
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };
  
})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);