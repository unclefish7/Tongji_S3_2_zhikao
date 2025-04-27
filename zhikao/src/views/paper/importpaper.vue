<template>
    <el-main>
      <div>
        <el-button type="primary" size="small" @click="backPage()">返回</el-button>
      </div>
  
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>导入试卷</span>
          </div>
        </template>
  
        <el-upload
          class="upload-demo"
          drag
          action=""
          :before-upload="beforeUpload"
          :http-request="customUpload"
          :show-file-list="false"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
          <div class="el-upload__tip" slot="tip">只能上传 .json 文件，且 paperId 必须包含用户名</div>
        </el-upload>
      </el-card>
    </el-main>
  </template>
  
  <script>
  export default {
    name: 'ImportPaper',
    data() {
      return {
        uploading: false,
        userName: '',
      };
    },
    mounted() {
      this.checkLogin();
    },
    methods: {
      backPage() {
        this.$router.back();
      },
      checkLogin() {
        const userName = sessionStorage.getItem('USERNAME');
        if (!userName) {
          this.$message.error('未登录或登录信息失效，请重新登录');
          this.$router.push('/');
        } else {
          this.userName = userName;
        }
      },
      beforeUpload(file) {
        const isJson = file.type === 'application/json';
        if (!isJson) {
          this.$message.error('只能上传 JSON 文件！');
        }
        return isJson;
      },
      async customUpload(options) {
        const { file } = options;
        this.uploading = true;
        try {
          if (!this.userName) {
            this.$message.error('用户信息缺失，请重新登录');
            this.$router.push('/login');
            return;
          }
  
          const res = await window.electronAPI.importPaperFile(file.path, this.userName);
  
          if (res.success) {
            this.$message.success('导入成功！');
            this.$router.push('/paper');
          } else {
            this.$message.error('导入失败：' + (res.message || '未知错误'));
          }
        } catch (error) {
          console.error(error);
          this.$message.error('导入失败，服务器异常');
        } finally {
          this.uploading = false;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .import-paper-page {
    padding: 20px;
  }
  
  .box-card {
    width: 500px;
    margin: 0 auto;
  }
  
  .card-header {
    display: flex;
    align-items: center;
  }
  
  .el-upload__tip {
    margin-top: 10px;
    color: #999;
    font-size: 12px;
  }
  </style>
  