const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

import { readUserFile, writeUserFile, findUserInfo } from './_utils';


export function handleUserAPI(ipcMain) {
    ipcMain.handle('register-user', async (event, username, password, data) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 1000;
        const keylen = 64;
        const digest = 'sha512';
        crypto.pbkdf2(password, salt, iterations, keylen, digest, async (err, derivedKey) => {
            if (err) {
                console.error('Error encrypting password:', err);
                return;
            }
            const hashedPassword = derivedKey.toString('hex');
            const userInfo = {
                username: username,
                data: data,
                salt: salt,
                hashedPassword: hashedPassword,
                papers_distributed: [],
            };
            const users = await readUserFile();
            let userIndex = -1;

            // 查找是否存在相同用户名的用户
            for (let i = 0; i < users.length; i++) {
                if (users[i].username === username) {
                    userIndex = i;
                    break;
                }
            }

            if (userIndex !== -1) {
                // 如果存在相同用户名的用户，更新该用户的信息
                console.log('Same username! User registered failed.');
                return false
            } else {
                // 如果不存在相同用户名的用户，创建新用户
                users.push(userInfo);
                console.log('User registered successfully.');
            }
            await writeUserFile(users);
            return true;
        });
    });

    ipcMain.handle('edit-user', async (event, username, password) => {
        const iterations = 1000;
        const keylen = 64;
        const digest = 'sha512';
        const users = await readUserFile();
        let userIndex = -1;

        // 查找是否存在相同用户名的用户
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                userIndex = i;
                break;
            }
        }

        if (userIndex !== -1) {
            // 如果存在相同用户名的用户，更新该用户的信息
            const user = users[userIndex];
            const salt = crypto.randomBytes(16).toString('hex');
            return new Promise((resolve, reject) => {
                crypto.pbkdf2(password, salt, iterations, keylen, digest, async (err, derivedKey) => {
                    if (err) {
                        console.error('Error encrypting password:', err);
                        reject(err);
                        return;
                    }
                    const hashedPassword = derivedKey.toString('hex');
                    user.username = username;
                    user.salt = salt;
                    user.hashedPassword = hashedPassword;

                    console.log('User edited successfully.');
                    await writeUserFile(users);
                    resolve({ success: true, user: { username: user.username, data: user.data } });
                });
            });
        } else {
            // 如果不存在相同用户名的用户，返回失败
            console.log('No such user! User edit failed.');
            return { success: false, message: 'User not found' };
        }
    });

    

    ipcMain.handle('login-user', async (event, username, password) => {
        const userInfo = await findUserInfo(username);
        if (!userInfo) {
            return { success: false, message: 'Invalid username' };
        }
        const iterations = 1000;
        const keylen = 64;
        const digest = 'sha512';
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, userInfo.salt, iterations, keylen, digest, (err, derivedKey) => {
                if (err) {
                    console.error('Error encrypting password:', err);
                    reject(err);
                    return;
                }
                const hashedPassword = derivedKey.toString('hex');
                if (userInfo.hashedPassword === hashedPassword) {
                    
                    resolve({ success: true, message: 'Login successful', user: { username: userInfo.username, userdata: userInfo.data} });
                } else {
                    resolve({ success: false, message: 'Invalid username or password' });
                }
            });
        });
    });

    ipcMain.handle('get-user-info', async (event) => {   
        const users = await readUserFile();
        const newData = users.map(({ salt, hashedPassword, ...rest }) => rest);
        return newData
    });

    
      
}