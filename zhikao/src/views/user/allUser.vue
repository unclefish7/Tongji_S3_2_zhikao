<template>
  <el-main>
    <el-button type="primary" size="small" @click="addUser()">新增用户</el-button>
    <el-button type="primary" size="small" @click="sendUser()">导出用户</el-button>
    <el-form :model="userForm" size="mini" label-width="80px"></el-form>
    <el-table
      :data="tableData.slice((currentpage1-1)*pagesize, currentpage1*pagesize)"
      :height="tableHeight"
      border
      style="width: 100%"
    >
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="data.type" label="账号类型"></el-table-column>
      <el-table-column prop="data.createDate" label="创建日期"></el-table-column>
      <el-table-column prop="data.duration" label="账号有效时长（天）"></el-table-column>

      <el-table-column label="操作" width="280">
        <template slot-scope="scope">
            <el-button
              type="success"
              @click="editUser(scope.row)"
              style="margin-left: 10px"
            >修改<i class="el-icon-document"></i></el-button>
            <el-button
              v-if="scope.row.username !== userName"
              type="danger"
              @click="confirmDeleteUser(scope.row)"
              style="margin-left: 10px"
            >删除<i class="el-icon-delete"></i></el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      title="组卷"
      :visible.sync="dialogFormVisible1"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px" size="small" style="width:90%">
        <el-form-item label="选择题数量">
          <el-input v-model="form1.type1" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="判断题数量">
          <el-input v-model="form1.type2" autocomplete="off"></el-input>
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
      import axios from "axios"
        export default {
          data(){
            return{
              dialogVisible:false,
              total:0,
              currentpage1:1,
              pagesize:9,
  
  
              form1:{},
              questions:[],
              dialogFormVisible1:false,
              userForm:{
                userName:""
              },
  
              current_order_id: 0,
              current_state: 0,
                  //表格高度 window.innerHeight窗口文档显示高度
              tableHeight: window.innerHeight,
              //表格数据绑定
              tableData: [
              ],     
              userName: '', // 添加当前用户名
            }
          },
        //该钩子函数执行时所有的DOM挂载和渲染都已完成，此时在该钩子函数中进行任何DOM操作都不 会有问题
        // 在数据变化后要执行的某个操作，而这个操作需要使用随数据改变而改变的DOM结构的时候，
        // 这个操作都应该放进Vue.nextTick()的回调函数中
        created() {
          this.$nextTick(() => {
            this.tableHeight = window.innerHeight - 210; //后面的50：根据需求空出的高度，自行调整
            this.userName = sessionStorage.getItem("USERNAME"); // 获取当前登录用户名
            this.getAllData();
          });        
        },
         methods: {
           backPage(){
            this.$router.back();
           },
           addUser(){
            this.$router.push('/adduser')
           },
          async sendUser() {
            const result = await window.electronAPI.user.sendUser();
            if (result.success) {
              this.$message.success('用户信息已成功发送！');
            } else {
              this.$message.error('发送失败: ' + result.error);
            }
          },
           editUser(userInfo){
            this.$router.push({ path: '/edituser', query: { user: userInfo } })
           },
           getAllData(){
            window.electronAPI.user.getUserInfo()
              .then(quesitons => {
              this.tableData = quesitons;
            })
          .catch(error => {
              console.error('获取账户信息时出错:', error);
          });
       },
       confirmDeleteUser(userInfo) {
             // 双重检查：防止删除自己
             if (userInfo.username === this.userName) {
               this.$message.warning('不能删除自己的账号！');
               return;
             }
             
             this.$confirm(`确定要删除用户 "${userInfo.username}" 吗？`, '删除确认', {
               confirmButtonText: '确定',
               cancelButtonText: '取消',
               type: 'warning'
             }).then(() => {
               this.deleteUser(userInfo.username);
             }).catch(() => {
               this.$message.info('已取消删除');
             });
           },
           async deleteUser(username) {
             try {
               const result = await window.electronAPI.user.deleteUser(username);
               if (result.success) {
                 this.$message.success('用户删除成功！');
                 this.getAllData(); // 刷新用户列表
               } else {
                 this.$message.error('删除失败: ' + result.message);
               }
             } catch (error) {
               this.$message.error('删除用户时出错: ' + error.message);
             }
           },
          }
      }
      </script>
      <style lang="scss" scoped>
      .el-main{
          padding-top: 5px !important;
      }
      .aa{
          width: 300px;
          height: 28px;
          margin-bottom: 35px;
      }
      .searchBtn{
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
