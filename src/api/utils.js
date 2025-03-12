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