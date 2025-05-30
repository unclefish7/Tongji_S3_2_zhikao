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
import { onBeforeUnmount, ref, shallowRef, onMounted} from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import globalState from '@/globalState'
import { getCurrentInstance } from 'vue'

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
          .catch(err => {
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
    const handleChange = (editor) => {
      console.log("change:", editor.getHtml());
    };
    const handleDestroyed = (editor) => {
      console.log("destroyed", editor);
    };
    const handleFocus = (editor) => {
      console.log("focus", editor);
    };
    const handleBlur = (editor) => {
      console.log("blur", editor);
    };
    const customAlert = (info, type) => {
      alert(`【自定义提示】${type} - ${info}`);
    };
    const customPaste = (editor, event, callback) => {
      console.log("ClipboardEvent 粘贴事件对象", event);

    // 自定义插入内容
      editor.insertText("xxx");

    // 返回值（注意，vue 事件的返回值，不能用 return）
      callback(false); // 返回 false ，阻止默认粘贴行为
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
      var data = this.getEditorContent()
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