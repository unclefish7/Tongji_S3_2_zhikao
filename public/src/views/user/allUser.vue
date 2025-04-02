<template>
    <el-main>
      <el-button type="primary" size="small" @click="addUser()">新增用户</el-button>
        <el-form :model="userForm" size="mini" label-width="80px">
      </el-form>
      <!--表格
          data:数据绑定
          height：只要在el-table元素中定义了height属性，即可实现固定表头的表格，而不需要额外的代码。
          border：表格边框
          prop：字段属性需要跟表格的数据对应
          -->
          <el-table 
          :data="tableData.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" :height="tableHeight" border style="width: 100%">
            <el-table-column prop="username" label="用户名"></el-table-column>
            <el-table-column prop="data.type" label="账号类型"></el-table-column>
              <el-table-column prop="data.createDate" label="创建日期"></el-table-column>
            <el-table-column prop="data.duration" label="账号有效时长（天）"></el-table-column>
  
            <el-table-column label="操作" width="280" >
            <template slot-scope="scope">

              <el-button type="success" @click="editUser(scope.row)" style="margin-left: 10px">修改<i class="el-icon-document"></i></el-button>
            </template>
            </el-table-column>
      </el-table>
  
        <el-dialog title="组卷" :visible.sync="dialogFormVisible1" width="30%" :close-on-click-modal="false" >
          <el-form label-width="100px" size="small" style="width:90%">
            <el-form-item label="选择题数量">
              <el-input v-model="form1.type1" autocomplete="off"></el-input>
            </el-form-item>
            <el-form-item label="判断题数量">
              <el-input v-model="form1.type2"  autocomplete="off"></el-input>
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="generate()">确定</el-button>
            <el-button @click="dialogFormVisible1 = false">取消</el-button>
          </div>
        </el-dialog>
  
        
    <!-- 分页组件-->
          
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
            }
          },
        //该钩子函数执行时所有的DOM挂载和渲染都已完成，此时在该钩子函数中进行任何DOM操作都不 会有问题
        // 在数据变化后要执行的某个操作，而这个操作需要使用随数据改变而改变的DOM结构的时候，
        // 这个操作都应该放进Vue.nextTick()的回调函数中
        created() {
          this.$nextTick(() => {
            this.tableHeight = window.innerHeight - 210; //后面的50：根据需求空出的高度，自行调整
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
      