// import router from './index'

// //from要离开的路由，to要前往的路由,next是一个方法，可以指定路由地址，进行跳转
// router.beforeEach((to, from, next) => {
//   const token = sessionStorage.getItem('loginuser');
 
//   if (token==null) { //没有获取到用户信息
//     if (to.path !== '/login') { //访问的是非登录页，因为没有登录，就让她去登录页
//       next({ path: '/login' })
//     }
//     else if (to.path == '/register') { //点击注册可以去
//         next({ path: '/register' })
//     }
//     else if (to.path == '/forget') { //点击注册可以去
//         next({ path: '/forget' })
//     }
//     else if (to.path == '/modify') { //点击注册可以去
//         next({ path: '/modify' })
//     }
//     else{       //访问的是登录页，让她去登录页
//       next()
//     }
//   }   
//   else{    //获取到了用户信息
//     if(to.path==='/login'){
//         next()
//     }
//     else{   //去非登录页
//         next()
//     }
//   }
// })