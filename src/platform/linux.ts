import { exec } from 'child_process';
import { type Display } from "./type";

export function getDisplays(): Promise<Display[]> {
    return new Promise((resolve, reject) => {
        exec('xrandr --query', (error, stdout, stderr) => {
            if (error) reject(error);
            const lines = stdout.split('\n');
            const displays = lines
                .filter(line => line.includes(' connected'))
                .map((line, index) => {
                    const name = line.split(' ')[0];
                    const resolution = line.match(/(\d+x\d+)/)?.[1] || 'Unknown resolution';
                    return {
                        index: index + 1,
                        name: name || `Display ${index + 1}`,
                        resolution
                    };
                });
            resolve(displays);
        });
    });
}

export function takeScreenshotAndOpen(type: string, displayIndex: number | undefined, savePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let command: string;
        if (type === 'full') {
            command = `import -window root "${savePath}" && xdg-open "${savePath}"`;
        } else if (type === 'window') {
            command = `import -window $(xdotool getactivewindow) "${savePath}" && xdg-open "${savePath}"`;
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
