<template>

  <el-form :model="ruleForm" ref="ruleForm" label-width="100px" class="demo-ruleForm" >
    <el-form-item label="试卷名称" prop="name" style="margin-left:30%;margin-top:10px">
      <el-input v-model="ruleForm.name" style="width:221.4px"></el-input>
    </el-form-item>
    <el-form-item label="总分" prop="score" style="margin-left:30%;margin-top:-560px">
      <el-input v-model="ruleForm.score" style="width:221.4px"></el-input>
    </el-form-item>
    <el-form-item label="总时长" prop="duration" style="margin-left:30%;margin-top:-500px">
      <el-input v-model="ruleForm.duration" style="width:221.4px"></el-input>
    </el-form-item>

    <el-form-item style="margin-left:30%;margin-top:-440px">
      <el-button type="primary" @click="submitForm('ruleForm')">立即创建</el-button>
      <el-button @click="resetForm('ruleForm')">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      ruleForm: {
        id: 0,
        score:"",
        name: "",
        duration: ""
      },
      user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : {},
      curriculumId: 0,
    };
  },
  created(){
    this.curriculumId = this.$route.query.curriculumId;
  },
  methods: {
    submitForm(){

      const data = {
        "id": this.ruleForm.id,
        "name": this.ruleForm.name,
        "score": this.ruleForm.score,
        "duration": this.ruleForm.duration
      }
      const result = window.electronAPI.paper.addPaper(this.curriculumId, data)
      console.log(result)
    },
    backPage(){
      this.$router.back();
    },
    
    resetForm(formName) {
      this.$refs[formName].resetFields();
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