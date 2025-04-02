<template>
  <el-main>
    <el-button type="primary" size="small" @click="addpaper()">添加考卷</el-button>
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
          <el-table-column prop="name" label="名称"></el-table-column>
          <el-table-column prop="score" label="总分"></el-table-column>
          <el-table-column prop="department" label="院系"></el-table-column>
          <el-table-column prop="duration" label="时长（时）"></el-table-column>

          <el-table-column label="考卷">
            <template v-slot="scope">
              <el-button type="primary" @click="viewpaper(scope.row.paperId, scope.row.score)">查看考卷</el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" >
          <template v-slot="scope">
            <el-popconfirm
                class="ml-5"
                confirm-button-text='确定'
                cancel-button-text='我再想想'
                icon="el-icon-info"
                icon-color="red"
                title="您确定删除吗？"
                @OnConfirm="deletePaper(scope.row.paperId)"
                @confirm="deletePaper(scope.row.paperId)"
            >
              <el-button type="danger" style="margin-left: 10px" slot="reference">删除 <i class="el-icon-remove-outline"></i></el-button>
            </el-popconfirm>

            <el-button type="success" @click="editpaper(scope.row.paperId)" style="margin-left: 10px">修改 <i class="el-icon-document"></i></el-button>
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

      <el-dialog title="考卷" :visible.sync="dialogFormVisible2" width="60%" :close-on-click-modal="false"  >
   <el-card>
     <div v-for="(item,index) in questions" :key="item.id" style="margin: 20px 0">
      <div style="margin : 10px 0; font-size: 20px"><span>{{index+1}}.</span>{{item.name}}
        <sapn style="font-size: 14px" v-if="item.type===1">(选择题)</sapn>
        <sapn style="font-size: 14px" v-if="item.type===2">(判断题)</sapn>
      </div>
       <div v-if="item.type===1" style="margin: 10px">
         <span style="margin-right: 20px">A.{{item.a}}</span>
         <span style="margin-right: 20px">B.{{item.b}}</span>
         <span style="margin-right: 20px">C.{{item.c}}</span>
         <span style="margin-right: 20px">D.{{item.d}}</span>
       </div>
       <div style="margin: 10px">
         答案：{{item.answer}}
       </div>
       <div style="margin: 10px">
         解析：{{item.detail}}
       </div>
     </div>
   </el-card>

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

            curriculumId: 0,

            form1:{},
            questions:[],
            dialogFormVisible2:false,
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
        async deletePaper(id) {
          const result = await window.electronAPI.paper.deletePaper(id);
            if (result.success) {
                 await this.getAllData();
            } else {
                console.log('试卷删除失败:', result.message);
        }
         },
         addpaper(){
          this.$router.push({ path: '/addpaper', query: { curriculumId: this.curriculumId } })
         },
         viewpaper(paperId, score){
          this.$router.push({ path: '/question', query: { id: paperId , score: score} });
         },
         editpaper(paperId){
          console.log(paperId)
          this.$router.push({ path: '/editpaper', query: { paperId: paperId} });
         },
         takepaper(ID){
           this.form1={type1:2,type2:2,paperId:ID}
           this.dialogFormVisible1=true
         },

         getAllData(){
          window.electronAPI.curriculum.readExamFile()
            .then(quesitons => {
            this.tableData = quesitons;
          })
          .catch(error => {
            console.error('获取题目信息时出错:', error);
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
    