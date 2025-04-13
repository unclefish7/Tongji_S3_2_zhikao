<template>
  <el-main>

    <div class="button-container">
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>

    </div>

  </el-main>
</template>

<script>
export default {
  data(){
    return {
      paperId: 0,
    }
    
  },
  methods: {

backPage(){
  this.$router.back();
},



}
}
</script>
<style lang="scss" scoped>
.el-main{
  padding-top: 5px !important;
}
.aa{
  width: 300px;
  height: 28px;
  margin-bottom: 35px;
}

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
