const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

import { saveTotalCurriculumData, readTotalCurriculumFile, readExamFile } from './_utils';

export function handleCurriculumAPI(ipcMain) {

    /*
    * 读取总课程文件，读取总的课程文件，获取到所有课程信息
    *
    */
    ipcMain.handle('readTotalCurriculumFile', async (event) => {
        return readTotalCurriculumFile();
    });

    /*
    * 读取课程文件，读取相应的课程文件，获取到该课程下所有试卷信息
    * (感觉有点问题)
    */
    ipcMain.handle('readExamFile', async (event) => {
        return readExamFile();
    });

    /*
    * 添加课程，主要工作有两个，一个是在课程总文件中，添加该项课程的信息；另一个是在存放课程位置添加新生成的课程文件
    *
    */
    ipcMain.handle('addCurriculum', async (event, newCurriculumData) => {
        try {
            const curriculumId = newCurriculumData.id;
            let existingData = await readTotalCurriculumFile();
            existingData.push(newCurriculumData);
            const result =  await saveTotalCurriculumData(existingData);
            if (result.success){
                //生成文件
                const initContent = '[]';
                const filepath = './src/data/curriculum/c' + curriculumId + '.json';
                fs.writeFile(filepath, initContent, 'utf8');
                return { success: true, message: 'Data saved successfully' };
            }
        } catch (error) {
            console.error('Error adding question:', error);
            return { success: false, message: 'Failed to add question' };
        }
    });
}