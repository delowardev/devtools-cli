import { exec } from 'child_process';
import { Display } from './type';

export function getDisplays(): Promise<Display[]> {
    return new Promise((resolve, reject) => {
        exec('system_profiler SPDisplaysDataType -json', (error, stdout, stderr) => {
            if (error) reject(error);
            try {
                const data = JSON.parse(stdout);
                const displays = data.SPDisplaysDataType[0].spdisplays_ndrvs
                    .filter((display: any) => display['spdisplays_mirror'] === "spdisplays_off")
                    .map((display: any, index: number) => ({
                        index: index + 1,
                        name: display['_name'] || `Display ${index + 1}`,
                        resolution: display['_spdisplays_pixels'] || 'Unknown resolution'
                    }));
                resolve(displays);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

export function takeScreenshotAndOpen(type: string, displayIndex: number | undefined, savePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let command: string;
        if (type === 'full') {
            command = `screencapture -D ${displayIndex} "${savePath}" && open "${savePath}"`;
        } else if (type === 'window') {
            command = `screencapture -w "${savePath}" && open "${savePath}"`;
        } else {
            reject(new Error('Invalid screenshot type'));
            return;
        }

        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve(savePath);
        });
    });
}