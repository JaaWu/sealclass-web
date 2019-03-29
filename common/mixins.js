(function (RongClass, dependencies) {
  'use strict';
  var utils = RongClass.utils;
  var Vue = dependencies.Vue;

  /* 输入校验 */
  var validate = (function () {
    
    var rulePrefix = 'data-rule-',
      messagePrefix = 'data-message-',
      checkValidEventList = ['blur', 'check'],
      deleteValidEventList = ['focus', 'keyup'],
      childTypes = ['input', 'textarea', 'select'],
      childTypeString = childTypes.join(',');

    var methods = {
      required: function (value) {
        return value.length > 0;
      },
      classlength: function (value) {
        return value.length <= 40;
      },
      namelength: function (value) {
        return value.length <= 10;
      },
      handlesymbol: function (value) {
        var reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/;
        return reg.test(value);
      },
      isnotchinese: function (value) {
        var reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g');
        return !reg.test(value);
      }
    };

    var getRules = function (field) {
      var rules = {};
      var attributeNames = utils.getAttributeNames(field);
      attributeNames.forEach(function (attr) {
        var index = attr.indexOf(rulePrefix);
        if (index !== -1) {
          var name = attr.substring(rulePrefix.length);
          var ruleAttrName = rulePrefix + name;
          rules[name] = field.getAttribute(ruleAttrName);
        }
      });
      return rules;
    };

    var check = function (context, field) {
      Vue.delete(context.errors, field.name);
      var ruleList = getRules(field);
      for (var ruleName in ruleList) {
        var ruleValue = ruleList[ruleName];
        var method = methods[ruleName];
        var text = field.value;
        var valid = method(text, field, ruleValue);
        if (!valid) {
          var messageAttrName = messagePrefix + ruleName;
          var message = field.getAttribute(messageAttrName);
          Vue.set(context.errors, field.name, message);
        }
        // return valid;
      }
    }

    var validateField = function (context, event) {
      var field = event.target;
      var tabKey = (event.key || '').toLowerCase() === 'tab';
      var tabKeyCode = event.keyCode === 9;
      var isTab = tabKey || tabKeyCode;
      var enterKey = (event.key || '').toLowerCase() === 'enter';
      var enterKeyCode = event.keyCode === 13;
      var isEnter = enterKey || enterKeyCode;
      if (isTab || isEnter) {
        return;
      }
      check(context, field);
    };

    var deleteValidate = function (context, event) {
      var isTab = (event.key || '').toLowerCase() === 'tab' || event.keyCode === 9;
      var isEnter = (event.key || '').toLowerCase() === 'enter' || event.keyCode === 13;
      if (isTab || isEnter) {
        return;
      }
      Vue.delete(context.errors, event.target.name);
    };
    
    var init = function () {
      var context = this;
      var $el = context.$el;
      var validElList = $el.querySelectorAll(childTypeString);
      validElList.forEach(function (el) {
        checkValidEventList.forEach(function (eventName) {
          el.addEventListener(eventName, function (event) {
            validateField(context, event);
          });
        });
        deleteValidEventList.forEach(function (eventName) {
          el.addEventListener(eventName, function (event) {
            deleteValidate(context, event);
          });
        });
      });

    };

    return {
      name: 'validate',
      data: function () {
        return {
          errors: {}
        };
      },
      computed: {
        isValid: function () {
          var errors = JSON.parse(JSON.stringify(this.errors));
          return utils.isObjectEmpty(errors);
        }
      },
      mounted: init,
      methods: {
        checkValid: function () {
          var context = this;
          var $el = context.$el;
          var validElList = $el.querySelectorAll(childTypes);
          validElList.forEach(function (validEl) {
            check(context, validEl);
          });
          return context.isValid;
        }
      }
    }
  })();

  var locale = (function () {
    return {
      name: 'rong-locale',
      data: function () {
        var lang = RongClass.setting.lang;
        var locale = RongClass.locale[lang];
        return {
          locale: locale
        }
      },
      methods: {
        formatLocale: function (locale, data) {
          return utils.tplEngine(locale, data);
        }
      }
    }
  })();

  RongClass = RongClass || {};
  RongClass.mixins = {
    validate: validate,
    locale: locale
  };
})(window.RongClass, {
  Vue: window.Vue
});