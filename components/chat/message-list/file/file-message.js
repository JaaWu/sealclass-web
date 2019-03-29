(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common;

  function getMethods() {
    return {

    };
  }

  components.fileMessage = function (resolve) {
    var options = {
      name: 'file-message',
      template: '#rong-template-file-message',
      props: ['message'],
      computed: {
        content: function () {
          var content = this.message.content || {};
          return content.content || '';
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