<template>
  <div class="navbar">
    <el-menu
      class="el-menu-vertical-demo"
      @open="handleOpen"
      @close="handleClose"
      :collapse="$store.state.isCollapse"
      :default-openeds="openeds"
    >
    
  <body>
    <div id="app">

        <div v-if="usertype === 'admin'">
          <el-submenu index="1">
            <template slot="title">
              <i class="el-icon-s-goods"></i>
              <span>账户管理</span>
            </template>
            <el-menu-item index="1-1" @click="$router.push('/alluser')">
              <i class="el-icon-truck"></i>账户信息
            </el-menu-item>
          </el-submenu>

          <el-submenu index="2">
            <template slot="title">
              <i class="el-icon-document"></i>
              <span>试卷管理</span>
            </template>
            <el-menu-item index="2-1" @click="$router.push('/paper')">
              <i class="el-icon-s-finance"></i>所有试卷
            </el-menu-item>
          </el-submenu>
        </div>
        
        <div v-if="usertype === 'temp'">
          <el-submenu index="2">
            <template slot="title">
              <i class="el-icon-document"></i>
              <span>试卷管理</span>
            </template>
            <el-menu-item index="2-1" @click="$router.push('/paper')">
              <i class="el-icon-s-finance"></i>所有试卷
            </el-menu-item>
          </el-submenu>
        </div>
    </div>

    </body>

</el-menu>
</div>
</template>

<script>
export default {
data() {
return {
openeds: ["1", "2", "3"],
judge:"",

usertype: sessionStorage.getItem("TYPE"),

is_flag: 0,
};
},
created(){
},
methods: {
handleOpen(key, keyPath) {
},
handleClose(key, keyPath) {
},
},
};
</script>

<style scoped>
.el-menu-vertical-demo:not(.el-menu--collapse) {
width: 200px;
min-height: 650px;
}
</style>