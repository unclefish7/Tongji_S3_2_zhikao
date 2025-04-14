<template>
  <el-main>

    <div class="button-container">
      <el-button type="primary" size="small" @click="backPage()">返回</el-button>
      <el-button type="primary" size="small" @click="addquestion()">添加题目</el-button>
      <el-button type="primary" size="small" @click="checkpaper()">试卷校验</el-button>
      <!--el-button type="primary" size="small" @click="yulan()">试卷预览</el-button-->
      <span>总分 {{this.score}}/{{this.allscore}}</span>
    </div>
    <!--表格
        data:数据绑定
        height：只要在el-table元素中定义了height属性，即可实现固定表头的表格，而不需要额外的代码。
        border：表格边框
        prop：字段属性需要跟表格的数据对应
        -->
    <!-- 分页组件-->
    <h3  v-if="choiceQuestions.length > 0">选择题</h3>
    <el-table
        v-if="choiceQuestions.length > 0"
        :data="choiceQuestions.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" border style="width: 100%;margin-top: 20px">
<!--      <el-table-column prop="id" label="题号"></el-table-column>-->
      <el-table-column prop="id" label="序号"></el-table-column>
      <el-table-column label="题目">
        <template slot-scope="scope">
          <!-- 使用v-html指令渲染富文本内容 -->
          <div v-html="scope.row.richTextContent"></div>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="分数"></el-table-column>

      <el-table-column>
        <template v-slot="scope">
          <!--              <el-button type="primary" size="small" @click="genggai(scope.row.id,scope.row.type)">发布</el-button>-->
          <el-popconfirm
              class="ml-5"
              confirm-button-text='确定'
              cancel-button-text='我再想想'
              icon="el-icon-info"
              icon-color="red"
              title="您确定删除吗？"
              @OnConfirm="deleteQuestion(scope.row.id)"
              @confirm="deleteQuestion(scope.row.id)"
          >
            <el-button type="danger" slot="reference">删除 <i class="el-icon-remove-outline"></i></el-button>
          </el-popconfirm>
          <el-button type="success" @click="editQuestion(scope.row.id)" style="margin-left: 10px">修改 <i class="el-icon-document"></i></el-button>
        </template>

      </el-table-column>

    </el-table>
    <!-- 分页组件-->
    <h3  v-if="judgmentQuestions.length > 0">判断题</h3>
    <el-table
        v-if="judgmentQuestions.length > 0"
        :data="judgmentQuestions.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" border style="width: 100%;margin-top: 20px">
<!--      <el-table-column prop="id" label="题号"></el-table-column>-->
      <el-table-column prop="id" label="序号"></el-table-column>
      <el-table-column label="题目">
        <template slot-scope="scope">
          <!-- 使用v-html指令渲染富文本内容 -->
          <div v-html="scope.row.richTextContent"></div>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="分数"></el-table-column>

      <el-table-column>
        <template v-slot="scope">
          <!--              <el-button type="primary" size="small" @click="genggai(scope.row.id,scope.row.type)">发布</el-button>-->
          <el-popconfirm
              class="ml-5"
              confirm-button-text='确定'
              cancel-button-text='我再想想'
              icon="el-icon-info"
              icon-color="red"
              title="您确定删除吗？"
              @OnConfirm="deleteQuestion(scope.row.id)"
              @confirm="deleteQuestion(scope.row.id)"
          >
            <el-button type="danger" slot="reference">删除 <i class="el-icon-remove-outline"></i></el-button>
          </el-popconfirm>
          <el-button type="success" @click="editQuestion(scope.row.id)" style="margin-left: 10px">修改 <i class="el-icon-document"></i></el-button>
        </template>

      </el-table-column>

    </el-table>
    <!-- 分页组件-->
    <h3  v-if="fillInQuestions.length > 0">填空题</h3>
    <el-table
        v-if="fillInQuestions.length > 0"
        :data="fillInQuestions.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" border style="width: 100%; margin-top: 20px">
<!--      <el-table-column prop="id" label="题号"></el-table-column>-->
      <el-table-column prop="id" label="序号"></el-table-column>
      <el-table-column label="题目">
        <template slot-scope="scope">
          <!-- 使用v-html指令渲染富文本内容 -->
          <div v-html="scope.row.richTextContent"></div>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="分数"></el-table-column>

      <el-table-column>
        <template v-slot="scope">
          <!--              <el-button type="primary" size="small" @click="genggai(scope.row.id,scope.row.type)">发布</el-button>-->
          <el-popconfirm
              class="ml-5"
              confirm-button-text='确定'
              cancel-button-text='我再想想'
              icon="el-icon-info"
              icon-color="red"
              title="您确定删除吗？"
              @OnConfirm="deleteQuestion(scope.row.id)"
              @confirm="deleteQuestion(scope.row.id)"
          >
            <el-button type="danger" slot="reference">删除 <i class="el-icon-remove-outline"></i></el-button>
          </el-popconfirm>
          <el-button type="success" @click="editQuestion(scope.row.id)" style="margin-left: 10px">修改 <i class="el-icon-document"></i></el-button>
        </template>

      </el-table-column>

    </el-table>
    <!-- 分页组件-->
    <h3  v-if="subjectiveQuestions.length > 0">主观题</h3>
    <el-table
        v-if="subjectiveQuestions.length > 0"
        :data="subjectiveQuestions.slice((currentpage1-1)*pagesize,currentpage1*pagesize)" border style="width: 100%; margin-top: 20px">
<!--      <el-table-column prop="id" label="题号"></el-table-column>-->
      <el-table-column prop="id" label="序号"></el-table-column>
      <el-table-column label="题目">
        <template slot-scope="scope">
          <!-- 使用v-html指令渲染富文本内容 -->
          <div v-html="scope.row.richTextContent"></div>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="分数"></el-table-column>

      <el-table-column label="操作">
        <template v-slot="scope">
          <el-popconfirm
                class="ml-5"
                confirm-button-text='确定'
                cancel-button-text='我再想想'
                icon="el-icon-info"
                icon-color="red"
                title="您确定删除吗？"
                @OnConfirm="deleteQuestion(scope.row.id)"
                @confirm="deleteQuestion(scope.row.id)"
            >
              <el-button type="danger" style="margin-left: 10px" slot="reference">删除 <i class="el-icon-remove-outline"></i></el-button>
            </el-popconfirm>
          <el-button type="success" @click="editQuestion(scope.row.id)" style="margin-left: 10px">修改 <i class="el-icon-document"></i></el-button>
        </template>

      </el-table-column>

    </el-table>

  </el-main>
</template>
<script>
import Vue from 'vue';
import VueModal from 'vue-modal-plugin';
import katex from 'katex'
import 'katex/dist/katex.min.css'

Vue.use(VueModal);

export default {
  data(){
    return{
      total:0,
      currentpage1:1,
      pagesize:50,
      searchmap:{},
      paperId: 0,
      score: 0,
      allscore: 0,

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

      choiceQuestions: [],
      judgmentQuestions: [],
      fillInQuestions: [],
      subjectiveQuestions: [],

    }
  },

  created() {
    this.$nextTick(() => {
      this.tableHeight = window.innerHeight - 210; //后面的50：根据需求空出的高度，自行调整
      this.paperId = this.$route.query.id
      this.allscore = this.$route.query.score
      this.getAllData()
    });
  },

  mounted() {
    // 页面首次加载完，尝试渲染公式
    this.renderFormulasInTable()
  },
  
  methods: {
    renderFormulasInTable() {
      this.$nextTick(() => {
        const formulaSpans = document.querySelectorAll('[data-w-e-type="formula"]')
        formulaSpans.forEach((span) => {
          const latex = span.getAttribute('data-value')
          if (latex && span.innerHTML.trim() === '') {
            katex.render(latex, span, {
              throwOnError: false,
              displayMode: false,
            })
          }
        })
      })
    },

    addquestion(){
      this.$router.push({ path: '/addquestion', query: { paperId: this.paperId} })
    },
    checkpaper(){
      let ifScore = "false";
      const scoreInfo = "已出题目分数： " + this.score.toString() + " / " + this.allscore.toString()
      if (this.score == this.allscore){
        ifScore = scoreInfo + "，已达到试卷总分要求"
      }else{
        ifScore = scoreInfo + "，未达到试卷要求"
      }
      this.$router.push({ path: '/checkpaper', query: { paperId: this.paperId, ifScore: ifScore} })
    },
    yulan(){
      this.$router.push('/yulan')
    },
    backPage(){
      this.$router.back();
    },
    getAllData() {
      this.subjectiveQuestions = [];
      this.judgmentQuestions = [];
      this.fillInQuestions = [];
      this.subjectiveQuestions = [];
      window.electronAPI.paper.readPaperFile(this.paperId +'.json')
      .then(quesitons => {
        this.tableData = quesitons;
        this.tableData.forEach(question => {
        switch (question.type) {
          case '选择题':
            this.choiceQuestions.push(question);
            break;
          case '判断题':
            this.judgmentQuestions.push(question);
            break;
          case '填空题':
            this.fillInQuestions.push(question);
            break;
            case '主观题':
            this.subjectiveQuestions.push(question);
            break;
      }
      });

        let score = 0;
        for (let question of this.tableData) {
          if (question.hasOwnProperty('score')) {
            score += question.score;
          }
        }
      this.score = score;
      this.$nextTick(() => {
        this.renderFormulasInTable()
      })
    })
    .catch(error => {
        console.error('获取题目信息时出错:', error);
    });
    },

    editQuestion(questionId){
      this.$router.push({ path: '/editquestion', query: { paperId: this.paperId, questionId: questionId } });
    },

    async deleteQuestion(id) {
      const result = await window.electronAPI.paper.deleteQuestion(this.paperId +'.json', id);
      if(result.success){
        await this.getAllData();
      }
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
.searchBtn{
  margin-left: 30px;
}
</style>


