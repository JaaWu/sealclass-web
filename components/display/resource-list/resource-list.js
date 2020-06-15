(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    ENUM = RongClass.ENUM,
    DisplayType = ENUM.DisplayType,
    RoleENUM = ENUM.Role;

  components.resourceList = function (resolve) {
    var options = {
      name: 'recentShare',
      template: '#rong-template-resource-list',
      props: ['whiteboardList', 'assistant', 'teacher', 'displayRecent', 'createWhiteboard', 'needNewWhiteboard'],
      data: function () {
        return {
        };
      },
      computed: {
        displayedUser: function () {
          return this.teacher || this.assistant;
        },
      },
      components: {
        'rtc-user': components.rtcUser
      },
      mounted: function () {
      },
      methods: {
        displayUser: function () {
          var user = this.displayedUser,
            role = user.role;
          var displayType = role === RoleENUM.TEACHER ? DisplayType.TEACHER : DisplayType.ASSISTANT;
          this.displayRecent({
            type: displayType,
            userId: common.getUserId(user)
          });
        },
        displayWB: function (wb) {
          this.displayRecent({
            type: DisplayType.WHITEBOARD,
            uri: wb.whiteboardId
          });
        }
      }
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);