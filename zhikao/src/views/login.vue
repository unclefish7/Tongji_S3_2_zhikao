<template>
  <div class="loginbody">
    <div class="logindata">
      <div class="logintext">
      </div>
      
      <div class="butt">
        <el-button type="primary" @click="login" class="custom-button-width">登录</el-button>
      </div>
    </div>
  </div>
</template>

<script>
// import { login } from "@/api/login";
// import { setToken } from "@/request/auth";

import axios from "axios"

export default {
  name: "login",
  data() {
    return {
      form: {
         user_name: "admin9527",
         password: ""       
      },
      checked: false,
      rules: {
        user_name: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          // { max: 10, message: "不能大于10个字符", trigger: "blur" },
        ],
        password: [
          { required: true, message: "请输入密码", trigger: "blur" },
         // { max: 10, message: "不能大于10个字符", trigger: "blur" },
        ],
      },
    };
  },
  methods: {
    login() {       
      this.$router.push('/main')
    },
    // login(form) {
    //   this.$refs[form].validate((valid) => {
    //     if (valid) {
    //       login(this.form)
    //         .then((res) => {
    //           if (res.code === 200) {
    //             setToken(res.data.token);
    //             localStorage.setItem("USERNAME", res.data.user_name);
    //             this.$message({
    //               message: "登录成功啦",
    //               type: "success",
    //               showClose: true,
    //             });
    //             this.$router.replace("/");
    //           } else {
    //             this.$message({
    //               message: "账户名或密码错误",
    //               type: "error",
    //               showClose: true,
    //             });
    //           }
    //         })
    //         .catch((err) => {
    //           this.$message({
    //             message: "账户名或密码错误",
    //             type: "error",
    //             showClose: true,
    //           });
    //         });
    //     } else {
    //       return false;
    //     }
    //   });
    // },
    // remenber(data){
    //   this.checked=data
    //   if(this.checked){
    //       localStorage.setItem("news",JSON.stringify(this.form))
    //   }else{
    //     localStorage.removeItem("news")
    //   }
    // },
    forgetpas() {
      this.$router.push('/forget')
    },
    register() {
      this.$router.push('/register')
    },
    findpass() {
      this.$router.push('/findpass')
    },
  },
};
</script>

<style scoped>
.loginbody {
  width: 100%;
  height: 100%;
  min-width: 1000px;
  background-image: url("../assets/tj_login.png");
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
