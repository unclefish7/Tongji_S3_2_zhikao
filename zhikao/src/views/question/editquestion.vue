<template>
  <el-main>
    <div class="button-container">
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>
    </div>
  <el-form label-width="100px" class="demo-ruleForm" >

    <el-form-item label="题号" prop="questionId" style="margin-left:30%; margin-top:50px">
        <el-input v-model.number="questionId" style="width: 60%;" disabled></el-input>
      </el-form-item>
    <el-form-item label="分数" prop="score" style="margin-left:30%; margin-top:20px">
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

    <el-form-item label="编辑器" prop="editor" style="margin-left:30%;margin-top:20px">
      <div class="custom-editor">
        <Toolbar 
          style="border-bottom: 1px solid #ccc" 
          :editor="editorRef" 
          :defaultConfig="toolbarConfig" 
          :mode="mode" />
        <Editor 
          style="height: 1000px; width: 800px; overflow-y: hidden" 
          v-model="valueHtml" 
          :defaultConfig="editorConfig" 
          :mode="mode" 
          @onCreated="handleCreated"
          @onChange="handleChange"
          @onDestroyed="handleDestroyed"
          @onFocus="handleFocus"
          @onBlur="handleBlur"
          @customAlert="customAlert"
          @customPaste="customPaste"/>
      </div>
    </el-form-item>

    <el-form-item style="margin-left:30%;margin-top:-20px">
      <el-button type="primary" @click="saveEditorContent">立即修改</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>

  </el-form>
  </el-main>
</template>

<script>
import axios from "axios"
// 引入富文本编辑器CSS
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import kityformula from "@/components/kityformula";
import { Boot } from '@wangeditor/editor'
import formulaModule from '@wangeditor/plugin-formula'
import { onBeforeUnmount, ref, shallowRef, onMounted, getCurrentInstance } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import globalState from '@/globalState'

export default {
  components: { Editor, Toolbar },
  setup() {
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()
    // 内容 HTML
    const valueHtml = ref('<p>hello</p>')
    const score = ref(0)
    const type = ref('')
    const paperId = ref('')
    const questionId = ref(0)
    const { proxy } = getCurrentInstance()  // 获取 options API 中的 this
    const isRegistered = globalState.isRegistered  // 直接引用，全局响应式绑定
    console.log('是否注册:', isRegistered.value) // 读取值

    // 模拟 ajax 异步获取内容
    onMounted(() => {
      valueHtml.value = '<p>在此输入题目内容</p>'
      if (!isRegistered.value) {
        Boot.registerModule(formulaModule);
        Boot.registerMenu(kityformula);
        isRegistered.value = true; // 标记插件已经注册
      }
        // 新增：从路由中获取 paperId 和 questionId，并初始化内容
        const paperId = proxy.$route.query.paperId
        const questionId = proxy.$route.query.questionId
        // 保存到 proxy，供其他逻辑使用
        proxy.paperId = paperId
        proxy.questionId = questionId
        // 加载题目信息
        window.electronAPI.paper.readPaperFile(`${paperId}.json`)
          .then(allQuestions => {
            const current = allQuestions.find(q => q.id == questionId)
            if (current) {
              score.value = current.score || 0
              type.value = current.type || ''
              valueHtml.value = current.richTextContent || '<p></p>'
              console.log("score.value:", score.value)
              console.log("type.value:", type.value)
              proxy.score = score.value
              proxy.type = type.value
              proxy.originalData = {
                score: score.value,
                type: type.value,
                richTextContent: valueHtml.value
              }
              console.log("originalData:", proxy.originalData.score, proxy.originalData.type, proxy.originalData.richTextContent)
            }
          })
          .catch(() => {
            proxy.$message.error('未找到对应题目，请返回重试');
            proxy.$router.back();
          })
    })

    const toolbarConfig = {
      insertKeys: {
        index: 0,
        keys: [
          "insertFormula", // “插入公式”菜单
          "kityFormula", // “编辑公式”菜单
        ],
      }
    }
    const editorConfig = {
       placeholder: '请输入内容...',
       MENU_CONF: {},
    }

    editorConfig.MENU_CONF['uploadImage'] = {
      // 移除 server 配置，因为使用自定义上传
      // server: '/api/upload',
      
      // 最大文件体积限制，默认为 2M
      maxFileSize: 5 * 1024 * 1024, // 5M
      
      // 限制图片类型
      allowedFileTypes: ['image/*'],

      async customUpload(file, insertFn) {      
        try {
          console.log('开始上传图片:', file.name);
          
          // 检查文件是否存在 path 属性（Electron 环境）
          if (!file.path) {
            console.error('文件缺少 path 属性');
            proxy.$message.error('图片上传失败：文件路径获取失败');
            return;
          }
          
          // 获取文件地址并处理路径
          const filePath = file.path.replace(/\\/g, '/');
          console.log('文件路径:', filePath);
          
          // 修改：使用正确的API路径
          const result = await window.electronAPI.saveImage(filePath);
          console.log('保存结果:', result);
          
          if (!result) {
            throw new Error('保存图片失败');
          }
          
          // 构造图片 URL
          const url = `file:///${result.replace(/\\/g, '/')}`;
          const alt = file.name;
          const href = url;
          
          console.log('插入图片 URL:', url);
          
          // 插入图片到编辑器
          insertFn(url, alt, href);
          
          proxy.$message.success('图片上传成功');
          
        } catch (error) {
          console.error('图片上传失败:', error);
          proxy.$message.error(`图片上传失败: ${error.message}`);
        }
      },
    }

    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
        const editor = editorRef.value
        if (editor == null) return
        editor.destroy()
    })
    //
    const handleCreated = (editor) => {
      console.log("created", editor);
      editorRef.value = editor; // 记录 editor 实例，重要！
    };
    
    // 获取 editor 数据，
    const getEditorContent = () => {
      const editor = editorRef.value;    
      if (editor) {
        const richText = editor.getHtml();
        const data = {
          "id": proxy.questionId, 
          "type": proxy.type,
          "richTextContent": richText,
          "score": proxy.score
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
      score,
      type,
      paperId,
      questionId,
      mode: 'default', // 或 'simple'
      toolbarConfig,
      editorConfig,
      handleCreated,
      getEditorContent,
      isRegistered
    };
  },

  data() {
    return {
      score: 0,
      paperId: 0,
      questionId: 0,
      type: "",
      originalData: {
        score: 0,
        type: '',
        richTextContent: '',
      },
    };
  },

  created() {
    this.paperId = this.$route.query.paperId
    this.questionId = this.$route.query.questionId
  },

  methods: {
    backPage(){
      this.$router.back();
    },
    onCreated(editor) {
      console.log("created", editor);
      this.editor = Object.seal(editor); // 【注意】一定要用 Object.seal() 否则会报错
    },
    onChange(editor) {
      console.log("onChange", editor.getHtml()); // onChange 时获取编辑器最新内容
    },
    handleFocus(editor) {
      console.log("focus", editor);
    },
    getEditorText() {
      const editor = this.editor;
      if (editor == null) return;

      console.log(editor.getText()); // 执行 editor API
    },
    printEditorHtml() {
      const editor = this.editor;
      if (editor == null) return;
      console.log(editor.getHtml()); // 执行 editor API
    },
    resetForm() {
      // 将分数、题目类型、富文本内容都重置为 originalData
      this.score = this.originalData.score
      this.type = this.originalData.type
      this.valueHtml = this.originalData.richTextContent
      this.$message({
        message: '已恢复初始内容',
        type: 'info',
        showClose: true,
      });
    },
    saveEditorContent() {
      let data = this.getEditorContent()
      data.score = this.score|| this.originalData.score
      data.type = this.type|| this.originalData.type
      // 如果用户没有修改富文本内容，则保留原始内容
      if (
        !data.richTextContent || 
        data.richTextContent === '<p>在此输入题目内容</p>'
      ) {
        data.richTextContent = this.originalData.richTextContent
      }
      const result = window.electronAPI.paper.editQuestion(this.paperId +'.json', this.questionId, data)
      console.log(result)
      this.$message({
        message: '修改成功！',
        type: 'success',
        showClose: true,
      });
      this.$router.back();
    }
  }
}
</script>

<style scoped>
.custom-editor {
  border: 1px solid #ccc;
  width: 60%; /* 调整宽度为 80% */
  height: 800px;
  margin: 40px left; /* 调整上下边距为 50px，左右自动居中 */
}
.custom-editor.ck-editor__main {
  height: 40vh; /* 设置高度为视口高度的 50% */
}
</style>