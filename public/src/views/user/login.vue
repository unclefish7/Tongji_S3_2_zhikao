<template>
    <div class="loginbody">
      <div class="logindata">
        <div class="logintext" style="margin-top: 80%;">
          <el-form :model="form" :rules="rules" ref="loginForm" label-width="80px">
            <el-form-item label="用户名" prop="user_name">
              <el-input v-model="form.user_name"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" show-password></el-input>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="loginUserTest" class="custom-button-width">登录</el-button>
        </div>
          
      </div>
    </div>
  </template>
  
  <script>
  // import { login } from "@/api/login";
  // import { setToken } from "@/request/auth";
  import { Message } from 'element-ui';
  
  export default {
    name: "login",
    
    data() {
      return {
        form: {
           user_name: "",
           password: ""       
        },
        checked: false,
        rules: {
          user_name: [
            { required: true, message: "请输入用户名", trigger: "blur" },
            { min: 3, message: "不能小于 3 个字符", trigger: "blur" },
            { max: 20, message: "不能大于20个字符", trigger: "blur" },
          ],
          password: [
            { required: true, message: "请输入密码", trigger: "blur" },
            { min: 6, message: "不能小于 6 个字符", trigger: "blur" },
            { max: 20, message: "不能大于20个字符", trigger: "blur" },
          ],
        },
      };
    },
    created() {
      // 检测网络连接状态
      if (navigator.onLine) {
        // 若有网络连接，显示提示框
        Message({
          message: '检测到网络连接，注意命卷安全',
          type: 'warning',
          showClose: true
        });
      }
    },
    methods: {
      login() {       
        this.$router.push('/')
      },

      async loginUserTest() {
        this.$refs.loginForm.validate((valid) => {
          if (valid) {
            window.electronAPI.user.loginUser(this.form.user_name, this.form.password)
            .then((result) => {
            if (result.success) {
              //检测账户是否有效
              const createTimestamp = result.user.userdata.createTimeStamp;
              const duration = parseInt(result.user.userdata.duration);
              console.log(duration)
              // 获取当前时间戳
              const currentTimestamp = Date.now();
              // 计算从创建时间到现在的天数
              const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
              const daysPassed = Math.floor((currentTimestamp - createTimestamp) / oneDay);

              console.log(daysPassed)
              
              if (daysPassed <= duration || result.user.userdata.type == "admin") {
                console.log('Login successful:', result.user);
                sessionStorage.setItem("USERNAME", result.user.username);
                sessionStorage.setItem("TYPE", result.user.userdata.type);
                this.$message({
                  message: "登录成功",
                  type: "success",
                  showClose: true,
                });
              this.$router.push('/main')
              }
              else {
                this.$message({
                  message: "登录失败，账户超出有效期",
                  type: "success",
                  showClose: true,
                });
              }
            } else {
              console.log('Login failed:', result.message);
            }
        });
          }
          else {
            console.log("表单验证不通过，请检查输入信息");
          }
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .loginbody {
    width: 100%;
    height: 100%;
    min-width: 1000px;
    background-image: url("../../assets/login_1.png");
    background-size: 100% 100%;
    background-position: center center;
    overflow: auto;
    background-repeat: no-repeat;
    position: fixed;
    line-height: 100%;
    padding-top: 2.9%;
  }
  
  .custom-button-width {
    width:360px;
    height:45px;
  }
  
  .logintext {
    margin-bottom: 20px;
    line-height: 50px;
    text-align: center;
    font-size: 30px;
    font-weight: bolder;
    color: white;
    text-shadow: 2px 2px 4px #000000;
  }
  
  .logindata {
    width: 400px;
    height: 300px;
    transform: translate(-50%);
    margin-left: 69.5%;
  }
  
  .tool {
    display: flex;
    justify-content: space-between;
    color: #606266;
  }
  
  .butt {
    margin-top: 94.5%;
    text-align: center;
  }
  
  .shou {
    cursor: pointer;
    color: #606266;
  }
  
  /*ui*/
  /* /deep/ .el-form-item__label {
    font-weight: bolder;
    font-size: 15px;
    text-align: left;
  }
  
  /deep/ .el-button {
    width: 100%;
    margin-bottom: 10px;
  
  } */
  </style>
  