import { handleCurriculumAPI } from "./_curriculum.js";
import { handlePaperAPI } from "./_paper.js";
import { handleUserAPI } from "./_user.js";
import { handleCheckAPI } from "./_check.js";

export function handleAPI(ipcMain) {
    handleUserAPI(ipcMain);
    handleCurriculumAPI(ipcMain);
    handlePaperAPI(ipcMain);
    handleCheckAPI(ipcMain);
}
