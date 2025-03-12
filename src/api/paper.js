const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

import { readPaperFile, saveRichTextData } from './utils';
import { readExamFile, saveExamData } from './utils';

export function handlePaperAPI(ipcMain) {

    ipcMain.handle('addQuestion', async (event, filename, newQuestionData) => {
        try {
            let existingData = await readPaperFile(filename);
            // 生成新的 id
            let newId = 1;
            if (existingData.length > 0) {
                newId = existingData[existingData.length - 1].id + 1;
            }
            newQuestionData.id = newId;
            existingData.push(newQuestionData);
            return await saveRichTextData(filename, existingData);
        } catch (error) {
            console.error('Error adding question:', error);
            return { success: false, message: 'Failed to add question' };
        }
    });

    ipcMain.handle('editQuestion', async (event, filename, id, updatedData) => {
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
    });

    ipcMain.handle('deleteQuestion', async (event, filename, questionId) => {
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
    });

    ipcMain.handle('readPaperFile', async (event, filename) => {
        return readPaperFile(filename);
    });

    /*
    * 添加试卷，主要工作有两个，一个是在课程文件中，添加该项试卷的信息；另一个是在存放试卷位置添加考卷文件
    *
    */
    ipcMain.handle('addPaper', async (event, data) => {
        try {
            let existingData = await readExamFile();
            // 生成新的 id 以paper + 时间戳来命名
            const newId = `paper${Date.now()}`;
            //console.log(curriculumId)
            //if (existingData.length > 0) {
            //    newId = existingData[existingData.length - 1].id + 1;
            //}
            data.paperId = newId;
            existingData.push(data);
            const result =  await saveExamData(existingData);
            console.log(result)
            if (result.success){
              //生成文件
              const initContent = '[]';
              const filepath = './src/data/paper/' + data.paperId +'.json';
              await fs.writeFile(filepath, initContent, 'utf8');
              return { success: true, message: 'Data saved successfully' };
            }
        } catch (error) {
            console.error('Error adding paper:', error);
            return { success: false, message: 'Failed to add paper' };
        }
    });

    /*
    * 读取总的考试文件，然后修改试卷的信息
    *
    */
    ipcMain.handle('editPaper', async (event, paperId, updatedData) => {
        try {
            let existingData = await readExamFile();
            const index = existingData.findIndex(item => item.paperId == paperId);
            if (index!== -1) {
                existingData[index] = {...existingData[index],...updatedData };
                return await saveExamData(existingData);
            } else {
                return { success: false, message: 'add with the given id not found' };
            }
        } catch (error) {
            console.error('Error editing paper:', error);
            return { success: false, message: 'Failed to edit paper' };
        }
    });

    /*
    * 读取总的考试文件，然后删除某一份试卷的信息
    *
    */
    ipcMain.handle('deletePaper', async (event, paperId) => {
        try {
            let existingData = await readExamFile();
            const index = existingData.findIndex(item => item.paperId == paperId);
            if (index!== -1) {
                //删除某一个试卷
                existingData.splice(index, 1);
                //删除试卷对应的文件 fs.XX
                const paperFilePath = './src/data/paper/' + paperId.toString() + '.json'
                try {
                    await fs.unlink(paperFilePath);
                    console.log('Paper file deleted successfully');
                } catch (fileError) {
                    console.error('Error deleting paper file:', fileError);
                }
                return await saveExamData(existingData);
            } else {
                return { success: false, message: 'the given id not found' };
            }
        } catch (error) {
            console.error('Error delete paper:', error);
            return { success: false, message: 'Failed to delete paper' };
        }
    });

}