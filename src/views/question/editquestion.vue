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
import axios from "axios"

// 引入富文本编辑器CSS
import '@wangeditor/editor/dist/css/style.css' // 引入 css

import { Boot } from '@wangeditor/editor'
import formulaModule from '@wangeditor/plugin-formula'

// 注册公式插件
Boot.registerModule(formulaModule)

import { onBeforeUnmount, ref, shallowRef, onMounted, watch, nextTick } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

import katex from 'katex'
import 'katex/dist/katex.min.css'


export default {
  components: { Editor, Toolbar },
  setup() {
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef()
    const score = ref(0)
    const type = ref('')


    // 内容 HTML
    const valueHtml = ref('<p>hello</p>')

    const renderFormulas = () => {
      nextTick(() => {
        const formulaSpans = document.querySelectorAll('[data-w-e-type="formula"]')
        formulaSpans.forEach(span => {
          const latex = span.getAttribute('data-value')
          if (latex && span.innerHTML.trim() === '') {
            katex.render(latex, span, {
              throwOnError: false,
              displayMode: false,
            })
          }
        })
      })
    }

    // 模拟 ajax 异步获取内容
    onMounted(() => {
      // 获取完整题目信息（模拟从 electron 获取）
      window.electronAPI.paper.readPaperFile(`${questionId.value}.json`).then(allQuestions => {
        const current = allQuestions.find(q => q.id == questionId.value)
        if (current) {
          valueHtml.value = current.richTextContent || '<p></p>'
          score.value = current.score || 0
          type.value = current.type || ''
        }
        renderFormulas()
      })
    })


    watch(valueHtml, () => {
      renderFormulas()
    })

    //const toolbarConfig = {}
    const toolbarConfig = {
      insertKeys: {
        index: 0, // 插入位置
        keys: ['insertFormula'], // 插入公式按钮
      },
    }
    const editorConfig = {
      placeholder: '请输入内容...',
      MENU_CONF: {
        uploadImage: {
          server: '/api/upload',

          async customUpload(file, insertFn) {
            // 获取文件地址
            const filePath = file.path.replace(/\\/g, '/')
            const result = await window.electronAPI.saveImage(filePath)
            const url = `file:///${result}`
            const alt = file.name
            const href = url
            insertFn(url, alt, href)
          },
        },
      },
      hoverbarKeys: {
        formula: {
          menuKeys: ['editFormula'], // 鼠标悬停公式时显示“编辑”按钮
        },
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
      renderFormulas()  // 添加这行
    }
    return {
      editorRef,
      valueHtml,
      score,
      type,
      mode: 'default',
      toolbarConfig,
      editorConfig,
      handleCreated,
      valueHtml: '<p></p>',
    }
  },
  data() {
    return {
      score: 0,
      paperId: 0,
      questionId: 0,
      type: ""
    };
  },
  created() {
      this.paperId = this.$route.query.paperId
      this.questionId = this.$route.query.questionId
      // 加载当前试卷文件
      window.electronAPI.paper.readPaperFile(this.paperId + '.json')
        .then(allQuestions => {
          const current = allQuestions.find(q => q.id == this.questionId)
          if (current) {
            // 赋值原题目信息
            this.score = current.score || 0
            this.type = current.type || ''
            this.valueHtml = current.richTextContent || '<p></p>'
          }
        })
        .catch(err => {
          console.error('加载题目失败：', err)
        })
  },
  methods: {
    getEditorContent() {
      const editor = this.editorRef
      if (editor) {
        const richText = editor.getHtml()
        return {
          id: this.questionId,
          richTextContent: richText,
          score: this.score,
          type: this.type
        }
      } else {
        console.log("no editor instance")
        return null
      }
    },

    saveEditroContent() {
      const data = this.getEditorContent()
      if (!data) return
      const result = window.electronAPI.paper.editQuestion(
        this.paperId + '.json',
        this.questionId,
        data
      )
      console.log(result)
    },

    backPage() {
      this.$router.back()
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