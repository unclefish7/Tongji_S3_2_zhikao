<template>
    <el-main>
      <div class="button-container">
        <el-button type="primary" size="small" @click="backPage()">返回</el-button>
        <el-button type="success" size="small" @click="savePermissions()">保存权限</el-button>
      </div>
  
      <h3 style="margin-top: 20px">分配试卷编辑权限</h3>
      <el-table :data="userList" border style="width: 100%; margin-top: 20px">
        <el-table-column prop="username" label="用户名" />
  
        <el-table-column label="是否有权限" width="320">
          <template v-slot="scope">
            <el-checkbox
              v-model="scope.row.checked"
            ></el-checkbox>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </template>
  
  <script>
  export default {
    data() {
      return {
        users: [], // 用户原数据
        userList: [], // 所有用户信息（加上了权限判断）
        paperId: '', // 当前试卷ID（你可以通过 props 或路由传入）
      }
    },
    created() {
      this.paperId = this.$route.query.paperId 
      this.getAllUsers()
    },
    methods: {
      // 模拟从后端获取所有用户及其权限
      getAllUsers() {
        // 👇 替换为实际 API 请求
        window.electronAPI.user.getUserInfo()
        .then(allUsers => {
            // this.users = allUsers;
            // 先过滤掉 admin 用户
            const filteredUsers = allUsers.filter(user => user.data.type !== 'admin');
            this.users = filteredUsers;
            // 等数据拿到后再处理 userList
            this.userList = this.users.map(user => ({
                ...user,
                checked: user.papers_distributed?.some(id => id === `${this.paperId}_${user.username}`), // 根据 "paperID_userID" 格式判断
            }));

            console.log('处理后的用户列表:', this.userList);
            })
            .catch(error => {
            console.error('获取账户信息时出错:', error);
            });
      },
  
      // 保存权限变更
      async savePermissions() {
        const selectedUserNames = this.userList
          .filter(user => user.checked)
          .map(user => user.username)

        console.log('需要赋权的用户ID：', selectedUserNames)

        try {
          const result = await window.electronAPI.paper.updatePaperPermissions(this.paperId, selectedUserNames)
          if (result.success) {
            this.$message.success('权限已保存')
          } else {
            this.$message.error('权限保存失败：' + result.message)
          }
        } catch (error) {
          console.error(error)
          this.$message.error('权限保存出错')
        }
      },
  
      backPage() {
        this.$router.back()
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .el-main {
    padding-top: 5px !important;
  }
  .button-container {
    position: relative;
  }
  .button-container .el-button {
    margin-right: 10px;
  }
  </style>
