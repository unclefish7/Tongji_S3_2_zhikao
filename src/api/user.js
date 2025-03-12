const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const { contextBridge, ipcRenderer } = require('electron')

import { readUserFile, writeUserFile } from './utils';

export function handleUserAPI(ipcMain) {
     /**
     * 
     * @param {*} username 
     * @param {*} password 
     * 注册用户信息，加密后进行存储
     */
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
                hashedPassword: hashedPassword
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

    /**
     *  
     * @param {*} username
     * @param {*} password
     * 登录验证，验证用户名和密码是否匹配
     * 
     * 返回值：
     * 0：用户名不存在
     * 1：密码错误
     * 2：登录成功
     */
    ipcMain.handle('edit-user', async (event, username, password, data) => {
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
                hashedPassword: hashedPassword
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
                users[userIndex] = userInfo;
                console.log('User edited successfully.');
            } else {
                // 如果不存在相同用户名的用户，创建新用户
                console.log('No such user! User edit failed.');
                return false;
            }
            await writeUserFile(users);
            return true;
        });
    });
}