(function (RongClass) {
  'use strict';
  var utils = RongClass.utils,
    ENUM = RongClass.ENUM,
    RoleENUM = ENUM.Role,
    server = RongClass.dataModel.server;

  var removeSelf = function (context) {
    context.isShow = false;
    var parent = context.$el.parentElement;
    parent.removeChild(context.$el);
  };

  function setDefaultSelected(list) {
    return list.map(function (user) {
      user.isSelected = false;
      return user;
    });
  }
  RongClass.dialog.degrade = function (options) {
    var common = RongClass.common;

    options = options || {};
    var userList = options.userList || [],
      confirmEvent = options.confirmed || utils.noop,
      cancelEvent = options.canceled || utils.noop,
      failedEvent = options.failed || utils.noop;
    var loginUser = server.getLoginUser(),
      loginUserId = common.getUserId(loginUser);  
    
    userList = utils.parseObject(userList);
    userList = setDefaultSelected(userList);
    userList = userList.filter(function (user) {
      var userId = common.getUserId(user);
      return user.role !== RoleENUM.AUDIENCE && userId !== loginUserId;
    });

    common.mountDialog({
      name: 'degrade',
      template: '#rong-template-dialog-degrade',
      data: function () {
        return {
          isShow: true,
          userList: userList
        };
      },
      computed: {
        hasSelected: function () {
          var selectedUser = this.userList.filter(function (user) {
            return user.isSelected;
          });
          return selectedUser.length;
        }
      },
      methods: {
        cancel: function () {
          removeSelf(this);
          cancelEvent();
        },
        selectUser: function (user) {
          user.isSelected = !user.isSelected;
        },
        confirm: function () {
          var userList = this.userList;
          var downUserList = userList.filter(function (user) {
            return user.isSelected;
          });
          downUserList = downUserList.map(function (user) {
            user.userId = user.id || user.userId;
            user.role = RoleENUM.AUDIENCE;
            return user;
          });
          server.downgrade(downUserList).then(confirmEvent)
            .catch(failedEvent);
          removeSelf(this);
        }
      }
    });
  };

})(window.RongClass);