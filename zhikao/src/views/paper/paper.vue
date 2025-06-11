<template>
  <el-main>
    <el-button type="primary" size="small" @click="importPaper()">导入考卷</el-button>
    <el-button type="primary" size="small" @click="addpaper()">添加考卷</el-button>
    <template v-if="userType === 'admin'">
      <el-button type="success" size="small" @click="confirmMerge()">合并</el-button>
    </template>

    
    <el-form :model="userForm" size="mini" label-width="80px"></el-form>
    
    <!-- Table component -->
    <el-table 
      :data="tableData.slice((currentpage1-1)*pagesize, currentpage1*pagesize)" 
      :height="tableHeight" 
      border 
      style="width: 100%"
    >
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="score" label="总分" width="80"></el-table-column>
      <el-table-column prop="department" label="院系"></el-table-column>
      <el-table-column prop="duration" label="时长（时）" width="100"></el-table-column>
      
      <el-table-column label="考卷">
        <template v-slot="scope">
          <el-button type="primary" @click="viewpaper(scope.row.paperId, scope.row.score)">
            查看考卷
          </el-button>
          <el-button @click="openAssignDialog(scope.row.paperId,scope.row.score)">
            分配分数
          </el-button>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="400">
        <template v-slot="scope">
          <template v-if="userType === 'admin'">
            <el-popconfirm
              class="ml-5"
              confirm-button-text="确定"
              cancel-button-text="我再想想"
              icon="el-icon-info"
              icon-color="red"
              title="您确定删除吗？"
              @confirm="deletePaper(scope.row.paperId)"
            >
              <el-button type="danger" style="margin-left: 10px" slot="reference">
                删除 <i class="el-icon-remove-outline"></i>
              </el-button>
            </el-popconfirm>
          </template>
          
          <el-button 
            type="success" 
            @click="editpaper(scope.row.paperId)" 
            style="margin-left: 10px"
          >
            修改 <i class="el-icon-document"></i>
          </el-button>
          
          <template v-if="userType === 'admin'">
            <el-button 
              type="info" 
              :style="{
                marginLeft: '10px',
                backgroundColor: selectedToMerge.includes(scope.row.paperId) ? '#67C23A' : '#909399',
                borderColor: selectedToMerge.includes(scope.row.paperId) ? '#67C23A' : '#909399'
              }"
              @click="toggleSelect(scope.row.paperId)">
              {{ selectedToMerge.includes(scope.row.paperId) ? '已选' : '待选' }}
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top: 20px; text-align: center;"
      background
      layout="prev, pager, next"
      :current-page="currentpage1"
      :page-size="pagesize"
      :total="tableData.length"
      @current-change="handleCurrentChange"
    />


    <!-- Dialog for generating papers -->
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

    <!-- Dialog for displaying papers -->
    <el-dialog 
      title="考卷" 
      :visible.sync="dialogFormVisible2" 
      width="60%" 
      :close-on-click-modal="false"
    >
      <el-card>
        <div v-for="(item,index) in questions" :key="item.id" style="margin: 20px 0">
          <div style="margin: 10px 0; font-size: 20px">
            <span>{{index+1}}.</span>{{item.name}}
            <sapn style="font-size: 14px" v-if="item.type===1">(选择题)</sapn>
            <sapn style="font-size: 14px" v-if="item.type===2">(判断题)</sapn>
          </div>
          
          <div v-if="item.type===1" style="margin: 10px">
            <span style="margin-right: 20px">A.{{item.a}}</span>
            <span style="margin-right: 20px">B.{{item.b}}</span>
            <span style="margin-right: 20px">C.{{item.c}}</span>
            <span style="margin-right: 20px">D.{{item.d}}</span>
          </div>
          
          <div style="margin: 10px">答案：{{item.answer}}</div>
          <div style="margin: 10px">解析：{{item.detail}}</div>
        </div>
      </el-card>
    </el-dialog>
    <el-dialog title="题目分配" :visible.sync="assignDialogVisible">
      <el-alert
        title="警告：分配分数将清空当前试卷内所有已有题目"
        type="warning"
        description="此操作会删除试卷中的所有现有题目，并根据您的设置重新生成空白题目框架。请确认您要继续此操作。"
        show-icon
        :closable="false"
        style="margin-bottom: 15px;">
      </el-alert>
      <el-alert
        title="提示：如需修改分数分配"
        type="info"
        description="如果您想要修改分数的分配，请进入『查看考卷』页面，直接修改里面的分数，或者单独添加/删除题目。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;">
      </el-alert>
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="选择题">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input-number v-model="assignForm.choice.count" :min="0" placeholder="题数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">题，</span>
            <el-input-number v-model="assignForm.choice.score" :min="0" placeholder="分数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">每题{{ assignForm.choice.score }}分</span>
          </div>
        </el-form-item>
        <el-form-item label="判断题">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input-number v-model="assignForm.judge.count" :min="0" placeholder="题数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">题，</span>
            <el-input-number v-model="assignForm.judge.score" :min="0" placeholder="分数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">每题{{ assignForm.judge.score }}分</span>
          </div>
        </el-form-item>
        <el-form-item label="填空题">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input-number v-model="assignForm.blank.count" :min="0" placeholder="题数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">题，</span>
            <el-input-number v-model="assignForm.blank.score" :min="0" placeholder="分数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">每题{{ assignForm.blank.score }}分</span>
          </div>
        </el-form-item>
        <el-form-item label="主观题">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-input-number v-model="assignForm.subjective.count" :min="0" placeholder="题数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">题，</span>
            <el-input-number v-model="assignForm.subjective.score" :min="0" placeholder="分数"></el-input-number>
            <span style="color: #606266; font-size: 14px;">每题{{ assignForm.subjective.score }}分</span>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="assignDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="(submitAssign())">确 定</el-button>
      </span>
    </el-dialog>
  </el-main>
</template>

<script>
export default {
  data(){
    return{
      allUsers: [],
      userName: '',
      userPapers: [],

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
      userType:"",
      current_order_id: 0,
      current_state: 0,
      //表格高度 window.innerHeight窗口文档显示高度
      tableHeight: window.innerHeight,
      //表格数据绑定
      tableData: [],  
      selectedToMerge: [],
      mergedTableData: [],
      assignDialogVisible: false,
      currentPaperId: null,
      currentPaperScore: 0,
      assignForm: {
        choice: { count: 0, score: 0 },
        judge: { count: 0, score: 0 },
        blank: { count: 0, score: 0 },
        subjective: { count: 0, score: 0 }
      }  
    }
  },
  //该钩子函数执行时所有的DOM挂载和渲染都已完成，此时在该钩子函数中进行任何DOM操作都不 会有问题
  // 在数据变化后要执行的某个操作，而这个操作需要使用随数据改变而改变的DOM结构的时候，
  // 这个操作都应该放进Vue.nextTick()的回调函数中
  created() {
    this.$nextTick(async () => {
      this.tableHeight = window.innerHeight - 210;
      const allUsers = await window.electronAPI.user.getUserInfo();
      this.allUsers = allUsers;
      this.userName = sessionStorage.getItem("USERNAME"); // 当前登录用户名
      const currentUser = allUsers.find(u => u.username === this.userName);

      if (currentUser) {
        this.userType = currentUser.data.type; // admin 或 temp
        this.userPapers = currentUser.papers_distributed || []; // 只针对临时用户有用
      }
      console.log("当前用户信息:", this.userType, this.userPapers);
      this.getAllData();
    });
      
  },
  methods: {
    handleCurrentChange(page) {
      this.currentpage1 = page;
    },
    async confirmMerge() {
      console.log('即将合并的试卷：', this.selectedToMerge);
      if (this.selectedToMerge.length === 0) {
        this.$message.warning('请至少选择一份试卷进行合并');
        return;
      }
      // 获取主卷 ID
      const originalPaperId = this.selectedToMerge[0];
      // 获取 totalExam.json 中所有试卷信息
      const allExamMeta = await window.electronAPI.paper.readTotalExamMeta();
      // 查找主卷对应的元信息
      const originalMeta = allExamMeta.find(e => e.paperId === originalPaperId);
      if (!originalMeta) {
        this.$message.error('无法找到原始试卷元信息，合并中止');
        return;
      }
      let allQuestions = [];
      for (const paperId of this.selectedToMerge) {
        const filename = `${paperId}.json`; // 每个 paperId 就是文件名（无路径）
        const questions = await window.electronAPI.paper.readPaperFile(filename);
        if (Array.isArray(questions)) {
          allQuestions = allQuestions.concat(questions);
        }
      }
      // 统一编号 & 清洗字段
      allQuestions = allQuestions.map((q, index) => ({
        ...q,
        score: Number(q.score || 0),
        type: typeof q.type === 'string' ? q.type.trim() : String(q.type),
        richTextContent: q.richTextContent || '<p></p>'
      }));

      // 按题型排序
      const typeOrder = { '选择题': 1, '判断题': 2, '填空题': 3, '主观题': 4 };
      allQuestions.sort((a, b) => (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99));
      //重新编号
      allQuestions = allQuestions.map((q, index) => ({
        ...q,
        id: index + 1
      }));
      // 写入 data/adminpaper 中
      const paperId = this.selectedToMerge[0].split('_')[0]; // e.g. paper1713xxxx
      const timestamp = new Date().getTime(); // 获取当前时间戳
      const mergedFileName = `${paperId}_merge_${timestamp}.json`; 
      const metadata = {
        paperId: mergedFileName.replace('.json', ''),
        name: originalMeta.name + '（合并）',
        score: originalMeta.score,
        department: originalMeta.department,
        duration: originalMeta.duration
      };
      // 只写 questions 到 .json 文件（这是你真正要保存的内容格式）
      await window.electronAPI.paper.writeAdminPaperFile(mergedFileName, allQuestions);
      // 单独把 metadata 写入 totalExam.json（用于界面显示）
      await window.electronAPI.paper.addMergedPaperMeta(metadata);
      this.$message.success('合并成功！');
      // 清空选择 + 刷新已合并试卷列表
      this.selectedToMerge = [];
      await this.getAllData();
    },

    toggleSelect(paperId) {
      const index = this.selectedToMerge.indexOf(paperId);
      if (index === -1) {
        // 不存在则加入
        this.selectedToMerge.push(paperId);
      } else {
        // 已存在则移除
        this.selectedToMerge.splice(index, 1);
      }
    },

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
    importPaper() {
      // 直接调用导入接口，打开文件选择对话框
      this.importPaperFile();
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
    getAllData() {
      window.electronAPI.curriculum.readExamFile()
        .then(questions => {
          // 不再根据用户类型过滤，直接显示所有试卷
          this.tableData = questions;
        })
        .catch(error => {
          console.error('获取题目信息时出错:', error);
        });
    },
    async openAssignDialog(paperId,paperScore) {
      this.currentPaperId = paperId;
      this.currentPaperScore=paperScore;
      // 可选：初始化 assignForm
      this.assignForm = {
        choice: { count: 0, score: 0 },
        judge: { count: 0, score: 0 },
        blank: { count: 0, score: 0 },
        subjective: { count: 0, score: 0 }
      };
      try {
        const filename = `${paperId}.json`;
        const questions = await window.electronAPI.paper.readPaperFile(filename);

        const typeMap = {
          '选择题': 'choice',
          '判断题': 'judge',
          '填空题': 'blank',
          '主观题': 'subjective'
        };

        const typeStats = {
          choice: [],
          judge: [],
          blank: [],
          subjective: []
        };

        // 分类统计
        questions.forEach(q => {
          const key = typeMap[q.type];
          if (key) {
            typeStats[key].push(q.score || 0);
          }
        });

        // 填入 assignForm
        Object.keys(typeStats).forEach(key => {
          const scores = typeStats[key];
          const count = scores.length;
          const totalScore = scores.reduce((sum, s) => sum + s, 0);
          const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

          this.assignForm[key].count = count;
          this.assignForm[key].score = avgScore;  // 可以改为 totalScore / count 或者 totalScore / count 保留小数
        });

      } catch (err) {
        console.error('读取题目出错:', err);
        this.$message.error('读取题目出错');
      }
      this.assignDialogVisible = true;
    },
    async submitAssign() {
      // 添加二次确认
      try {
        await this.$confirm('此操作将删除试卷中的所有现有题目，确定要继续吗？', '二次确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
      } catch {
        // 用户点击取消，直接返回
        return;
      }

      const configList = [
        { type: '选择题', count: this.assignForm.choice.count, score: this.assignForm.choice.score },
        { type: '判断题', count: this.assignForm.judge.count, score: this.assignForm.judge.score },
        { type: '填空题', count: this.assignForm.blank.count, score: this.assignForm.blank.score },
        { type: '主观题', count: this.assignForm.subjective.count, score: this.assignForm.subjective.score }
      ].filter(q => q.count > 0);
    // 计算总分
      const totalScore = configList.reduce((sum, q) => sum + (q.count * q.score), 0);
      if (Number(totalScore) !== Number(this.currentPaperScore)) {
        this.$message.error(`题目总分应为 ${this.currentPaperScore} 分，目前总分为 ${totalScore} 分`);
        return;
      }
      const filename = this.currentPaperId + '.json';
      const cleared = await window.electronAPI.paper.clearPaperFile(this.currentPaperId);
      if (!cleared) {
        this.$message.error('清空原试卷失败，请检查文件权限或路径');
        return;
      }
      let idCounter = 1;
      for (const config of configList) {
        for (let i = 0; i < config.count; i++) {
          const data = {
            id: idCounter++,
            type: config.type,
            richTextContent: '',
            score: config.score
          };
          await window.electronAPI.paper.addQuestion(filename, data);
        }
      }
      this.assignDialogVisible = false;
    },

    async importPaperFile() {
      try {
        const result = await window.electronAPI.paper.importPaperFromDialog();
        if (result.success) {
          this.$message.success('导入成功！');
          await this.getAllData(); // 刷新试卷列表
        } else {
          this.$message.error('导入失败：' + result.message);
        }
      } catch (error) {
        console.error('导入试卷时出错:', error);
        this.$message.error('导入失败，请重试');
      }
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
