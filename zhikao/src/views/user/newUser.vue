<template>
  <el-main>
    <!-- 导入用户按钮 -->
    <el-button type="primary" size="small" @click="newUser()">导入用户</el-button>

    <!-- 用户表单 -->
    <el-form :model="userForm" size="mini" label-width="80px"></el-form>

    <!-- 用户信息表格 -->
    <el-table
      :data="tableData.slice((currentpage1 - 1) * pagesize, currentpage1 * pagesize)"
      :height="tableHeight"
      border
      style="width: 100%"
    >
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="data.type" label="账号类型" />
      <el-table-column prop="data.createDate" label="创建日期" />
      <el-table-column prop="data.duration" label="账号有效时长（天）" />
    </el-table>

    <!-- 组卷对话框 -->
    <el-dialog
      title="组卷"
      :visible.sync="dialogFormVisible1"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" size="small" style="width: 90%">
        <el-form-item label="选择题数量">
          <el-input v-model="form1.type1" autocomplete="off" />
        </el-form-item>
        <el-form-item label="判断题数量">
          <el-input v-model="form1.type2" autocomplete="off" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="generate()">确定</el-button>
        <el-button @click="dialogFormVisible1 = false">取消</el-button>
      </div>
    </el-dialog>
  </el-main>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      dialogVisible: false,
      total: 0,
      currentpage1: 1,
      pagesize: 9,
      form1: {},
      questions: [],
      dialogFormVisible1: false,
      userForm: {
        userName: ""
      },
      current_order_id: 0,
      current_state: 0,
      tableHeight: window.innerHeight,
      tableData: []
    };
  },
  created() {
    this.$nextTick(() => {
      this.tableHeight = window.innerHeight - 210;
      this.getAllData();
    });
  },
  methods: {
    backPage() {
      this.$router.back();
    },
    async newUser() {
        const result = await window.electronAPI.user.newUser();
        if (result.success) {
        this.$message.success('用户信息导入成功！');
        location.reload(); // 可选：重新加载页面
        } else {
        this.$message.error('导入失败: ' + result.error);
        }
    },
    getAllData() {
      window.electronAPI.user.getUserInfo()
        .then(questions => {
          this.tableData = questions;
        })
        .catch(error => {
          console.error("获取账户信息时出错:", error);
        });
    },
    generate() {
      // 若需要处理组卷逻辑可在此补充
      console.log("生成试卷中...", this.form1);
      this.dialogFormVisible1 = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.el-main {
  padding-top: 5px !important;
}

.aa {
  width: 300px;
  height: 28px;
  margin-bottom: 35px;
}

.searchBtn {
  margin-left: 30px;
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
</style>
