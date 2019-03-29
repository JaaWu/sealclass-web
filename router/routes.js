(function (RongClass) {
  
  var components = RongClass.components;

  RongClass.routes = {
    maps: [
      {
        path: '/login',
        name: 'login',
        component: components.login
      },
      {
        path: '/class',
        name: 'class',
        component: components.class
      },
      {
        path: '*',
        redirect: '/login'
      }
    ]
  };
  
})(window.RongClass);