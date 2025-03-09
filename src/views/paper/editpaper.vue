<template>
  <el-main>
    <div>
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>
    </div>

   <el-form label-width="100px" class="demo-ruleForm">

    <el-form-item label="试卷名称" prop="name" style="margin-left:30%;margin-top:30px">
      <el-input v-model="ruleForm.name" style="width:221.4px"></el-input>
    </el-form-item>
    <el-form-item label="总分" prop="score" style="margin-left:30%;margin-top:20px">
      <el-input v-model="ruleForm.score" style="width:221.4px"></el-input>
    </el-form-item>
    <el-form-item label="院系" prop="department" style="margin-left:30%;margin-top:20px">
      <el-input v-model="ruleForm.department" style="width:221.4px"></el-input>
    </el-form-item>
    <el-form-item label="总时长" prop="duration" style="margin-left:30%;margin-top:20px">
      <el-input v-model="ruleForm.duration" style="width:221.4px"></el-input>
    </el-form-item>

    <el-form-item style="margin-left:30%;margin-top:20px">
      <el-button type="primary" @click="submitForm('ruleForm')">确认修改</el-button>
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
        paperId: "",
        score:"",
        name: "",
        department: "",
        duration: ""
      },
      user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : {},
    };
  },
  created(){
    this.ruleForm.paperId = this.$route.query.paperId
  },
  methods: {
    submitForm(){

      const data = {
        "paperId": this.ruleForm.paperId,
        "name": this.ruleForm.name,
        "score": this.ruleForm.score,
        "department": this.ruleForm.department,
        "duration": this.ruleForm.duration
      }
      console.log(this.ruleForm.paperId)
      const result = window.electronAPI.paper.editPaper(this.ruleForm.paperId, data)
      console.log(result)
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