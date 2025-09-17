var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { readdir } from "fs/promises";
export const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
};
export const createLogger = (console = global.console) => ({
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args)
});
export const withErrorHandling = (fn, logger, process = global.process) => (...args) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield fn(...args);
    }
    catch (error) {
        logger.error(`Error: ${getErrorMessage(error)}`);
        process.exit(1);
    }
});
export function createFileOperations(fileEncoding = "utf8", fs = { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdir }) {
    return {
        readJSON(path) {
            return JSON.parse(fs.readFileSync(path, fileEncoding));
        },
        readFile(path) {
            return fs.readFileSync(path, fileEncoding);
        },
        writeFile(path, content) {
            fs.writeFileSync(path, content);
        },
        exists(path) {
            return fs.existsSync(path);
        },
        createDir(path) {
            fs.mkdirSync(path, { recursive: true });
        },
        deleteFile(path) {
            fs.unlinkSync(path);
        },
        readDir(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return fs.readdir(path);
            });
        }
    };
}
export function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
