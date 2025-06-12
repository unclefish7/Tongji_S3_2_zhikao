<template>
  <el-main>
    <div class="button-container">
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>
    </div>
    <el-form label-width="100px" class="demo-ruleForm" >

        <el-form-item label="题目" style="margin-left:30%;margin-top:20px">
        <div v-html="content"></div>
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
    const content = ref('<p>content</p>')
    const type = ref('')
    const paperId = ref('')
    const questionId = ref(0)
    // 添加图片跟踪
    const uploadedImages = ref(new Set()) // 跟踪本次编辑中上传的图片
    const originalImages = ref(new Set()) // 跟踪原始内容中的图片
    const { proxy } = getCurrentInstance()  // 获取 options API 中的 this
    const isRegistered = globalState.isRegistered  // 直接引用，全局响应式绑定
    console.log('是否注册:', isRegistered.value) // 读取值

    // 提取HTML中的图片URL
    const extractImageUrls = (html) => {
      const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi
      const urls = new Set()
      let match
      while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1]
        if (url.startsWith('file:///')) {
          urls.add(url)
        }
      }
      return urls
    }

    // 模拟 ajax 异步获取内容
    onMounted(() => {
      valueHtml.value = '<p>加载中...</p>'
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
              type.value = current.type || ''
              content.value = current.richTextContent || '<p></p>'
              valueHtml.value = current.answer || '<p></p>'
              // 提取原始答案中的图片
              originalImages.value = extractImageUrls(valueHtml.value)
              console.log("原始答案图片:", originalImages.value)
              console.log("type.value:", type.value)
              proxy.type = type.value
              proxy.originalData = {
                type: type.value,
                content: content.value,
                answer: valueHtml.value
              }
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
          
          // 记录上传的图片
          uploadedImages.value.add(url);
          console.log('已上传图片:', uploadedImages.value);
          
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
      content,  // ← 必须暴露
      type,
      paperId,
      questionId,
      uploadedImages,
      originalImages,
      extractImageUrls,
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
      paperId: 0,
      questionId: 0,
      type: "",
      originalData: {
        type: '',
        content: '',
        answer: '',
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
    async cleanupUnusedImages(finalContent) {
      try {
        // 提取最终内容中使用的图片
        const finalImages = this.extractImageUrls(finalContent);
        
        // 找出需要删除的图片：本次上传但最终未使用的图片
        const imagesToDelete = new Set();
        
        // 检查本次上传的图片中哪些未在最终内容中使用
        this.uploadedImages.forEach(img => {
          if (!finalImages.has(img)) {
            imagesToDelete.add(img);
          }
        });
        
        // 检查原始图片中哪些在最终内容中被删除了
        this.originalImages.forEach(img => {
          if (!finalImages.has(img)) {
            imagesToDelete.add(img);
          }
        });
        
        console.log('需要删除的图片:', imagesToDelete);
        
        // 删除未使用的图片
        if (imagesToDelete.size > 0) {
          for (const imageUrl of imagesToDelete) {
            try {
              // 从 file:/// URL 中提取文件路径
              const filePath = imageUrl.replace(/^file:\/\/\//, '').replace(/\//g, '\\');
              await window.electronAPI.deleteImage(filePath);
              console.log('删除图片成功:', filePath);
            } catch (error) {
              console.warn('删除图片失败:', imageUrl, error);
            }
          }
          
          console.log(`已清理 ${imagesToDelete.size} 个未使用的图片`);
        }
      } catch (error) {
        console.error('清理图片时出错:', error);
      }
    },
    resetForm() {
      // 将分数、题目类型、富文本内容都重置为 originalData
      this.type = this.originalData.type
      this.valueHtml = this.originalData.answer
      
      // 清理本次编辑中上传但未保存的图片
      this.cleanupUnusedImages(this.originalData.answer);
      
      // 重置图片跟踪
      this.uploadedImages.clear();
      
      this.$message({
        message: '已恢复初始内容',
        type: 'info',
        showClose: true,
      });
    },
    async saveEditorContent() {
        // 获取编辑器内容（使用你已注册的 this.editor 或 this.editorRef）
        const editor = this.editor || this.editorRef;
        const richText = editor?.getHtml?.() || this.valueHtml;

        const answerToSave = (!richText || richText === '<p>加载中...</p>')
            ? this.originalData.answer
            : richText;

        // 保存前先清理未使用的图片
        await this.cleanupUnusedImages(answerToSave);

        const updatedData = {
            answer: answerToSave
        };

        const result = window.electronAPI.paper.editQuestion(
            this.paperId + '.json',
            this.questionId,
            updatedData
        );

        console.log("保存结果：", result);

        this.$message({
            message: '答案保存成功！',
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