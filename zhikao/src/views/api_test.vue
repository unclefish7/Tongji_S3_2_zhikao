<template>
    <div class="api-test">
      <h1>🧪 IPC API 测试页面</h1>
  
      <el-button type="primary" class="back-btn" @click="goBack">返回登录页</el-button>
  
      <div v-for="(api, name) in apiList" :key="name" class="api-block">
        <h3>{{ name }}</h3>
  
        <div v-for="(input, index) in api.inputs" :key="index">
          <input
            v-model="inputValues[name][index]"
            :placeholder="api.placeholders[index] || ('参数 ' + (index + 1))"
          />
        </div>
  
        <button @click="invokeAPI(name, api.fn)">调用</button>
        <div class="result" v-if="results[name]">
          <strong>结果:</strong>
          <pre>{{ results[name] }}</pre>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "ApiTest",
    data() {
      return {
        apiList: {
          node: { fn: window.electronAPI.node, inputs: [], placeholders: [] },
          chrome: { fn: window.electronAPI.chrome, inputs: [], placeholders: [] },
          electron: { fn: window.electronAPI.electron, inputs: [], placeholders: [] },
          ping: { fn: window.electronAPI.ping, inputs: [], placeholders: [] },
  
          getUserName: { fn: window.electronAPI.user.getUserName, inputs: [], placeholders: [] },
          getUserAge: { fn: window.electronAPI.user.getUserAge, inputs: [], placeholders: [] },
          registerUser: {
            fn: window.electronAPI.user.registerUser,
            inputs: ["", "", "{}"],
            placeholders: ["用户名", "密码", "其他信息(JSON格式)"]
          },
          editUser: {
            fn: window.electronAPI.user.editUser,
            inputs: ["", "", "{}"],
            placeholders: ["用户名", "密码", "更新数据(JSON格式)"]
          },
          loginUser: {
            fn: window.electronAPI.user.loginUser,
            inputs: ["", ""],
            placeholders: ["用户名", "密码"]
          },
          getUserInfo: { fn: window.electronAPI.user.getUserInfo, inputs: [], placeholders: [] },
  
          addQuestion: {
            fn: window.electronAPI.paper.addQuestion,
            inputs: ["", "{}", ""],
            placeholders: ["试卷文件名", "新题目(JSON格式)", "用户名"]
          },
          editQuestion: {
            fn: window.electronAPI.paper.editQuestion,
            inputs: ["", "", "{}", ""],
            placeholders: ["试卷文件名", "题目ID", "修改内容(JSON格式)", "用户名"]
          },
          readPaperFile: {
            fn: window.electronAPI.paper.readPaperFile,
            inputs: [""],
            placeholders: ["试卷文件名"]
          },
          deleteQuestion: {
            fn: window.electronAPI.paper.deleteQuestion,
            inputs: ["", "", ""],
            placeholders: ["试卷文件名", "题目ID", "用户名"]
          },
  
          addPaper: {
            fn: window.electronAPI.paper.addPaper,
            inputs: ["{}"],
            placeholders: ["试卷内容(JSON格式)"]
          },
          editPaper: {
            fn: window.electronAPI.paper.editPaper,
            inputs: ["", "{}"],
            placeholders: ["试卷ID", "修改内容(JSON格式)"]
          },
          deletePaper: {
            fn: window.electronAPI.paper.deletePaper,
            inputs: [""],
            placeholders: ["试卷ID"]
          },
  
          readTotalCurriculumFile: { fn: window.electronAPI.curriculum.readTotalCurriculumFile, inputs: [], placeholders: [] },
          readExamFile: { fn: window.electronAPI.curriculum.readExamFile, inputs: [], placeholders: [] },
          addCurriculum: {
            fn: window.electronAPI.curriculum.addCurriculum,
            inputs: ["{}"],
            placeholders: ["课程数据(JSON格式)"]
          },
  
          generateExamPaper: {
            fn: window.electronAPI.check.generateExamPaper,
            inputs: [""],
            placeholders: ["试卷文件名"]
          },
          checkQuestions: {
            fn: window.electronAPI.check.checkQuestions,
            inputs: [""],
            placeholders: ["试卷文件名"]
          },
          checkQuestionsAI: {
            fn: window.electronAPI.check.checkQuestionsAI,
            inputs: [""],
            placeholders: ["试卷文件名"]
          },
  
          saveImage: {
            fn: window.electronAPI.saveImage,
            inputs: [""],
            placeholders: ["图片数据(base64或路径)"]
          },
        },
        inputValues: {},
        results: {},
      }
    },
    created() {
      Object.keys(this.apiList).forEach(name => {
        this.inputValues[name] = [...this.apiList[name].inputs];
      });
    },
    methods: {
      async invokeAPI(name, fn) {
        try {
          const inputs = this.inputValues[name].map(val => {
            try {
              return JSON.parse(val)
            } catch {
              return val
            }
          });
          const result = await fn(...inputs);
          const formatted = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
          this.$set(this.results, name, formatted);
        } catch (err) {
          this.$set(this.results, name, `错误: ${err.message}`);
        }
      },
      goBack() {
        this.$router.push('/');
      }
    },
  }
  </script>
  
  <style scoped>
  .api-test {
    padding: 20px;
    max-width: 800px;
    margin: auto;
    font-family: sans-serif;
  }
  .api-block {
    border: 1px solid #ccc;
    padding: 12px;
    margin-bottom: 20px;
    border-radius: 6px;
  }
  input {
    margin-right: 10px;
    margin-bottom: 5px;
    padding: 5px;
    width: 300px;
  }
  button {
    padding: 5px 10px;
    margin-top: 5px;
  }
  .result {
    margin-top: 10px;
    color: #555;
    background: #f5f5f5;
    padding: 10px;
    white-space: pre-wrap;
    border-radius: 4px;
  }
  .back-btn {
    margin-bottom: 20px;
  }
  </style>
  