import { exec } from 'child_process';
import { type Display } from "./type";

export function getDisplays(): Promise<Display[]> {
    return new Promise((resolve, reject) => {
        exec('wmic path Win32_VideoController get Caption,CurrentHorizontalResolution,CurrentVerticalResolution', (error, stdout, stderr) => {
            if (error) reject(error);
            const lines = stdout.trim().split('\n').slice(1);
            const displays = lines.map((line, index) => {
                const [name, width, height] = line.trim().split(/\s+/);
                return {
                    index: index + 1,
                    name: name || `Display ${index + 1}`,
                    resolution: `${width}x${height}`
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
            command = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{PrtSc}'); Start-Sleep -Milliseconds 250; $img = [System.Windows.Forms.Clipboard]::GetImage(); $img.Save('${savePath}'); Start-Process '${savePath}'"`;
        } else if (type === 'window') {
            command = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('%{PrtSc}'); Start-Sleep -Milliseconds 250; $img = [System.Windows.Forms.Clipboard]::GetImage(); $img.Save('${savePath}'); Start-Process '${savePath}'"`;
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