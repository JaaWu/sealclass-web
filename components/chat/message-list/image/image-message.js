(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common;

  function getMethods() {
    return {

    };
  }

  components.imageMessage = function (resolve) {
    var options = {
      name: 'image-message',
      template: '#rong-template-image-message',
      props: ['message'],
      computed: {
        base64: function () {
          var content = this.message.content || {};
          content = content.content || '';
          return 'data:image/jpeg;base64,' + content;
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