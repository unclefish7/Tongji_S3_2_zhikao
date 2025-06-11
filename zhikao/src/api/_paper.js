const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

import { readPaperFile, saveRichTextData, readExamFile, saveExamData, readUserFile, writeUserFile, createPaperDTO, writeEncryptedFile, readEncryptedFile } from './_utils'; // Consolidated imports

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

    ipcMain.handle('paper:importPaperFromDialog', async (event) => {
        try {
            const { dialog } = require('electron');
            
            // 打开文件选择对话框
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                ]
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, message: '用户取消了文件选择' };
            }

            const filePath = result.filePaths[0];
            
            let parsedContent;
            try {
                // 尝试读取加密文件
                parsedContent = await readEncryptedFile(filePath);
            } catch (err) {
                // 如果加密读取失败，尝试明文读取（向后兼容）
                try {
                    const rawContent = await fs.readFile(filePath, 'utf8');
                    parsedContent = JSON.parse(rawContent);
                } catch (fallbackErr) {
                    console.error('导入失败，文件内容无法解析: ', fallbackErr);
                    return { success: false, message: '导入失败：文件内容无法解析，请确认文件格式正确。' };
                }
            }

            // 检查导入文件格式
            if (!parsedContent.info || !parsedContent.info.paperId) {
                return { success: false, message: '导入失败：缺少必要的 info.paperId 字段。' };
            }

            if (!Array.isArray(parsedContent.questions)) {
                return { success: false, message: '导入失败：questions 字段不存在或格式错误。' };
            }

            const { paperId: originalPaperId, name, score, department, duration } = parsedContent.info;

            // 读取现有试卷信息，检查是否有重名
            const totalExamData = await readExamFile();
            
            // 处理重名冲突
            let finalPaperId = originalPaperId;
            let finalName = name;
            let counter = 1;
            
            while (totalExamData.some(entry => entry.paperId === finalPaperId)) {
                finalPaperId = `${originalPaperId}_copy${counter}`;
                finalName = `${name}_副本${counter}`;
                counter++;
            }

            // 保存试卷题目到 paper 文件夹（加密存储）
            await saveRichTextData(`${finalPaperId}.json`, parsedContent.questions);

            // 更新 totalExam.json，增加一条记录（加密存储）
            totalExamData.push({
                paperId: finalPaperId,
                name: finalName || '未命名试卷',
                score: score || '未知分数',
                department: department || '未知部门',
                duration: duration || '未知时长'
            });
            
            await saveExamData(totalExamData);

            const message = finalPaperId !== originalPaperId 
                ? `导入成功！原试卷已存在，新试卷已重命名为：${finalName}`
                : '导入成功！';

            return { success: true, message };
        } catch (error) {
            console.error('Error importing paper:', error);
            return { success: false, message: '导入失败：内部错误。' };
        }
    });

    ipcMain.handle('paper:importPaperFile', async (event, filePath, userName) => {
        try {
            let parsedContent;
            try {
                // 尝试读取加密文件
                parsedContent = await readEncryptedFile(filePath);
            } catch (err) {
                // 如果加密读取失败，尝试明文读取（向后兼容）
                try {
                    const rawContent = await fs.readFile(filePath, 'utf8');
                    parsedContent = JSON.parse(rawContent);
                } catch (fallbackErr) {
                    console.error('导入失败，文件内容无法解析: ', fallbackErr);
                    return { success: false, message: '导入失败：文件内容无法解析。' };
                }
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
    
            // 以加密方式保存试卷题目
            await saveRichTextData(`${paperId}.json`, parsedContent.questions);
    
            // 更新 totalExam.json，增加一条记录（加密存储）
            totalExamData.push({
                paperId: paperId,
                name: name || '未命名试卷',
                score: score || '未知分数',
                department: department || '未知部门',
                duration: duration || '未知时长'
            });
            await saveExamData(totalExamData);
    
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
            data.paperId = newId;
            existingData.push(data);
            const result = await saveExamData(existingData);
            console.log(result)
            if (result.success){
              //生成空的加密文件
              const initContent = [];
              await saveRichTextData(data.paperId + '.json', initContent);
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

    ipcMain.handle('clearPaperFile', async (event, paperId) => {
        try {
            // 将文件内容重置为空数组（加密存储）
            await saveRichTextData(paperId + '.json', []);
            console.log(`Paper file ${paperId} cleared successfully`);
            return { success: true };
        } catch (error) {
            console.error('Error clearing paper file:', error);
            return { success: false, message: 'Failed to clear paper file' };
        }
    });

    ipcMain.handle('updatePaperPermissions', async (event, paperId, userList) => {
        try {
            // 使用 readUserFile 函数读取用户数据文件
            const usersData = await readUserFile();

            // 遍历用户数据，更新权限
            usersData.forEach(user => {
                const paperIdWithUser = `${paperId}_${user.username}`; // 修改为 "paperID_userID" 格式
                if (userList.includes(user.username)) {
                    // 如果用户在列表中，确保试卷ID在其权限列表中
                    if (!user.papers_distributed.includes(paperIdWithUser)) {
                        user.papers_distributed.push(`${paperId}_${user.username}`); // 修改为 "paperID_userID" 格式
                        createPaperDTO(paperId, user.username);
                    }
                } else {
                    // 如果用户不在列表中，移除试卷ID
                    user.papers_distributed = user.papers_distributed.filter(id => id !== paperIdWithUser);
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
        // 使用加密方式保存合并后的试卷
        return await saveRichTextData(filename, data);
    });

    ipcMain.handle('paper:readTotalExamMeta', async () => {
        // 使用加密方式读取试卷元信息
        return await readExamFile();
    });
    
    ipcMain.handle('paper:addMergedPaperMeta', async (event, metaEntry) => {
        try {
            const existing = await readExamFile();
            existing.push(metaEntry);
            await saveExamData(existing);
            return { success: true };
        } catch (e) {
            console.error('添加合并试卷元信息失败:', e);
            return { success: false, message: 'Failed to add merged paper meta' };
        }
    });

    ipcMain.handle('paper:exportPaper', async (event, paperId) => {
        try {
            // 读取试卷题目（从加密文件）
            const questions = await readPaperFile(`${paperId}.json`);
            
            // 读取试卷元信息（从加密文件）
            const examMeta = await readExamFile();
            const paperInfo = examMeta.find(exam => exam.paperId === paperId);
            
            if (!paperInfo) {
                return { success: false, message: '未找到试卷信息' };
            }

            // 构建导出数据结构
            const exportData = {
                info: {
                    paperId: paperInfo.paperId,
                    name: paperInfo.name,
                    score: paperInfo.score,
                    department: paperInfo.department,
                    duration: paperInfo.duration
                },
                questions: questions
            };

            // 生成导出文件名（添加时间戳）
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `${paperInfo.name}_${timestamp}.json`;
            
            // 确保导出目录存在
            const exportDir = path.join(process.cwd(), '../data/export');
            await fs.mkdir(exportDir, { recursive: true });
            
            // 保存文件 - 导出为加密JSON
            const exportPath = path.join(exportDir, exportFileName);
            await writeEncryptedFile(exportPath, exportData);
            
            return { 
                success: true, 
                message: '导出成功',
                filePath: exportPath
            };
        } catch (error) {
            console.error('Error exporting paper:', error);
            return { success: false, message: '导出失败：' + error.message };
        }
    });
      
}