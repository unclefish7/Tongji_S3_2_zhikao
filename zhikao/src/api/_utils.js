const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// 加密配置
const ENCRYPTION_KEY = 'zhikao-system-2024-secure-key-32b'; // 32字节密钥
const ALGORITHM = 'aes-256-cbc';

// 确保密钥是32字节
function getKey() {
    const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
    if (key.length < 32) {
        // 如果密钥长度不足32字节，用0填充
        const paddedKey = Buffer.alloc(32);
        key.copy(paddedKey);
        return paddedKey;
    } else if (key.length > 32) {
        // 如果密钥长度超过32字节，截取前32字节
        return key.slice(0, 32);
    }
    return key;
}

// 加密函数 - 简化版，与Python保持一致
function encrypt(text) {
    try {
        // 生成随机IV（16字节）
        const iv = crypto.randomBytes(16);
        const key = getKey().slice(0, 16); // 使用前16字节作为密钥
        
        // 简单的XOR加密（与Python脚本保持一致）
        const textBuffer = Buffer.from(text, 'utf8');
        const encrypted = Buffer.alloc(textBuffer.length);
        
        for (let i = 0; i < textBuffer.length; i++) {
            encrypted[i] = textBuffer[i] ^ key[i % key.length] ^ iv[i % iv.length];
        }
        
        // 返回 IV:加密数据 的格式
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('加密失败:', error);
        throw new Error('数据加密失败');
    }
}

// 解密函数 - 简化版，与Python保持一致
function decrypt(encryptedData) {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('加密数据格式错误');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedBuffer = Buffer.from(parts[1], 'hex');
        const key = getKey().slice(0, 16); // 使用前16字节作为密钥
        
        // 简单的XOR解密
        const decrypted = Buffer.alloc(encryptedBuffer.length);
        
        for (let i = 0; i < encryptedBuffer.length; i++) {
            decrypted[i] = encryptedBuffer[i] ^ key[i % key.length] ^ iv[i % iv.length];
        }
        
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('解密失败:', error);
        throw new Error('数据解密失败');
    }
}

// 导出加密文件读写函数供其他模块使用
export async function readEncryptedFile(filePath) {
    try {
        const encryptedData = await fs.readFile(filePath, 'utf8');
        
        // 检查是否是加密数据格式（包含冒号且不是JSON）
        if (encryptedData.includes(':') && !encryptedData.trim().startsWith('{') && !encryptedData.trim().startsWith('[')) {
            const decryptedData = decrypt(encryptedData);
            return JSON.parse(decryptedData);
        } else {
            // 如果不是加密格式，直接当作JSON解析（向后兼容）
            return JSON.parse(encryptedData);
        }
    } catch (error) {
        console.error('读取加密文件失败:', error);
        throw error; // 抛出错误以便调用方处理
    }
}

export async function writeEncryptedFile(filePath, data) {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const encryptedData = encrypt(jsonString);
        await fs.writeFile(filePath, encryptedData, 'utf8');
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('写入加密文件失败:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

export async function readUserFile() {
    try {
        return await readEncryptedFile('../data/user/user.json');
    } catch (err) {
        console.error('Error reading user file:', err);
        return [];
    }
}

export async function writeUserFile(users) {
    try {
        await writeEncryptedFile('../data/user/user.json', users);
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
        return await readEncryptedFile(filePath);
    } catch (err) {
        console.error('读取文件或解析 JSON 时出错:', err);
        return [];
    }
}

export async function saveTotalCurriculumData(data) {
    try {
        const filePath = '../data/curriculum/totalCurriculum.json';
        return await writeEncryptedFile(filePath, data);
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

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
  
      // 2. 读取加密的 totalExam.json
      const allExamMeta = await readEncryptedFile(examFilePath);
  
      // 3. 过滤掉磁盘上不存在的paperId
      const filteredExamMeta = allExamMeta.filter(entry => existingPaperIds.has(entry.paperId));
  
      return filteredExamMeta;
    } catch (err) {
      console.error('读取 totalExam.json 时出错:', err);
      return [];
    }
}

export async function saveExamData(data) {
    try {
        const filePath = '../data/exam/totalExam.json';
        return await writeEncryptedFile(filePath, data);
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

export async function readPaperFile(filename) {
    const filePath = '../data/paper/' + filename;
    try {
        return await readEncryptedFile(filePath);
    } catch (err) {
        console.error('读取文件或解析 JSON 时出错:', err);
        return [];
    }
}

export async function saveRichTextData(filename, data) {
    try {
        const filePath = '../data/paper/' + filename;
        return await writeEncryptedFile(filePath, data);
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

    // 将句子保存到 input.json 文件（加密存储）
    const inputData = { sentences };
    
    // 构建绝对路径
    const exePath = path.resolve(__dirname, "../python/similarity_check.exe");
    const inputPath = path.resolve(__dirname, "../../data/transformer/checkinput.json"); // 输入文件路径
    const outputPath = path.resolve(__dirname, "../../data/transformer/checkoutput.json");
    
    // 使用加密方式写入输入文件
    await writeEncryptedFile(inputPath, inputData);
    
    const workingDir = path.dirname(exePath);

    //调用python然后返回
    try {
        // 执行 Python 程序
        await executeProgram(exePath, workingDir, inputPath, outputPath);

        let similarityQuestions = [];
        
        // 使用加密方式读取输出文件
        const similarityPairs = await readEncryptedFile(outputPath);

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

        // 保存为加密的 paperId_username.json
        const savePath = path.join(saveDir, `${paperId}_${username}.json`);
        await writeEncryptedFile(savePath, paperDTO);
    
        console.log(`成功为用户 ${username} 创建试卷 DTO 文件：${savePath}`);

        // 更新 totalExam：新增一条新的记录
        const updatedExams = [...exams, {
            paperId: newPaperId,
            name: `${examInfo.name}_${username}`,
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

/**
 * 保存图片文件到指定目录
 * @param {string} sourceFilePath 源文件路径
 * @returns {Promise<string>} 返回保存后的相对路径
 */
export async function saveImage(sourceFilePath) {
    try {
        console.log("开始保存图片:", sourceFilePath);
        
        // 获取文件名和扩展名
        const originalFileName = path.basename(sourceFilePath);
        const ext = path.extname(originalFileName);
        const nameWithoutExt = path.basename(originalFileName, ext);
        
        // 生成带时间戳的唯一文件名
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const newFileName = `${nameWithoutExt}_${timestamp}_${randomSuffix}${ext}`;
        
        // 确保目标目录存在
        const targetFolder = path.resolve('./src/img');
        await fs.mkdir(targetFolder, { recursive: true });
        
        const targetPath = path.join(targetFolder, newFileName);
        console.log("目标路径:", targetPath);
        
        // 复制文件到目标目录
        await fs.copyFile(sourceFilePath, targetPath);
        
        // 返回相对路径（用于前端访问）
        const relativePath = path.join('./src/img', newFileName).replace(/\\/g, '/');
        console.log("保存成功，相对路径:", relativePath);
        
        return relativePath;
    } catch (error) {
        console.error('保存图片失败:', error);
        throw new Error(`图片保存失败: ${error.message}`);
    }
}