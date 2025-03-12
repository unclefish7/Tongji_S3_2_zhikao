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

    ipcMain.handle('readPaperFile', async (event, filename) => {
        return readPaperFile(filename);
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
                return await saveCurriculumData(existingData);
            } else {
                return { success: false, message: 'the given id not found' };
            }
        } catch (error) {
            console.error('Error delete paper:', error);
            return { success: false, message: 'Failed to delete paper' };
        }
    })
}