import { handleUserAPI } from "./user.js";

export function handleAPI(ipcMain) {
    handleUserAPI(ipcMain);
}
