(function (RongClass, dependencies, components) {
  'use strict';
  var win = dependencies.win,
    RongIMLib = win.RongIMLib,
    dataModel = RongClass.dataModel,
    server = dataModel.server;

  var common = RongClass.common;

  var SupportMessageList = [
    'TextMessage',
    'ImageMessage',
    'FileMessage',
    'AssistantTransferMessage',
    'RoleChangedMessage',
    'RoomMemberChangeMessage'
  ];

  var NotifyMessageList = [
    'AssistantTransferMessage',
    'RoleChangedMessage',
    'RoomMemberChangeMessage'
  ];

  /* 兼容 server 发讲师变更消息错误 */
  function formatRoleChangedToAstTransMsg(message) {
    // if (message.messageType !== 'RoleChangedMessage') {
    //   return message;
    // }
    // var users = message.content.users,
    //   user = users.length ? users[0] : {};
    // if (user.role === RoleENUM.TEACHER) {
    //   message.messageType = 'AssistantTransferMessage';
    //   message.content = { toUserId: user.userId || user.id };
    // }
    return message;
  }

  function watchScrollToBottom(context) {
    var instance = RongClass.instance;
    instance.$on('message-scroll-bottom', function () {
      instance.$nextTick(function () {
        var refs = context.$refs;
        var lastMsgEl = refs['msg-lasted'];
        if (lastMsgEl) {
          lastMsgEl.scrollIntoViewIfNeeded();
        }
      });
    });
  }

  function getMethods() {
    return {
      isSelfSend: function (message) {
        var messageDirection = message.messageDirection;
        return messageDirection === RongIMLib.MessageDirection.SEND;
      },
      isShowAvatar: function (message) {
        return NotifyMessageList.indexOf(message.messageType) === -1;
      },
      isSupport: function (message) {
        var messageType = message.messageType;
        return SupportMessageList.indexOf(messageType) !== -1;
      },
      getMsgSender: function (message) {
        var senderUserId = message.senderUserId;
        return server.getUserById(senderUserId);
      },
      getMsgSenderName: function (message) {
        var sender = this.getMsgSender(message);
        return common.getUserName(sender);
      },
      scrollList: function (e) {
        var target = e.target;
        var scrollTop = target.scrollTop;
        if (scrollTop < 10) {
          this.addHistoryMessages();
        }
      }
    };
  }

  components.messageList = function (resolve) {
    var options = {
      name: 'message-list',
      template: '#rong-template-messagelist',
      props: ['messageList', 'addHistoryMessages'],
      data: function () {
        return {
        };
      },
      computed: {
        displayedMessageList: function () {
          var context = this;
          var messageList = context.messageList;
          var displayList = messageList.map(function (msg) {
            return formatRoleChangedToAstTransMsg(msg);
          });
          return displayList.filter(function (msg) {
            return context.isSupport(msg);
          });
        }
      },
      components: {
        'user-avatar': components.userAvatar,
        'TextMessage': components.textMessage,
        'ImageMessage': components.imageMessage,
        'FileMessage': components.fileMessage,
        'RoleChangedMessage': components.roleChangeMessage,
        'AssistantTransferMessage': components.assistantTransferMessage,
        'RoomMemberChangeMessage': components.memberChangeMessage
      },
      methods: getMethods(),
      mounted: function () {
        watchScrollToBottom(this);
      }
    };
    common.component(options, resolve);
  };
  
})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);