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

    <!-- 图片预览 -->
    <div v-if="!isLoading && !hasError" class="image-container">
      <div v-for="(imageUrl, index) in imageUrls" :key="index" class="image-wrapper">
        <img :src="imageUrl" class="preview-image" />
      </div>
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
      imageUrls: []
    }
  },
  created() {
    this.paperId = this.$route.query.paperId
    this.generateImagePreview()
    // 禁用页面滚动
    document.body.style.overflow = 'hidden'
  },
  methods: {
    backPage() {
      this.$router.back()
    },
    
    async generateImagePreview() {
      this.isLoading = true
      this.hasError = false
      this.imageUrls = []
      
      try {
        // 构造JSON文件路径
        const jsonPath = `../data/paper/${this.paperId}.json`
        
        // 调用API获取图片的base64编码（JSON格式）
        const imagesData = await window.electronAPI.check.generatePreviewPDF(jsonPath)
        
        if (!imagesData) {
          this.hasError = true
          this.isLoading = false
          return
        }
        
        // 解析返回的JSON数据
        let imagesList = []
        try {
          imagesList = JSON.parse(imagesData)
        } catch (e) {
          console.error('解析图片数据失败:', e)
          this.hasError = true
          this.isLoading = false
          return
        }
        
        // 转换为图片URL数组
        this.imageUrls = imagesList.map(item => `data:image/png;base64,${item.data}`)
        
        this.isLoading = false
        
        // 添加防护措施
        this.$nextTick(() => {
          this.disablePrintAndDownload()
        })
      } catch (error) {
        console.error('生成图片预览失败:', error)
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

.image-container {
  position: relative;
  flex: 1;
  width: 100%;
  height: calc(100% - 50px); /* 减去按钮区域高度 */
  overflow: auto; /* 允许滚动 */
  padding: 10px; /* 添加内边距 */
  box-sizing: border-box; /* 包括内边距和边框在内的总高度计算 */
}

.image-wrapper {
  margin-bottom: 10px; /* 图片之间的间距 */
}

.preview-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto; /* 图片居中 */
}

/* 禁用文本选择 */
* {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
