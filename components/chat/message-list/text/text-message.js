(function (RongClass, dependencies, components) {
  'use strict';

  var common = RongClass.common;

  function getMethods() {
    return {
      
    };
  }

  components.textMessage = function (resolve) {
    var options = {
      name: 'text-message',
      template: '#rong-template-text-message',
      props: ['message'],
      computed: {
        content: function () {
          var content = this.message.content || {};
          return content.content || '';
        },
        contentHtml: function () {
          var content = this.content;
          return common.textFormat(content, 17);
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