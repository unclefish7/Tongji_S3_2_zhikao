<template>
    <el-main>
      <div>
        <el-button type="primary" size="small" @click="backPage()">返回</el-button>
      </div>
  
     <el-form label-width="100px" class="demo-ruleForm">
  
      <el-form-item label="用户名" prop="name" style="margin-left:30%;margin-top:30px">
        <el-input v-model="ruleForm.name" style="width:221.4px"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password" style="margin-left:30%;margin-top:20px">
        <el-input v-model="ruleForm.password" style="width:221.4px"></el-input>
      </el-form-item>
      <el-form-item label="账号类型" prop="type" style="margin-left:30%;margin-top:20px">
        <el-select v-model="ruleForm.type">
            <el-option label="管理员账户" value="admin"></el-option>
            <el-option label="临时账户" value="temp"></el-option>
        </el-select>
      </el-form-item>
  
      <!-- 当选择临时账户时显示时长选择下拉框 -->
      <el-form-item
        label="账号有效时长"
        prop="duration"
        style="margin-left:30%;margin-top:20px"
        v-if="ruleForm.type === 'temp'"
      >
        <el-select v-model="ruleForm.duration">
          <el-option label="3 天" value="3"></el-option>
          <el-option label="7 天" value="7"></el-option>
          <el-option label="14 天" value="14"></el-option>
        </el-select>
      </el-form-item>
  
      <el-form-item style="margin-left:30%;margin-top:20px">
        <el-button type="primary" @click="submitForm()">立即修改</el-button>
        <el-button @click="resetForm()">重置</el-button>
      </el-form-item>
    </el-form>
  </el-main>
  </template>
  
  <script>
  export default {
    data() {
      return {
        ruleForm: {
          password:"",
          name: "",
          type: "",
          createDate: "",
          duration: "",
          createTimeStamp: ""
        },
      };
    },
    created(){
      this.$nextTick(() => {
        this.ruleForm.name = this.$route.query.user.username
        this.ruleForm.createTimeStamp = this.$route.query.user.data.createTimeStamp
        this.ruleForm.type = this.$route.query.user.data.type
        this.ruleForm.createDate = this.$route.query.user.data.createDate
        console.log(this.ruleForm)
      });
    },
    methods: {
      async submitForm(){
        const data = {
          "type": this.ruleForm.type,
          "createDate": this.ruleForm.createDate,
          "createTimeStamp": this.ruleForm.createTimeStamp,
          "duration": this.ruleForm.duration
        }
        console.log(data)
        const result = await window.electronAPI.user.editUser(this.ruleForm.name, this.ruleForm.password, data)
      },
      backPage(){
        this.$router.back();
      },
      
      resetForm(formName) {
        this.ruleForm = {
          id: 0,
          score:"",
          name: "",
          duration: ""
        };
      }
  
    }
  }
  </script>
  
  <style scoped>
  .button-container {
    position: relative;
  }
  .button-container span {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    color: #333;
  }
  </style>