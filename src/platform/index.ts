import * as macos from './mac';
import * as windows from './windows';
import * as linux from './linux';
import { type Display } from "./type";

console.log( process.platform, "<<<<<" )

export function getDisplays(): Promise<Display[]> {
    switch (process.platform) {
        case 'darwin':
            return macos.getDisplays();
        case 'win32':
            return windows.getDisplays();
        case 'linux':
            return linux.getDisplays();
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

export function takeScreenshotAndOpen(type: string, displayIndex: number | undefined, savePath: string): Promise<string> {
    switch (process.platform) {
        case 'darwin':
            return macos.takeScreenshotAndOpen(type, displayIndex, savePath);
        case 'win32':
            return windows.takeScreenshotAndOpen(type, displayIndex, savePath);
        case 'linux':
            return linux.takeScreenshotAndOpen(type, displayIndex, savePath);
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}