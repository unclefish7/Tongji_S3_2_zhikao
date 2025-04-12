<template>
  <el-main>
    <el-button type="primary" size="small" @click="backPage()">返回</el-button>
    <el-button type="primary" size="small" @click="generatePaper()">试卷文件生成</el-button>

    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3>相似性校验</h3>
      <div>
        <h3>{{ this.ifScore }}</h3>
      </div>
  </div>
    <el-table
    :data="similarityResults.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" :height="tableHeight" border style="width: 100%">
    <el-table-column label="题目A序号">
      <template slot-scope="scope">
        <div>{{ scope.row.questionA.id }}</div>
      </template>
    </el-table-column>
    <el-table-column label="题目A类型">
      <template slot-scope="scope">
        <div>{{ scope.row.questionA.type }}</div>
      </template>
    </el-table-column>
    <el-table-column label="题目 A">
      <template slot-scope="scope">
        <div v-html="scope.row.questionA.richTextContent"></div>
      </template>
    </el-table-column>
    <el-table-column label="题目B序号">
      <template slot-scope="scope">
        <div>{{ scope.row.questionB.id }}</div>
      </template>
    </el-table-column>
    <el-table-column label="题目B类型">
      <template slot-scope="scope">
        <div>{{ scope.row.questionB.type }}</div>
      </template>
    </el-table-column>
    <el-table-column label="题目 B">
      <template slot-scope="scope">
        <div v-html="scope.row.questionB.richTextContent"></div>
      </template>
    </el-table-column>
    <el-table-column prop="score" label="相似度分数">
      <template slot-scope="scope">
        <div>{{ scope.row.score }}</div>
      </template>
    </el-table-column>
  </el-table>

  <h3>完整性校验</h3>
    <el-table
    :data="missObjData.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" :height="tableHeight" border style="width: 100%">
    <el-table-column prop="id" label="序号"></el-table-column>
      <el-table-column label="题目">
        <template slot-scope="scope">
          <!-- 使用v-html指令渲染富文本内容 -->
          <div v-html="scope.row.richTextContent"></div>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="分数"></el-table-column>
  </el-table>
  </el-main>
   

</template>

<script>
import { Message } from 'element-ui';
export default {
  methods: {
    backPage(){
      this.$router.back();
    },
    generatePaper(){
      if(this.ifScore.includes("已达到")){
        window.electronAPI.check.generateExamPaper(this.paperId +'.json');
        this.$message({
          message: "试卷生成成功",
          type: "success",
          showClose: true,
        });
      }
      else{
        this.$message({
          message: "分数未达标，无法生成试卷",
          type: "error",
          showClose: true,
        });
      }
      
      
    },
    getAllData(){
    window.electronAPI.check.checkQuestionsAI(this.paperId +'.json')
    .then(quesitons => {
        this.similarityResults = quesitons.similarityResults;
        this.missObjData = quesitons.missObjData;
    })
    .catch(error => {
        console.error('获取校验信息时出错:', error);
    });
    },
  },
  created(){
      this.$nextTick(() => {
      this.paperId = this.$route.query.paperId
      this.ifScore = this.$route.query.ifScore
      this.getAllData();
    });
  },
  data() {
    return {
      total:0,
      currentpage1:1,
      pagesize:50,
      ifScore: "false",
      tableHeight: window.innerHeight / 3,

      problem: "存在图表缺失",

        paperId: 0,
        similarityResults: [
        ],
        missObjData: [
        ],
      };
  },
};
</script>
<style scoped>

</style>