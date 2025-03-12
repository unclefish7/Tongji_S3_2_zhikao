const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { contextBridge, ipcRenderer } = require('electron')

export async function readUserFile() {
    try {
        const data = await fs.readFile('./src/data/user/user.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading user file:', err);
        return [];
    }
  }

export async function writeUserFile(users) {
    try {
        await fs.writeFile('./src/data/user/user.json', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error writing user file:', err);
    }
  }

export async function readTotalCurriculumFile() {
    const filePath = './src/data/exam/totalCurriculum.json';
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
        const filePath = './src/data/curriculum/totalCurriculum.json';
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data saved successfully to', filePath);
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

export async function readExamFile() {
    const filePath = './src/data/exam/totalExam.json';
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
export async function saveExamData(data) {
    try {
        const filePath = './src/data/exam/totalExam.json';
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data saved successfully to', filePath);
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}

export async function readPaperFile(filename) {
    const filePath = './src/data/paper/' + filename;
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
      const filePath = './src/data/paper/' + filename;
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data saved successfully to', filePath);
        return { success: true, message: 'Data saved successfully' };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, message: 'Failed to save data' };
    }
}