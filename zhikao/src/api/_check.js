const officegen = require('officegen');
const parse5 = require('parse5');

const fs2 = require('fs');
const path = require('path');
const { exec } = require('child_process');



import { readPaperFile, convertParsedDocumentToWord, compareQuestions, compareQuestionsAI, checkQuestionIntact } from './_utils';



export function handleCheckAPI(ipcMain) {
    ipcMain.handle('generate-exam-paper', async (event, filename) => {
        try {
            console.log(filename);
    
            // 读取 JSON 格式的题目文件
            // let questions = await readPaperFile(filename);
            
            // 将数据传递给 Python exe
            const exePath = path.resolve('./python', 'matplotlibphoto.exe');
            const filepath = path.resolve('../data/paper', filename);
            const docxname = filename + '.docx';
            const outputDocxPath = path.resolve('../data', docxname);

            console.log('EXE file path:', exePath);
            console.log('JSON file path:', filepath);
            console.log('outputPath:', outputDocxPath);

            exec(`"${exePath}" "${filepath}" "${outputDocxPath}"`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error executing EXE file:', err);
                    return;
                }
                console.log('stdout:', stdout);
                console.error('stderr:', stderr);
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