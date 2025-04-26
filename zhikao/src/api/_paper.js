const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

import { readPaperFile, saveRichTextData, readExamFile, saveExamData, readUserFile, writeUserFile } from './_utils'; // Consolidated imports

export function handlePaperAPI(ipcMain) {

    ipcMain.handle('addQuestion', async (event, filename, newQuestionData,userName) => {
        try {
            let existingData = await readPaperFile(filename);
            // 生成新的 id
            let newId = 1;
            if (existingData.length > 0) {
                newId = existingData[existingData.length - 1].id + 1;
            }
            newQuestionData.id = newId;
            existingData.push(newQuestionData);
            if (userName) {
                const newFileName = filename.replace('.json', `_${userName}.json`);
                await saveRichTextData(newFileName, existingData);
            }
            return await saveRichTextData(filename, existingData);
        } catch (error) {
            console.error('Error adding question:', error);
            return { success: false, message: 'Failed to add question' };
        }
    });

    ipcMain.handle('editQuestion', async (event, filename, id, updatedData,userName) => {
        try {
            console.log(filename)
            let existingData = await readPaperFile(filename);
            const index = existingData.findIndex(item => item.id == id);
            console.log(index)
            if (index!== -1) {
                existingData[index] = {...existingData[index],...updatedData };
                if (userName) {
                    const newFileName = filename.replace('.json', `_${userName}.json`);
                    await saveRichTextData(newFileName, existingData);
                }
                return await saveRichTextData(filename, existingData);
            } else {
                return { success: false, message: 'Question with the given id not found' };
            }
        } catch (error) {
            console.error('Error editing question:', error);
            return { success: false, message: 'Failed to edit question' };
        }
    });

    ipcMain.handle('deleteQuestion', async (event, filename, questionId,userName) => {
        try {
            let existingData = await readPaperFile(filename);
            const index = existingData.findIndex(item => item.id == questionId);
            if (index!== -1) {
                //删除id对应题目
                existingData.splice(index, 1);
                if (userName) {
                    const newFileName = filename.replace('.json', `_${userName}.json`);
                    await saveRichTextData(newFileName, existingData);
                }
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

    ipcMain.handle('paper:importPaperFile', async (event, filePath, userName) => {
        try {
            const rawContent = await fs.readFile(filePath, 'utf8');
            let parsedContent;
            try {
                parsedContent = JSON.parse(rawContent);
            } catch (err) {
                console.error('导入失败，文件内容不是合法的 JSON: ', err);
                return { success: false, message: '导入失败：文件内容不是合法的 JSON。' };
            }
    
            // 检查 info 和 paperId
            if (!parsedContent.info || !parsedContent.info.paperId) {
                return { success: false, message: '导入失败：缺少必要的 info.paperId 字段。' };
            }
    
            const { paperId, name, score, department, duration } = parsedContent.info;
    
            // ✅ 检查 paperId 的后缀是否包含 userName
            if (!paperId.includes(userName)) {
                return { success: false, message: '导入失败：paperId 不包含用户名。' };
            }
    
            // 检查 questions 是不是数组
            if (!Array.isArray(parsedContent.questions)) {
                return { success: false, message: '导入失败：questions 字段不存在或格式错误。' };
            }
    
            // 读取 totalExam.json，检查是否已有同样 paperId
            const totalExamPath = path.join(process.cwd(), '../data/exam/totalExam.json');
            let totalExamData;
            try {
                totalExamData = await readExamFile();
            } catch (e) {
                console.error('totalExam.json 不存在，认为是空列表:', e);
                totalExamData = [];
            }
    
            const exists = totalExamData.some(entry => entry.paperId === paperId);
            if (exists) {
                return { success: false, message: '导入失败：该 paperId 已存在。' };
            }
    
            // ✅ 以 paperId 命名保存文件！
            const destFileName = `${paperId}.json`;
            const destPath = path.join(process.cwd(), '../data/paper', destFileName);
            await fs.writeFile(destPath, JSON.stringify(parsedContent.questions, null, 2), 'utf8');
    
            // 更新 totalExam.json，增加一条记录
            totalExamData.push({
                paperId: paperId,
                name: name || '未命名试卷',
                score: score || '未知分数',
                department: department || '未知部门',
                duration: duration || '未知时长'
            });
            await fs.writeFile(totalExamPath, JSON.stringify(totalExamData, null, 2), 'utf8');
    
            return { success: true, message: '导入成功！' };
        } catch (error) {
            console.error('Error importing paper:', error);
            return { success: false, message: '导入失败：内部错误。' };
        }
    });
    
    
    
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
              const filepath = '../data/paper/' + data.paperId +'.json';
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
                const paperFilePath = '../data/paper/' + paperId.toString() + '.json'
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

    ipcMain.handle('updatePaperPermissions', async (event, paperId, userList) => {
        try {
            // 使用 readUserFile 函数读取用户数据文件
            const usersData = await readUserFile();

            // 遍历用户数据，更新权限
            usersData.forEach(user => {
                if (userList.includes(user.username)) {
                    // 如果用户在列表中，确保试卷ID在其权限列表中
                    if (!user.papers_distributed.includes(paperId)) {
                        user.papers_distributed.push(paperId);
                    }
                } else {
                    // 如果用户不在列表中，移除试卷ID
                    user.papers_distributed = user.papers_distributed.filter(id => id !== paperId);
                }
            });

            // 使用 writeUserFile 函数保存更新后的用户数据
            await writeUserFile(usersData);
            return { success: true, message: 'Permissions updated successfully' };
        } catch (error) {
            console.error('Error updating paper permissions:', error);
            return { success: false, message: 'Failed to update permissions' };
        }
    });

    ipcMain.handle('paper:listAllPaperFiles', async () => {
        try {
            const folderPath = path.join(process.cwd(), '../data/paper');
            const files = await fs.readdir(folderPath);
            return files;
        } catch (error) {
            console.error('Error reading paper file list:', error);
            return [];
        }
    });

    ipcMain.handle('paper:writePaperFile', async (event, filename, data) => {
        try {
            const fullPath = path.join(process.cwd(), '../data/paper', filename);
            await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
            return { success: true };
        } catch (error) {
            console.error('Error writing paper file:', error);
            return { success: false, message: 'Failed to write file' };
        }
    });    

    ipcMain.handle('paper:listAdminPaperFiles', async () => {
        const folderPath = path.join(process.cwd(), '../data/paper');
        await fs.mkdir(folderPath, { recursive: true });
        return fs.readdir(folderPath);
    });      

    ipcMain.handle('paper:writeAdminPaperFile', async (event, filename, data) => {
        const folderPath = path.join(process.cwd(), '../data/paper');
        await fs.mkdir(folderPath, { recursive: true });
      
        const fullPath = path.join(folderPath, filename);
        await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    });

    ipcMain.handle('paper:readTotalExamMeta', async () => {
        const filePath = path.join(process.cwd(), '../data/exam/totalExam.json');
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    });
    
    ipcMain.handle('paper:addMergedPaperMeta', async (event, metaEntry) => {
        const filePath = path.join(process.cwd(), '../data/exam/totalExam.json');
        let existing = [];
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            existing = JSON.parse(raw);
        } catch (e) {
            console.error('文件不存在或内容出错:', e);
            existing = []; // 文件不存在或内容出错时初始化为空
        }
        existing.push(metaEntry);
        await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
        return { success: true };
    });
      
}