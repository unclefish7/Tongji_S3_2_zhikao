<template>
  <div class="preview-container">
    <div class="button-container">
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>
      <h2 class="paper-title">试卷预览</h2>
    </div>

    <!-- 加载提示 -->
    <div v-if="isLoading" class="loading-container">
      <el-spinner type="spinner" :size="60"></el-spinner>
      <p>正在生成试卷预览，请稍候...</p>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="hasError"
      title="预览生成失败"
      type="error"
      description="无法生成试卷预览，请稍后重试。"
      show-icon
      :closable="false">
    </el-alert>

    <!-- PDF预览 -->
    <div v-if="!isLoading && !hasError" class="pdf-container">
      <!-- 使用object标签替代iframe，提供更好的限制选项 -->
      <object 
        v-if="pdfSrc" 
        :data="pdfSrc" 
        type="application/pdf" 
        class="pdf-frame"
        ref="pdfObject">
        <div class="pdf-fallback">
          无法显示PDF，请检查您的浏览器是否支持PDF预览。
        </div>
      </object>
      <!-- 添加透明覆盖层防止交互 -->
      <div class="interaction-blocker"></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      paperId: 0,
      isLoading: true,
      hasError: false,
      pdfBase64: null,
      pdfSrc: null
    }
  },
  created() {
    this.paperId = this.$route.query.paperId
    this.generatePdfPreview()
    // 禁用页面滚动
    document.body.style.overflow = 'hidden'
  },
  methods: {
    backPage() {
      this.$router.back()
    },
    async generatePdfPreview() {
      this.isLoading = true
      this.hasError = false
      this.pdfSrc = null
      
      try {
        // 构造JSON文件路径
        const jsonPath = `../data/paper/${this.paperId}.json`
        
        // 调用API获取PDF的base64编码
        const base64Data = await window.electronAPI.check.generatePreviewPDF(jsonPath)
        
        if (!base64Data) {
          this.hasError = true
          this.isLoading = false
          return
        }
        
        // 生成Data URL
        this.pdfSrc = `data:application/pdf;base64,${base64Data}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&print=0&download=0`
        this.isLoading = false
        
        // 在PDF加载完成后，添加额外防止打印和右键菜单的措施
        this.$nextTick(() => {
          this.disablePrintAndDownload()
        })
      } catch (error) {
        console.error('生成PDF预览失败:', error)
        this.hasError = true
        this.isLoading = false
      }
    },
    disablePrintAndDownload() {
      // 监听键盘事件，禁用Ctrl+P等打印快捷键
      window.addEventListener('keydown', this.preventPrintShortcuts)
      
      // 添加右键菜单禁用
      document.addEventListener('contextmenu', this.preventContextMenu)
    },
    preventPrintShortcuts(e) {
      // 禁用Ctrl+P打印快捷键
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
        e.preventDefault()
        return false
      }
      
      // 禁用Ctrl+S下载快捷键
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault()
        return false
      }
    },
    preventContextMenu(e) {
      e.preventDefault()
      return false
    }
  },
  beforeDestroy() {
    // 清除事件监听器
    window.removeEventListener('keydown', this.preventPrintShortcuts)
    document.removeEventListener('contextmenu', this.preventContextMenu)
    
    // 恢复滚动
    document.body.style.overflow = 'auto'
  }
}
</script>

<style lang="scss" scoped>
/* 使用全局容器替代el-main，以便更好地控制布局 */
.preview-container {
  position: fixed;
  top: 60px; /* 调整顶部位置，根据你的应用顶部导航栏高度 */
  left: 200px; /* 调整左侧位置，根据你的侧边栏宽度 */
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  background-color: white;
  overflow: hidden; /* 确保没有滚动条 */
}

.button-container {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0; /* 防止按钮区域被压缩 */
  height: 50px; /* 固定高度 */
}

.paper-title {
  margin: 0 auto;
  text-align: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
}

.pdf-container {
  position: relative;
  flex: 1;
  width: 100%;
  height: calc(100% - 50px); /* 减去按钮区域高度 */
  overflow: hidden;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #909399;
}

/* 透明覆盖层，防止不必要的交互 */
.interaction-blocker {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
}

/* 禁用文本选择 */
* {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
