<template>
  <el-main>
    <div class="button-container">
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>
    </div>
  <el-form label-width="100px" class="demo-ruleForm" >
    <el-form-item label="分数" prop="score" style="margin-left:30%;margin-top:50px">
        <el-input v-model.number="score" style="width: 60%;"></el-input>
      </el-form-item>

    <el-form-item label="题目类型" prop="type" style="margin-left:30%;margin-top:20px">
        <el-select v-model="type">
            <el-option label="选择题" value="选择题"></el-option>
            <el-option label="判断题" value="判断题"></el-option>
            <el-option label="填空题" value="填空题"></el-option>
            <el-option label="主观题" value="主观题"></el-option>
        </el-select>
    </el-form-item>

    <el-form-item label="编辑器" prop="score" style="margin-left:30%;margin-top:20px">
      <div class="custom-editor">
        <Toolbar 
          style="border-bottom: 1px solid #ccc" 
          :editor="editorRef" 
          :defaultConfig="toolbarConfig" 
          :mode="mode" />
        <Editor 
          style="height: 500px; overflow-y: hidden" 
          v-model="valueHtml" 
          :defaultConfig="editorConfig" 
          :mode="mode" 
          @onCreated="handleCreated"/>
      </div>
    </el-form-item>

    <el-form-item style="margin-left:30%;margin-top:-20px">
      <el-popconfirm
          class="ml-5"
          confirm-button-text='确定'
          cancel-button-text='我再想想'
          icon="el-icon-info"
          icon-color="red"
          title="您确定添加吗？"
          @onConfirm="saveEditroContent()"
      >
      <el-button type="primary" @click="saveEditroContent" slot="reference">立即添加 <i class="el-icon-remove-outline"></i></el-button>
      </el-popconfirm>
      <el-button >重置</el-button>
    </el-form-item>

  </el-form>
  </el-main>
</template>

<script>
// 引入富文本编辑器CSS
import '@wangeditor/editor/dist/css/style.css' // 引入 css

import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { Message } from 'element-ui';

export default {
  components: { Editor, Toolbar },
  setup() {
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()

    // 内容 HTML
    const valueHtml = ref('<p>hello</p>')

    // 模拟 ajax 异步获取内容
    onMounted(() => {
        valueHtml.value = '<p>在此输入题目内容</p>'
    })

    const toolbarConfig = {}
    const editorConfig = {
       placeholder: '请输入内容...',
       MENU_CONF: {},
    }

    editorConfig.MENU_CONF['uploadImage'] = {
      server: '/api/upload',

      async customUpload(file, insertFn) {      
        // 获取文件地址
        const filePath = file.path.replace(/\\/g, '/');
        console.log(filePath)

        const result = await window.electronAPI.saveImage(filePath);

        const url = `file:///${result}`;
        const alt = file.name;
        const href = url;
        insertFn(url, alt, href);

        //insertFn(result.url, result.alt, result.href)
      },
    }

    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
        const editor = editorRef.value
        if (editor == null) return
        editor.destroy()
    })

    const handleCreated = (editor) => {
      editorRef.value = editor // 记录 editor 实例，重要！
    }

    // 获取 editor 数据，
    const getEditorContent = () => {
      const editor = editorRef.value;    
      if (editor) {
        const richText = editor.getHtml();
        const data = {
          "id": 0,
          "type": "主观题",
          "richTextContent": richText,
          "score": 0
        };
        return data
      }
      else{
        console.log("no instance")
      }
    }

    return {
      editorRef,
      valueHtml,
      mode: 'default', // 或 'simple'
      toolbarConfig,
      editorConfig,
      handleCreated,
      getEditorContent
    };
  },
  data() {
    return {
      score: 0,
      paperId: 0,
      type: ""
    };
  },
  created() {
      this.paperId = this.$route.query.paperId
  },

  methods: {
    backPage(){
      this.$router.back();
    },
    saveEditroContent(){
      var data = this.getEditorContent()
      data.score = this.score
      data.type = this.type
      const result = window.electronAPI.paper.addQuestion(this.paperId +'.json', data)
      console.log(result)
      this.$message({
        message: "题目添加成功",
        type: "success",
        showClose: true,
        });
    }

  }
}
</script>

<style scoped>
.custom-editor {
  border: 1px solid #ccc;
  width: 60%; /* 调整宽度为 80% */
  height: 600px;
  margin: 50px left; /* 调整上下边距为 50px，左右自动居中 */
}
.custom-editor.ck-editor__main {
  height: 40vh; /* 设置高度为视口高度的 50% */
}
</style>