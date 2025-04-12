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

        <p v-if="usertype === 'admin'">

  <el-submenu index="1">
    <template slot="title">
      <i class="el-icon-s-goods"></i>
      <span>账户管理</span>
    </template>
    <el-menu-item-group>
      <template slot="title">
        <i class="el-icon-truck"></i>查看账户信息
      </template>
      <el-menu-item index="1-1" @click="$router.push('/alluser')"><i class="el-icon-truck"></i>账户信息</el-menu-item>
    </el-menu-item-group>
  </el-submenu>

  <el-submenu index="2">
    <template slot="title">
      <i class="el-icon-document"></i>
      <span>试卷管理</span>
    </template>
    <el-menu-item-group>
      <el-menu-item index="2-1" @click="$router.push('/paper')">
        <i class="el-icon-s-finance"></i>所有试卷
      </el-menu-item>
    </el-menu-item-group>
  </el-submenu>

<!--
  <el-submenu index="4">
    <template slot="title">
      <i class="el-icon-setting"></i>
      <span>系统管理</span>
    </template>
    <el-menu-item-group>
      <el-menu-item index="4-1" @click="$router.push('/usersystem')">
        <i class="el-icon-user"></i>用户信息管理
      </el-menu-item>
      
     
    </el-menu-item-group>
  </el-submenu>


  <el-submenu index="5">
    <template slot="title">
      <i class="el-icon-document"></i>
      <span>公告管理</span>
    </template>
    <el-menu-item-group>
      <el-menu-item index="5-1" @click="$router.push('/showannounce')">
        <i class="el-icon-s-finance"></i>公告
        
      </el-menu-item>
      <el-menu-item index="5-2" @click="$router.push('/addannounce')">
        <i class="el-icon-s-finance"></i>添加公告
      </el-menu-item>
      <el-menu-item index="5-3" @click="$router.push('/deleteannounce')">
        <i class="el-icon-s-finance"></i>管理公告
      </el-menu-item>
    </el-menu-item-group>
  </el-submenu>
-->
      </p>
        
      <p v-else>
        <el-submenu index="2">
          <template slot="title">
            <i class="el-icon-document"></i>
            <span>试卷管理</span>
          </template>
          <el-menu-item-group>
            <el-menu-item index="2-1" @click="$router.push('/paper')">
              <i class="el-icon-s-finance"></i>所有试卷
              </el-menu-item>
          </el-menu-item-group>
        </el-submenu>
      </p>
    </div>

    </body>

</el-menu>
</div>
</template>

<script>
export default {
data() {
return {
openeds: ["2", "3"],
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