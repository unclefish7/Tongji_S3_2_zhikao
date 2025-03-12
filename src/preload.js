const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

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
    editUser: (username, password, data) => ipcRenderer.invoke('edit-user', username, password, data),
    loginUser: loginUser,
    getUserInfo: getUserInfo
  },
  paper: {
    // 这里是与试卷和题目有关的接口，目标一个试卷一个文件，添加/修改题目的流程是，加载试卷，放到前端，修改/添加/删除，写回文件
    // 所以需要有一个地方来存储临时读到的试卷？
    //1.读取试卷信息，（先不加密）

    //2.存储试卷信息，（不加密）

    //Question
    addQuestion: (filename, newQuestionData) => ipcRenderer.invoke('addQuestion', filename, newQuestionData),
    editQuestion: editQuestion,
    readPaperFile: (filename) => ipcRenderer.invoke('readPaperFile', filename),
    shanchuQuestion: shanchuQuestion,

    //Paper
    addPaper: addPaper,
    editPaper: (paperId, updatedData) => ipcRenderer.invoke('editPaper', paperId, updatedData),
    deletePaper: (paperId) => ipcRenderer.invoke('deletePaper', paperId),

  },
  curriculum: {
    readTotalCurriculumFile: () => ipcRenderer.invoke('readTotalCurriculumFile'),
    readExamFile: () => ipcRenderer.invoke('readExamFile'),
    addCurriculum: (newCurriculumData) => ipcRenderer.invoke('addCurriculum', newCurriculumData),
  },
  check: {
    generateExamPaper: generateExamPaper,
    checkQuestions: checkQuestions,
    checkQuestionsAI: checkQuestionsAI,
  },
  //saveImage: (imageData) => ipcMain.invoke('saveImage', imageData)
  saveImage: saveImage,
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



async function getUserInfo() {
    const users = await readUserFile();
    const newData = users.map(({ salt, hashedPassword, ...rest }) => rest);
    return newData
}


/**
     * 
     * @param {*} username 
     * @param {*} password 
     * 功能：输入用户名和密码进行判断，返回用户信息
     */

async function readUserFile() {
  try {
      const data = await fs.readFile('./src/data/user/user.json', 'utf8');
      return JSON.parse(data);
  } catch (err) {
      console.error('Error reading user file:', err);
      return [];
  }
}

async function writeUserFile(users) {
  try {
      await fs.writeFile('./src/data/user/user.json', JSON.stringify(users, null, 2));
  } catch (err) {
      console.error('Error writing user file:', err);
  }
}

async function findUserInfo(username) {
  const users = await readUserFile();
  for (const userInfo of users) {
      if (userInfo.username === username) {
          return userInfo;
      }
  }
  return null;
}

async function loginUser(username, password) {
  const userInfo = await findUserInfo(username);
  if (!userInfo) {
    return { success: false, message: 'Invalid username' };
  }
  const iterations = 1000;
  const keylen = 64;
  const digest = 'sha512';
  return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, userInfo.salt, iterations, keylen, digest, (err, derivedKey) => {
          if (err) {
              console.error('Error encrypting password:', err);
              reject(err);
              return;
          }
          const hashedPassword = derivedKey.toString('hex');
          if (userInfo.hashedPassword === hashedPassword) {
              resolve({ success: true, message: 'Login successful', user: { username: userInfo.username, userdata: userInfo.data} });
          } else {
              resolve({ success: false, message: 'Invalid username or password' });
          }
      });
  });
}

async function editQuestion(filename, id, updatedData) {
  try {
    console.log(filename)
      let existingData = await readPaperFile(filename);
      const index = existingData.findIndex(item => item.id == id);
      console.log(index)
      if (index!== -1) {
          existingData[index] = {...existingData[index],...updatedData };
          return await saveRichTextData(filename, existingData);
      } else {
          return { success: false, message: 'Question with the given id not found' };
      }
  } catch (error) {
      console.error('Error editing question:', error);
      return { success: false, message: 'Failed to edit question' };
  }
}

/*
 * 读取总的考试文件，然后删除某一份试卷的信息
 *
*/
async function shanchuQuestion(filename, questionId) {
    try {
        let existingData = await readPaperFile(filename);
        const index = existingData.findIndex(item => item.id == questionId);
        if (index!== -1) {
            //删除id对应题目
            existingData.splice(index, 1);
            return await saveRichTextData(filename, existingData);
        } else {
            return { success: false, message: 'the given id not found' };
        }
    } catch (error) {
        console.error('Error delete question:', error);
        return { success: false, message: 'Failed to delete question' };
    }
}

/*
 * 添加试卷，主要工作有两个，一个是在课程文件中，添加该项试卷的信息；另一个是在存放试卷位置添加考卷文件
 *
*/
async function addPaper(data) {
  try {
      let existingData = await readExamFile();
      // 生成新的 id 以paper + 时间戳来命名
      let newId = `paper${Date.now()}`;
      //console.log(curriculumId)
      //if (existingData.length > 0) {
      //    newId = existingData[existingData.length - 1].id + 1;
      //}
      data.paperId = newId;
      existingData.push(data);
      const result =  await saveCurriculumData(existingData);
      console.log(result)
      if (result.success){
        //生成文件
        initContent = '[]';
        const filepath = './src/data/paper/' + data.paperId +'.json';
        fs.writeFile(filepath, initContent, 'utf8');
        return { success: true, message: 'Data saved successfully' };
      }
  } catch (error) {
      console.error('Error editing question:', error);
      return { success: false, message: 'Failed to edit question' };
  }
}

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

const officegen = require('officegen');
const nodejieba = require('nodejieba');
const parse5 = require('parse5');

const fs2 = require('fs');

/*
 * 读取总课程文件，读取总的课程文件，获取到所有课程信息
 *
*/
async function generateExamPaper(filename) {
    try {
        console.log(filename)
        let questions = await readPaperFile(filename);
        let docx = officegen('docx');
        //let examDocx = docx.createP();
        //试卷的固定格式
        let examInfo = docx.createP();
        // 设置考试信息的字体大小为三号
        examInfo.options.font_size = 24;
        // 居中显示学院和课程信息
        examInfo.options.align = 'center';
        examInfo.addText('计算机科学与技术学院-研究生招生考试');
        // 新段落用于学号姓名和总分数信息
        let studentInfo = docx.createP();
        // 左对齐
        studentInfo.options.align = 'left';
        studentInfo.addText('准考证考号：_______________  姓名：_______________');
        studentInfo.addLineBreak();
        studentInfo.addText('总分数：_______________');
        // 新段落用于考试类型
        let examType = docx.createP();
        examType.options.align = 'left';
        examType.addText('考试类型： 平时测试____  期中测试____  期末测试____  缺考____');
        // 新段落用于分割线
        let divider = docx.createP();
        divider.addHorizontalLine();
        // 将考试信息部分添加到文档中
        /*
        docx.addSection(examInfo);
        docx.addSection(studentInfo);
        docx.addSection(examType);
        docx.addSection(divider);
        */
        //固定格式结束

        // 初始化不同题型的数组
        const choiceQuestions = [];
        const judgmentQuestions = [];
        const fillInQuestions = [];
        const subjectiveQuestions = [];
        // 按题型分类题目
        questions.forEach(question => {
            switch (question.type) {
                case '选择题':
                    choiceQuestions.push(question);
                    break;
                case '判断题':
                    judgmentQuestions.push(question);
                    break;
                case '填空题':
                    fillInQuestions.push(question);
                    break;
                case '主观题':
                    subjectiveQuestions.push(question);
                    break;
            }
        });

        // 定义题型和对应题目数组的映射
        const questionTypeMap = {
            '选择题': choiceQuestions,
            '判断题': judgmentQuestions,
            '填空题': fillInQuestions,
            '主观题': subjectiveQuestions
        };
        let sectionNumber = 1;

        titleParaFont = ["零", "一", "二", "三", "四"]
        
        //为每个题型生成word文档
        for (const [type, questionList] of Object.entries(questionTypeMap)) {
            if (questionList.length > 0) {
                // 添加一级区分标题
                let titlePara = docx.createP();
                titlePara.options.font_size = 14; // 四号字体是 14pt，这里用 16pt 稍大一点
                titlePara.options.bold = true;    // 设置为加粗
                titlePara.addText(`${titleParaFont[sectionNumber]}、${type}`);
                sectionNumber++;

                questionList.forEach((question) => {
                    if (question.richTextContent) {
                        const document = parse5.parse(question.richTextContent);
                        convertParsedDocumentToWord(docx, document);
                    }
                    if (question.type === '主观题') {
                        const numEmptyLines = 4; // 可以根据需要调整空行数量
                        for (let i = 0; i < numEmptyLines; i++) {
                            docx.createP().addLineBreak();
                        }
                    }
                });
            }
        }
        
        let out = fs2.createWriteStream('./src/data/exam_paper' + filename + '.docx');
        docx.generate(out);
        out.on('close', function () {
            console.log('Exam paper generated successfully as DOCX');
        });
    } catch (e) {
        console.error('Error generating exam paper:', e);
    }
}

function convertParsedDocumentToWord(docx, document) {
    const MAX_WIDTH = 120.0; // 预设图片最大宽度
    const MAX_HEIGHT = 80.0; // 预设图片最大高度

    const traverse = (node) => {
        if (node.nodeName === 'p') {
            let paragraph = docx.createP();
            if (node.childNodes) {
                node.childNodes.forEach(child => {
                    if (child.nodeName === '#text') {
                        let paragraphText = ''
                        if (child.value.trim()!== '') {
                            paragraphText += child.value;
                            paragraph.addText(paragraphText);
                        }
                    } else if (child.nodeName === 'img') {
                        // 获取图片的宽度和高度
                        const width = getStyleValue(child, 'width');
                        const height = getStyleValue(child, 'height');
                        const src = getAttributeValue(child, 'src');

                        // 计算调整后的宽度和高度
                        let adjustedWidth = 0.0;
                        let adjustedHeight = 0.0;

                        if (width.endsWith('px') && height.endsWith('px')) {
                            const widthNum = parseFloat(width.slice(0, -2));
                            const heightNum = parseFloat(height.slice(0, -2))

                            // 计算缩放比例
                            let scale = 1.0;
                            if (widthNum > MAX_WIDTH) {
                                scale = MAX_WIDTH / widthNum;
                            }
                            if (heightNum * scale > MAX_HEIGHT) {
                                scale = MAX_HEIGHT / heightNum;
                            }
                            // 计算调整后的宽度和高度
                            adjustedWidth = widthNum * scale;
                            adjustedHeight = heightNum * scale;
                        } else {
                            adjustedWidth = MAX_WIDTH;
                            adjustedHeight = MAX_HEIGHT;
                        }
                        
                        // 创建一个段落来放置图片
                        // let imgParagraph = docx.createP();
                        // 这里假设 docx 库有一个方法可以根据 src 添加图片并设置宽高
                        // 实际使用时需要根据具体的 docx 库文档来调整
                        if (src.startsWith('file:///')) {
                            const cgsrc = src.slice(8);
                            paragraph.addImage(cgsrc, {
                                cx: adjustedWidth, // 宽度
                                cy: adjustedHeight // 高度
                            });
                        }
                        
                        //const absoluteSrc = path.resolve(src);
                        //console.log(absoluteSrc)

                        
                    }
                });
            }

        } else if (node.childNodes) {
            node.childNodes.forEach(child => {
                traverse(child);
            });
        }
    };

    // 辅助函数：从节点的属性列表中获取指定属性的值
    function getAttributeValue(node, attrName) {
        if (node.attrs) {
            const attr = node.attrs.find(attr => attr.name === attrName);
            return attr? attr.value : '';
        }
        return '';
    }

    // 辅助函数：从节点的 style 属性中获取指定样式的值
    function getStyleValue(node, styleName) {
        const styleAttr = getAttributeValue(node, 'style');
        if (styleAttr) {
            const styles = styleAttr.split(';');
            for (let style of styles) {
                const [name, value] = style.split(':');
                if (name.trim() === styleName) {
                    return value.trim();
                }
            }
        }
        return '';
    }

    if (document.childNodes) {
        document.childNodes.forEach(child => {
            traverse(child);
        });
    }
}


function diceCoefficient(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    let firstBigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
        const bigram = a.substr(i, 2);
        firstBigrams.set(bigram, (firstBigrams.get(bigram) || 0) + 1);
    }
    let intersectionSize = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bigram = b.substr(i, 2);
        const count = firstBigrams.get(bigram) || 0;
        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }
    return (2.0 * intersectionSize) / (a.length + b.length - 2);
}

function extractTextFromRichText(richText) {
    let startIndex = 0;
    let endIndex = 0;
    let result = '';
    richText = richText.replace(/&lt;/g, '<').replace(/&gt;/g, '>'); // 替换转义字符
    while ((startIndex = richText.indexOf('<p', endIndex))!== -1) {
        let endTagIndex = richText.indexOf('</p>', startIndex);
        let selfClosing = false;
        if (richText[startIndex + 2] === '/') {
            // 处理自闭合标签
            selfClosing = true;
            endTagIndex = startIndex + 3;
        } else if (endTagIndex === -1) {
            break;
        }
        startIndex = richText.indexOf('>', startIndex) + 1;
        if (selfClosing) {
            result += '\n';
        } else {
            let content = richText.slice(startIndex, endTagIndex);
            result += content + '\n';
        }
        endIndex = endTagIndex + 4;
    }
    return result.trim();
}

async function checkQuestions(filename) {
    console.log(filename)
    let dataJson = {};
    // 调用 compareQuestions 函数
    const similarityResults = await compareQuestions(filename);
    dataJson.similarityResults = similarityResults;
    // 调用 checkQuestionIntact 函数
    const missObjData = await checkQuestionIntact(filename);
    dataJson.missObjData = missObjData;
    console.log(dataJson)
    return dataJson;
}

async function checkQuestionsAI(filename) {
    let dataJson = {};
    // 调用 compareQuestions 函数
    const similarityResults = await compareQuestionsAI(filename);
    dataJson.similarityResults = similarityResults;
    // 调用 checkQuestionIntact 函数
    const missObjData = await checkQuestionIntact(filename);
    dataJson.missObjData = missObjData;
    console.log("dataJson")
    console.log(dataJson)
    return dataJson;
}


async function compareQuestions(filename) {
    let questions = await readPaperFile(filename)
    // 假设题目数据存储在一个文件中，例如 questions.json
    const similarityQuestions = [];
    const n = questions.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const textA = extractTextFromRichText(questions[i].richTextContent);
            const textB = extractTextFromRichText(questions[j].richTextContent);
            //console.log(textA)
            //console.log(textB)
            // 对中文文本进行分词处理
            const segmentedA = nodejieba.cut(textA);
            const segmentedB = nodejieba.cut(textB);
            // 计算分词后的相似度
            const similarity = diceCoefficient(segmentedA.join(''), segmentedB.join(''));
            if (similarity > 0.5) { // 可调整相似度阈值
                smData = {"questionA": questions[i], "questionB":questions[j], "score": similarity.toFixed(2)}
                console.log(smData)
                similarityQuestions.push(smData);
            }
        }
    }
    return similarityQuestions
}

const { exec } = require('child_process');

// 封装 exec 为 Promise
function executePython(exePath, workingDir) {
    return new Promise((resolve, reject) => {
        exec(exePath, { cwd: workingDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行 Python 程序时出错: ${error}`);
                reject(error);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve();
        });
    });
}

async function compareQuestionsAI(filename) {
    let questions = await readPaperFile(filename)
    // 假设题目数据存储在一个文件中，例如 questions.json
    let sentences = [];
    const n = questions.length;
    for (let i = 0; i < n; i++) {
        const text = extractTextFromRichText(questions[i].richTextContent);
        sentences.push(text);
    }

    // 将句子保存到 input.json 文件
    const inputData = { sentences };
    const inputJson = JSON.stringify(inputData);
    fs.writeFile('./src/data/transformer/checkinput.json', inputJson);
    

    // 构建绝对路径
    const currentDir = __dirname;
    //const exePath = path.join(currentDir, 'src', 'data', 'transformer', 'similarity_check.exe');
    const exePath = "D:\\work_dir\\zhikao\\src\\data\\transformer\\similarity_check075.exe"
    const workingDir = path.dirname(exePath);
    //调用python然后返回
    try {
        // 执行 Python 程序
        await executePython(exePath, workingDir);

        let similarityQuestions = [];
        // 检查 output.json 文件是否存在
        const outputFilePath = './src/data/transformer/checkoutput.json';
        const readData = await fs.readFile(outputFilePath, 'utf8');
        const similarityPairs = JSON.parse(readData);

        for (const pair of similarityPairs) {
            const questionA = questions.find(q => extractTextFromRichText(q.richTextContent) === pair.textA);
            const questionB = questions.find(q => extractTextFromRichText(q.richTextContent) === pair.textB);
            const smData = {
                "questionA": questionA,
                "questionB": questionB,
                "score": pair.score.toFixed(2)
            };
            similarityQuestions.push(smData);
        }
        return similarityQuestions;
    } catch (error) {
        console.error('处理过程中出现错误:', error);
        return [];
    }
}

async function checkQuestionIntact(filename) {
    let questions = await readPaperFile(filename)
    // 假设题目数据存储在一个文件中，例如 questions.json
    const missingTableQuestions = [];
    const n = questions.length;
    for (let i = 0; i < n; i++) {
        let hasTableKeyword = false;
        let hasTableTag = false;
        const richText = questions[i].richTextContent;
        // 检查是否有表格关键字
        if (richText.includes("表格") || richText.includes("表如下") || richText.includes("表如上") || richText.includes("表格如下") || richText.includes("表格如上")) {
            hasTableKeyword = true;
            // 检查是否有 <table> 元素
            if (/<table\b[^>]*>/i.test(richText)) { 
                hasTableTag = true;
            }
        }
        // 如果有表格关键字但没有 <table> 元素，添加到缺失列表
        if (hasTableKeyword &&!hasTableTag) {
            missingTableQuestions.push(questions[i]);
        }
    }
    return missingTableQuestions
}
