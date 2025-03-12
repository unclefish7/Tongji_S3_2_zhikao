import { handleCurriculumAPI } from "./curriculum.js";
import { handlePaperAPI } from "./paper.js";
import { handleUserAPI } from "./user.js";

export function handleAPI(ipcMain) {
    handleUserAPI(ipcMain);
    handleCurriculumAPI(ipcMain);
    handlePaperAPI(ipcMain);
}
