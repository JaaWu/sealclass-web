(function (RongClass, dependencies, components) {
  'use strict';
  var common = RongClass.common,
    dataModel = RongClass.dataModel,
    rtcServer = dataModel.rtc,
    Role = RongClass.ENUM.Role,
    dialog = RongClass.dialog;

  function getMethods() {
    return {
      
    };
  }

  components.rtc = function (resolve) {
    var options = {
      name: 'rong-rtc',
      template: '#rong-template-rtc',
      props: ['userList', 'loginUser', 'hungup', 'closeClass'],
      data: function () {
        return {
        };
      },
      computed: {
        // student or assistant or teacher
        showUserList: function () {
          var userList = this.userList.filter(function (user) {
            var role = user.role;
            return role === Role.STUDENT || role === Role.ASSISTANT || role === Role.TEACHER;
          });
          return common.sortByRole(userList);
        },
        teacher: function () {
          var teacherList = this.userList.filter(function (user) {
            return user.role === Role.TEACHER;
          });
          var teacherCount = teacherList.length;
          var teacher = teacherCount ? teacherList[teacherCount - 1] : null;
          return teacher;
        }
      },
      components: {
        'rtc-user': components.rtcUser,
        'self-rtc-operate': components.selfRTCOperate
      },
      watch: {
        'loginUser.role': function (newRole, oldRole) {
          if (newRole === Role.AUDIENCE) {
            rtcServer.unPublishSelf();
          }
          if (oldRole === Role.AUDIENCE) {
            var resolution = this.$route.params.resolution;
            rtcServer.publishSelf(resolution, true, true);
          }
        }
      },
      mounted: function () {
        var routerData = this.$route.params,
          isAudience = routerData.isAudience,
          resolution = routerData.resolution,
          videoEnable = routerData.videoEnable,
          device = routerData.videoInput,
          audioEnable = true;

        // if (!this.isTeacher) {
        //   videoEnable = false;
        // }
        !isAudience && rtcServer.publishSelf(resolution, videoEnable, audioEnable, {
          device: device
        }).catch(function (error) {
          error = error || {};
          var errorMsg = RongClass.instance.locale.errorCode[error.code] || error;
          dialog.confirm({
            content: errorMsg
          });
          common.console.error(error);
        });
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);