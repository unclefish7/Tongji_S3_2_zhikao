const officegen = require('officegen');
const parse5 = require('parse5');

const fs2 = require('fs');

import { readPaperFile, convertParsedDocumentToWord, compareQuestions, compareQuestionsAI, checkQuestionIntact } from './_utils';

export function handleCheckAPI(ipcMain) {
    ipcMain.handle('generate-exam-paper', async (event, filename) => {
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
    
            const titleParaFont = ["零", "一", "二", "三", "四"];
            
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
    });

    ipcMain.handle('check-questions', async (event, filename) => {
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
    });

    ipcMain.handle('check-questions-AI', async (event, filename) => {
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
    });
}