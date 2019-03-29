(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common,
    utils = RongClass.utils;

  components.classInfo = function (resolve) {
    var options = {
      name: 'class-info',
      template: '#rong-template-classinfo',
      data: function () {
        return {
          roomId: '',
          timer: { time: 0 }
        }
      },
      computed: {
        formatedTime: function () {
          var time = this.timer.time;
          return utils.timeToFormat(time);
        }
      },
      created: function () {
        this.timer = new utils.Timer();
        this.timer.start();
        this.roomId = this.$route.params.roomId;
      },
      destroyed: function () {
        this.timer.end();
      }
    };
    common.component(options, resolve);
  };
  
})(window.RongClass, {
  Vue: window.Vue
}, window.RongClass.components);