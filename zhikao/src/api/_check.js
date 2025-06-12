const officegen = require('officegen');
const parse5 = require('parse5');

const fs2 = require('fs');
const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');

const { ipcMain } = require('electron');



import { readPaperFile, convertParsedDocumentToWord, compareQuestions, compareQuestionsAI, checkQuestionIntact, writeEncryptedFile, readEncryptedFile } from './_utils';



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

    ipcMain.handle('generate-answer-sheet', async (event, filename) => {
        try {
            console.log('准备生成答题卡：', filename);

            const exePath = path.resolve('./python', 'generate_answer_sheet.exe'); // 你打包好的 .exe 文件名
            const filepath = path.resolve('../data/paper', filename);
            const outputDocxPath = path.resolve('../data', filename + '_answer_sheet.docx');

            console.log('EXE path:', exePath);
            console.log('Input JSON path:', filepath);
            console.log('Output DOCX path:', outputDocxPath);

            exec(`"${exePath}" "${filepath}" "${outputDocxPath}"`, (err, stdout, stderr) => {
            if (err) {
                console.error('答题卡生成失败:', err);
                return;
            }
            console.log('答题卡生成完成');
            console.log('stdout:', stdout);
            console.error('stderr:', stderr);
            });

        } catch (e) {
            console.error('执行生成答题卡命令时出错:', e);
        }
    });

    ipcMain.handle('generate-answer', async (event, filename) => {
        try {
            console.log('准备生成答案：', filename);

            const exePath = path.resolve('./python', 'matplotlibphoto.exe');
            const filepath = path.resolve('../data/paper', filename);
            const answerDocxName = filename.replace('.json', '') + '_answer.docx';
            const outputDocxPath = path.resolve('../data', answerDocxName);

            console.log('EXE path:', exePath);
            console.log('Input JSON path:', filepath);
            console.log('Output DOCX path:', outputDocxPath);

            exec(`"${exePath}" "${filepath}" answer "${outputDocxPath}"`, (err, stdout, stderr) => {
                if (err) {
                    console.error('答案生成失败:', err);
                    return;
                }
                console.log('答案生成完成');
                console.log('stdout:', stdout);
                console.error('stderr:', stderr);
            });

        } catch (e) {
            console.error('执行生成答案命令时出错:', e);
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

    // 注册 IPC 接口：从 JSON 文件生成 PDF base64
    function handleReadBase64File(base64OutputPath, resolve, reject) {
        fs.readFile(base64OutputPath, 'utf-8', (err, data) => {
            if (err) {
                console.error('❌ 无法读取 base64 输出文件:', err);
                return reject(new Error('读取失败'));
            }
            resolve(data);  // base64 字符串
        });
    }
    function handleExecFileCallback(base64OutputPath, resolve, reject) {
        return (error, stdout, stderr) => {
            if (error) {
                console.error('❌ 执行出错:', error);
                return reject(new Error('生成失败'));
            }
            handleReadBase64File(base64OutputPath, resolve, reject);
        };
    }
    ipcMain.handle('generate-preview-pdf', async (event, jsonPath) => {
        return new Promise((resolve, reject) => {
            const exePath = path.resolve('./python', 'matplotlibphoto.exe');
            const base64OutputPath = path.resolve('../data/transformer', 'base64.txt');
            const args = [jsonPath, 'preview', base64OutputPath];
            execFile(exePath, args, handleExecFileCallback(base64OutputPath, resolve, reject));
        });
    });

}