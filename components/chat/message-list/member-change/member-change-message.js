(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    RoomAction = RongClass.ENUM.RoomAction;

  function getMethods() {
    return {
    };
  }

  components.memberChangeMessage = function (resolve) {
    var options = {
      name: 'member-change-message',
      template: '#rong-template-member-change-message',
      props: ['message'],
      computed: {
        userName: function () {
          return this.message.content.userName;
        },
        contentText: function () {
          var action = this.message.content.action;
          var content;
          if (action === RoomAction.KICK || action === RoomAction.LEAVE) {
            content = this.userName + ' 离开房间';
          }
          return content;
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