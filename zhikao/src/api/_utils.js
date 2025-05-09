const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

export async function readUserFile() {
    try {
        const data = await fs.readFile('../data/user/user.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading user file:', err);
        return [];
    }
  }

export async function writeUserFile(users) {
    try {
        await fs.writeFile('../data/user/user.json', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error writing user file:', err);
    }
  }

export async function findUserInfo(username) {
  const users = await readUserFile();
  for (const userInfo of users) {
      if (userInfo.username === username) {
          return userInfo;
      }
  }
  return null;
}

export async function readTotalCurriculumFile() {
    const filePath = '../data/exam/totalCurriculum.json';
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const existingData = JSON.parse(fileContent);
        return existingData;
    } catch (err) {
        console.error('读取文件或解析 JSON 时出错:', err);
        return [];
    }
}

/**
 * 
 * @param {*} data
 * 功能：要存储的内容
 */
export async function saveTotalCurriculumData(data) {
    try {
        const filePath = '../data/curriculum/totalCurriculum.json';
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data saved successfully to', filePath);
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

/*export async function readExamFile() {
    const filePath = '../data/exam/totalExam.json';
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const existingData = JSON.parse(fileContent);
        return existingData;
    } catch (err) {
        console.error('读取文件或解析 JSON 时出错:', err);
        return [];
    }
}*/

export async function readExamFile() {
    const examFilePath = path.join('..', 'data', 'exam', 'totalExam.json');
    const paperFolderPath = path.join('..', 'data', 'paper');
  
    try {
      // 1. 获取 /data/paper/ 下所有已有的paperId（去掉.json后缀）
      const paperFiles = await fs.readdir(paperFolderPath);
      const existingPaperIds = new Set(
        paperFiles
          .filter(name => name.endsWith('.json'))
          .map(name => name.replace('.json', ''))
      );
  
      // 2. 读取 totalExam.json
      const fileContent = await fs.readFile(examFilePath, 'utf8');
      const allExamMeta = JSON.parse(fileContent); // 这里直接是数组
  
      // 3. 过滤掉磁盘上不存在的paperId
      const filteredExamMeta = allExamMeta.filter(entry => existingPaperIds.has(entry.paperId));
  
      // ✅ 注意：这里只返回，不写回totalExam.json
      return filteredExamMeta;
    } catch (err) {
      console.error('读取 totalExam.json 时出错:', err);
      return [];
    }
  }
  


/**
 * 
 * @param {*} data
 * 功能：要存储的内容
 */
export async function saveExamData(data) {
    try {
        const filePath = '../data/exam/totalExam.json';
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data saved successfully to', filePath);
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

export async function readPaperFile(filename) {
    const filePath = '../data/paper/' + filename;
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const existingData = JSON.parse(fileContent);
        return existingData;
    } catch (err) {
        console.error('读取文件或解析 JSON 时出错:', err);
        return [];
    }
}

/**
 * 
 * @param {*} data
 * 功能：要存储的内容
 */
export async function saveRichTextData(filename, data) {
    try {
      const filePath = '../data/paper/' + filename;
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data saved successfully to', filePath);
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

// 封装 exec 为 Promise
export function executeProgram(exePath, workingDir,inputFile,outputFile) {
    return new Promise((resolve, reject) => {
        const command = `"${exePath}" --input "${inputFile}" --output "${outputFile}"`; // 拼接带参数的命令
        exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行 Python 程序时出错: ${error.message || JSON.stringify(error)}`);
                reject(error);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            resolve();
        });
    });
}

export function diceCoefficient(a, b) {
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

export function extractTextFromRichText(richText) {
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

export async function compareQuestions(filename) {
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
                let smData = {"questionA": questions[i], "questionB":questions[j], "score": similarity.toFixed(2)}
                console.log(smData)
                similarityQuestions.push(smData);
            }
        }
    }
    return similarityQuestions
}

export async function compareQuestionsAI(filename) {
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
    

    // 构建绝对路径
    const exePath = path.resolve(__dirname, "../python/similarity_check.exe");
    const inputPath = path.resolve(__dirname, "../../data/transformer/checkinput.json"); // 输入文件路径
    const outputPath = path.resolve(__dirname, "../../data/transformer/checkoutput.json");
    fs.writeFile(inputPath, inputJson);
    const workingDir = path.dirname(exePath);

    //调用python然后返回
    try {
        // 执行 Python 程序
        await executeProgram(exePath, workingDir,inputPath,outputPath);

        let similarityQuestions = [];
        // 检查 output.json 文件是否存在
        const readData = await fs.readFile(outputPath, 'utf8');
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

export async function checkQuestionIntact(filename) {
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

/**
 * 
 * @param {*} data
 * 功能：创建特殊的试卷格式便于用户导入
 */
export async function createPaperDTO (paperId, username) {
    try {
        const filename = paperId + '.json';
        const questions = await readPaperFile(filename);
        const exams = await readExamFile();
        // 找到对应 paperId 的信息
        const examInfo = exams.find(exam => exam.paperId === paperId);
    
        if (!examInfo) {
            console.error(`未找到对应的试卷信息: ${paperId}`);
            return;
        }

        const newPaperId = `${paperId}_${username}`;
        
        // 构建 DTO 对象
        const paperDTO = {
            info: {
              paperId: newPaperId,
              name: `${examInfo.name}_${username}`,
              score: examInfo.score,
              department: examInfo.department,
              duration: examInfo.duration
            },
            questions: questions
        };  
    
        // 确保保存目录存在
        const saveDir = '../data/paperDTO';

        // 保存为 paperId_username.json
        const savePath = path.join(saveDir, `${paperId}_${username}.json`);
        await fs.writeFile(savePath, JSON.stringify(paperDTO, null, 2), 'utf-8');
    
        console.log(`成功为用户 ${username} 创建试卷 DTO 文件：${savePath}`);

        // 更新 totalExam：新增一条新的记录
        const updatedExams = [...exams, {
            paperId: newPaperId,
            name: `${examInfo.name}_${username}`, // 在原有的 name 后加上用户名后缀
            score: examInfo.score,
            department: examInfo.department,
            duration: examInfo.duration
        }];
        await saveExamData(updatedExams);

    } catch (error) {
        console.error('创建 PaperDTO 文件时出错:', error);
    }

}

export function convertParsedDocumentToWord(docx, document) {
    const MAX_WIDTH = 120.0; // 预设图片最大宽度
    const MAX_HEIGHT = 80.0; // 预设图片最大高度

    const traverse = (node) => {
        if (node.nodeName === 'p') {
            handleParagraphNode(node);
        } else if (node.childNodes) {
            node.childNodes.forEach(child => traverse(child));
        }
    };

    function handleParagraphNode(node) {
        let paragraph = docx.createP();
        if (node.childNodes) {
            node.childNodes.forEach(child => {
                if (child.nodeName === '#text') {
                    handleTextNode(child, paragraph);
                } else if (child.nodeName === 'img') {
                    handleImageNode(child, paragraph);
                }
            });
        }
    }

    function handleTextNode(child, paragraph) {
        let paragraphText = '';
        if (child.value.trim() !== '') {
            paragraphText += child.value;
            paragraph.addText(paragraphText);
        }
    }

    function handleImageNode(child, paragraph) {
        const width = getStyleValue(child, 'width');
        const height = getStyleValue(child, 'height');
        const src = getAttributeValue(child, 'src');

        let { adjustedWidth, adjustedHeight } = calculateAdjustedDimensions(width, height);

        if (src.startsWith('file:///')) {
            const cgsrc = src.slice(8);
            paragraph.addImage(cgsrc, {
                cx: adjustedWidth,
                cy: adjustedHeight
            });
        }
    }

    function calculateAdjustedDimensions(width, height) {
        let adjustedWidth = MAX_WIDTH;
        let adjustedHeight = MAX_HEIGHT;

        if (width.endsWith('px') && height.endsWith('px')) {
            const widthNum = parseFloat(width.slice(0, -2));
            const heightNum = parseFloat(height.slice(0, -2));

            let scale = 1.0;
            if (widthNum > MAX_WIDTH) {
                scale = MAX_WIDTH / widthNum;
            }
            if (heightNum * scale > MAX_HEIGHT) {
                scale = MAX_HEIGHT / heightNum;
            }

            adjustedWidth = widthNum * scale;
            adjustedHeight = heightNum * scale;
        }

        return { adjustedWidth, adjustedHeight };
    }

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