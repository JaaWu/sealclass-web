(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    server = RongClass.dataModel.server;

  components.assistantTransferMessage = function (resolve) {
    var options = {
      name: 'assistant-transfer-message',
      template: '#rong-template-assistant-transfer-message',
      props: ['message'],
      computed: {
        optUserName: function () {
          var message = this.message,
            content = message.content,
            toUserId = content.toUserId;
          var toUser = server.getUserById(toUserId);
          return common.getUserName(toUser);
        }
      },
      mounted: function () {

      }
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);