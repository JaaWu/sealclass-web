(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    utils = RongClass.utils,
    ENUM = RongClass.ENUM,
    RoleENUM = ENUM.Role,
    server = RongClass.dataModel.server;

  function getMethods() {
    return {
      getContentByUser: function (user) {
        var role = user.role,
          userId = common.getUserId(user);
        user = server.getUserById(userId);
        var roleName = RoleENUM[role];
        roleName = this.locale.class[roleName];
        return utils.tplEngine('{userName} 成为{roleName}', {
          userName: common.getUserName(user),
          roleName: roleName
        });
      }
    };
  }

  components.roleChangeMessage = function (resolve) {
    var options = {
      name: 'role-change-message',
      template: '#rong-template-role-change-message',
      props: ['message'],
      computed: {
        users: function () {
          return this.message.content.users;
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