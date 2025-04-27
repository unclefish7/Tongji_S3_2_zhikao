import { contextBridge, ipcRenderer } from "electron";
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');


contextBridge.exposeInMainWorld('electronAPI', {
  
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),
  user: {
    // 这里可以添加更多与用户相关的函数或变量
    getUserName: () => 'John Doe',
    getUserAge: () => 30,
    registerUser: (username, password, data) => ipcRenderer.invoke('register-user', username, password, data),
    editUser: (username, password, data) => ipcRenderer.invoke('edit-user', username, password),
    loginUser: (username, password) => ipcRenderer.invoke('login-user', username, password),
    getUserInfo: () => ipcRenderer.invoke('get-user-info'),
    
  },
  paper: {
    // 这里是与试卷和题目有关的接口，目标一个试卷一个文件，添加/修改题目的流程是，加载试卷，放到前端，修改/添加/删除，写回文件
    // 所以需要有一个地方来存储临时读到的试卷？
    //1.读取试卷信息，（先不加密）

    //2.存储试卷信息，（不加密）

    //Question
    addQuestion: (filename, newQuestionData,userName) => ipcRenderer.invoke('addQuestion', filename, newQuestionData,userName),
    editQuestion: (filename, id, updatedData,userName) => ipcRenderer.invoke('editQuestion', filename, id, updatedData,userName),
    readPaperFile: (filename) => ipcRenderer.invoke('readPaperFile', filename),
    deleteQuestion: (filename, questionId,userName) => ipcRenderer.invoke('deleteQuestion', filename, questionId, userName),

    //Paper
    importPaper: (filePath, userName) => ipcRenderer.invoke('paper:importPaperFile', filePath, userName),
    addPaper: (data) => ipcRenderer.invoke('addPaper', data),
    editPaper: (paperId, updatedData) => ipcRenderer.invoke('editPaper', paperId, updatedData),
    deletePaper: (paperId) => ipcRenderer.invoke('deletePaper', paperId),
    updatePaperPermissions: (paperId, userList) => ipcRenderer.invoke('updatePaperPermissions', paperId, userList),
    listAllPaperFiles: () => ipcRenderer.invoke('paper:listAllPaperFiles'),
    writePaperFile: (filename, data) => ipcRenderer.invoke('paper:writePaperFile', filename, data),
    listAdminPaperFiles: () => ipcRenderer.invoke('paper:listAdminPaperFiles'),
    writeAdminPaperFile: (filename, data) => ipcRenderer.invoke('paper:writeAdminPaperFile', filename, data),
    readTotalExamMeta: () => ipcRenderer.invoke('paper:readTotalExamMeta'),
    addMergedPaperMeta: (meta) => ipcRenderer.invoke('paper:addMergedPaperMeta', meta),
  },
  curriculum: {
    readTotalCurriculumFile: () => ipcRenderer.invoke('readTotalCurriculumFile'),
    readExamFile: () => ipcRenderer.invoke('readExamFile'),
    addCurriculum: (newCurriculumData) => ipcRenderer.invoke('addCurriculum', newCurriculumData),
  },
  check: {
    generateExamPaper: (filename) => ipcRenderer.invoke('generate-exam-paper', filename),
    checkQuestions: (filename) => ipcRenderer.invoke('check-questions', filename),
    checkQuestionsAI: (filename) => ipcRenderer.invoke('check-questions-AI', filename),
  },
  //saveImage: (imageData) => ipcMain.invoke('saveImage', imageData)
  saveImage: (imageData) => ipcRenderer.invoke('save-image', imageData),

});

//const cheerio = require('cheerio');
//这里遇到一些问题，webpack无法解析referrer: req.getHeader("referer") ?? undefined
//这里面的符号，需要配置一些东西来解决，目前修改了babel.config.js，希望能够解决。
/**进程间通信的方式来进行文件的存储，可能更加安全
 ipcMain.handle('saveImage', async (event, imageData) => {
  try {
    const buffer = Buffer.from(imageData, 'base64');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileName = `${hash}.png`;
    const savePath = path.join(app.getPath('userData'), fileName);
    await fs.promises.writeFile(savePath, buffer);
    return `file://${savePath}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
});
 */


/*
 * 存储图片，返回src
 *
*/
async function saveImage(filepath) {
    try {
        // 获取文件名
        console.log("123123");
        console.log(filepath);
        const originalFileName = path.basename(filepath);
        console.log(originalFileName);

        // 拆分文件名和扩展名
        const ext = path.extname(originalFileName);
        const nameWithoutExt = path.basename(originalFileName, ext);

        // 生成带时间戳的文件名
        const timestamp = Date.now();
        const newFileName = `${nameWithoutExt}_${timestamp}${ext}`;

        // 构建目标文件路径
        const targetFolder = `./src/img`
        const targetPath = path.join(targetFolder, newFileName);
        console.log(targetPath);

        // 复制文件到目标文件夹
        await fs.copyFile(filepath, targetPath);

        // 生成相对地址
        const relativeUrl = `./src/img/${newFileName}`;

        return relativeUrl;
    } catch (error) {
        console.error('文件复制失败:', error);
        throw error;
    }
}
