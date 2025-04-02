<template>
<el-main>
 
<!--表格
    data:数据绑定
    height：只要在el-table元素中定义了height属性，即可实现固定表头的表格，而不需要额外的代码。
    border：表格边框
    prop：字段属性需要跟表格的数据对应
    -->
    <el-table 
    :data="tableData.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" :height="tableHeight" border style="width: 100%">
      <el-table-column prop="id" label="课程代码"></el-table-column>
        <el-table-column prop="name" label="名称"></el-table-column>
<!--      <el-table-column prop="car_brand" label="品牌"></el-table-column>-->
      <el-table-column prop="sum" label="总人数"></el-table-column>
      <el-table-column prop="department" label="开设学院"></el-table-column>
      <el-table-column prop="state" label="状态"></el-table-column>
      <el-table-column>
        <template v-slot="scope">
          <el-button type="primary"  @click="topaper(scope.row.id)">进入课程</el-button>
        </template>
      </el-table-column>
      
</el-table>

  <el-dialog title="试卷" :visible.sync="dialogFormVisible1" width="30%" :close-on-click-modal="false" >
    <el-form label-width="100px" size="small" style="width:90%">
      <el-form-item label="试卷">
        <el-select clearable v-model="form1.paperID" placeholder="请选择试卷" style="width:100%">
          <el-option
              v-for="item in papers"
              :key="item.id"
              :label="item.name"
              :value="item.id">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="savepaper()">确定</el-button>
      <el-button @click="dialogFormVisible1 = false">取消</el-button>
    </div>
  </el-dialog>
     <!-- 分页组件-->
   
</el-main>
</template>
<script>

    export default {
        data(){
            return{
              dialogFormVisible1:false,
              total:0,
              currentpage1:1,
              form1:{},
              pagesize:9,
              searchmap:{},
              papers:[],
           userForm:{
               userName:'',
               id:'',
             state:''
           },
            //表格高度 window.innerHeight窗口文档显示高度
      tableHeight: window.innerHeight,
      //表格数据绑定
       tableData: [
      ],
            }
        },

  created() {
    this.$nextTick(() => {
      this.tableHeight = window.innerHeight - 210; //后面的50：根据需求空出的高度，自行调整
      this.getAllData();
    });
  },
   methods: {

     getAllData(){
      window.electronAPI.curriculum.readTotalCurriculumFile()
      .then(result => {
        this.tableData = result;
      })
      .catch(error => {
        console.error('获取题目信息时出错:', error);
      });

      console.log("1231233")
     },

     topaper(id){
      console.log(id)
      this.$router.push({ path: '/paper', query: { id: id } });
     },

     handleSizeChange(val){
       this.pagesize=val;
     },
     handleCurrentChange(val){
       this.currentpage1=val;
     }

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
</style>


