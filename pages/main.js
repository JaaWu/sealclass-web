(function (RongClass, dependencies) {
  'use strict';

  var Vue = dependencies.Vue;
  var VueRouter = dependencies.VueRouter;
  var routes = RongClass.routes;

  function getRouter() {
    var ignoreAuthRoutes = ['login'];
    var router = new VueRouter({
      routes: routes.maps
    });
    router.beforeEach(function (to, from, next) {
      var toName = to.name;
      var instance = RongClass.instance || {};
      var auth = instance.auth;
      if (ignoreAuthRoutes.indexOf(toName) === -1 && !auth) {
        return next({ name: 'login' });
      }
      next();
    });
    return router;
  }

  function init(config) {
    var rongClass = new Vue({
      el: config.el,
      router: getRouter(),
      data: function () {
        return {
          isMuted: false
        };
      },
      mixins: [
        RongClass.mixins.locale
      ],
      computed: {
        selfVideoClassName: function () {
          return 'rong-video-self';
        }
      },
      methods: {
        setMute: function (isMute) {
          this.isMuted = isMute;
        },
        fullClick: function (event) {
          this.$emit('fullClick', event);
        }
      }
    });

    RongClass.instance = rongClass;
  }

  RongClass.init = init;

})(window.RongClass, {
  Vue: window.Vue,
  VueRouter: window.VueRouter
});