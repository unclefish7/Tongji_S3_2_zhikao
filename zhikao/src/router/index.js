import Vue from 'vue'
import VueRouter from 'vue-router'
import Main from '../components/main'


Vue.use(VueRouter)

//避免重复点击的警告，报错
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}


const routes = [
  {
    path: '/main',
    name: 'Main',
    component: Main,
    children: [
      {
        path: '/alluser',
        name: 'alluser',
        component: ()=>import('../views/user/allUser.vue')
      },
      {
        path: '/newuser',
        name: 'newuser',
        component: ()=>import('../views/user/newUser.vue')
      },
      {
        path: '/adduser',
        name: 'adduser',
        component: ()=>import('../views/user/adduser.vue')
      },
      {
        path: '/edituser',
        name: 'edituser',
        component: ()=>import('../views/user/edituser.vue')
      },
      {
        path: '/exam',
        name: 'exam',
        component: ()=>import('../views/exam/exam.vue')
      },
      {
        path: '/paper',
        name: 'paper',
        component: () => import('@/views/paper/paper.vue'),
      },
      {
        path: '/addpaper',
        name: 'addpaper',
        component: () => import('@/views/paper/addpaper.vue'),
      },
      {
        path: '/importpaper',
        name: 'importpaper',
        component: () => import('@/views/paper/importpaper.vue'),
      },
      {
        path: '/editpaper',
        name: 'editpaper',
        component: () => import('@/views/paper/editpaper.vue'),
      },
      {
        path: '/assignpaper',
        name: 'assignpaper',
        component: () => import('@/views/paper/assignpaper.vue'),
      },
      {
        path: '/checkpaper',
        name: 'checkpaper',
        component: () => import('@/views/paper/check.vue'),
      },
      {
        path: '/yulan',
        name: 'yulan',
        component: () => import('@/views/paper/yulan.vue'),
      },
      {
        path: '/question',
        name: 'question',
        component: () => import('@/views/question/question.vue'),
      },
      {
        path: '/addquestion',
        name: 'addquestion',
        component: () => import('@/views/question/addquestion.vue'),
      },
      {
        path: '/editquestion',
        name: 'editquestion',
        component: () => import('@/views/question/editquestion.vue'),
      },
    ]
  },
  {
    path: '/',
    name: 'Login',
    component: ()=>import('@/views/user/login.vue')
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: () => import('@/views/api_test.vue') // 替换为你的实际文件路径
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router

