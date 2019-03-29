(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    utils = RongClass.utils,
    emitter = utils.EventEmitter,
    chatServer = RongClass.dataModel.chat;

  var Event = RongClass.ENUM.Event;

  function scrollToBottom() {
    RongClass.instance.$emit('message-scroll-bottom');
  }

  function getSendCallbacks(context) {
    return {
      onSuccess: function (msg) {
        context.messageList.push(msg);
        scrollToBottom();
      },
      onError: function (error) {
        common.console.log('发送消息失败', error);
      }
    };
  }

  function addHistoryMessages(context) {
    if (1 || context.isMsgLoading || !context.hasMoreMsg) { // 一期不处理
      return;
    }
    context.isMsgLoading = true;
    var messageList = context.messageList;
    var lastMsg = context.messageList[messageList.length - 1] || {};
    var lastSentTime = lastMsg.sentTime || 0;
    chatServer.getHistoryMessages(lastSentTime, {
      onSuccess: function (list, hasMore) {
        context.hasMoreMsg = hasMore;
        context.isMsgLoading = false;
        context.messageList = list.concat(messageList);
      },
      onError: function (err) {
        context.isMsgLoading = false;
        common.console.log('get history message err', err);
      }
    })
  }

  function getMethods() {
    return {
      sendText: function (content) {
        var callbacks = getSendCallbacks(this);
        chatServer.sendTextMessage(content, callbacks);
      },
      sendImage: function (base64, url) {
        var callbacks = getSendCallbacks(this);
        chatServer.sendImageMessage(base64, url, callbacks);
      },
      sendFile: function (content) {
        var callbacks = getSendCallbacks(this);
        chatServer.sendFileMessage(content, callbacks);
      },
      addHistoryMessages: function () {
        addHistoryMessages(this);
      }
    };
  }

  components.chat = function (resolve) {
    var options = {
      name: 'chat',
      template: '#rong-template-chat',
      data: function () {
        return {
          messageList: [],
          isMsgLoading: false,
          hasMoreMsg: true
        };
      },
      components: {
        'message-list': components.messageList,
        'message-input': components.messageInput
      },
      mounted: function () {
        var context = this;
        emitter.on(Event.MESSAGE_RECEIVED, function (message) {
          // filter
          context.messageList.push(message);
          scrollToBottom();
        });
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);