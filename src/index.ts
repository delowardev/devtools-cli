import { cac } from 'cac';
import prompts from 'prompts';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getDisplays, takeScreenshotAndOpen } from './platform';

const cli = cac('screenshot');

// Get home directory
const homeDir = process.env.HOME || os.homedir();

// Path for caching custom paths (in temporary directory)
const cachePath = path.join(os.tmpdir(), '.screenshot-cli-cache.json');

// Function to read cached paths
function readCachedPaths(): string[] {
  try {
    if (fs.existsSync(cachePath)) {
      const cachedPaths = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as string[];
      return cachedPaths.filter(p => fs.existsSync(path.dirname(p)));
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return [];
}

// Function to write cached paths
function writeCachedPaths(paths: string[]): void {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(paths));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

// Function to validate custom path
function validatePath(input: string): string | boolean {
  if (!input) return 'Path cannot be empty';
  if (!path.isAbsolute(input)) return 'Please provide an absolute path';
  const dir = path.dirname(input);
  if (!fs.existsSync(dir)) return 'Directory does not exist';
  return true;
}

// Function to get common paths
function getCommonPaths(): { title: string; value: string }[] {
  const desktopPath = path.join(homeDir, 'Desktop');
  const documentsPath = path.join(homeDir, 'Documents');
  const downloadsPath = path.join(homeDir, 'Downloads');
  const picturesPath = path.join(homeDir, 'Pictures');

  return [
    { title: chalk.blue(`Desktop (${desktopPath})`), value: desktopPath },
    { title: chalk.green(`Documents (${documentsPath})`), value: documentsPath },
    { title: chalk.yellow(`Downloads (${downloadsPath})`), value: downloadsPath },
    { title: chalk.cyan(`Pictures (${picturesPath})`), value: picturesPath },
    { title: chalk.magenta('Custom path'), value: 'custom' }
  ];
}

// Define CLI command and options
cli
    .command('[output]', 'Take a screenshot')
    .option('--type <type>', 'Screenshot type: "full" or "window"')
    .option('--display <number>', 'Display number for full screen screenshot')
    .action(async (output: string | undefined, options: { type?: string; display?: string }) => {
      try {
        // Prompt user for save path
        const commonPaths = getCommonPaths();
        const commonPathValues = commonPaths.map(p => p.value);
        const cachedPaths = readCachedPaths().filter(p => !commonPathValues.includes(p));

        const pathChoices = [
          ...commonPaths,
          ...cachedPaths.map(p => ({ title: chalk.cyan(`Recent: ${p}`), value: p }))
        ];

        const { selectedPath } = await prompts({
          type: 'select',
          name: 'selectedPath',
          message: 'Choose save location',
          choices: pathChoices
        });

        let savePath: string;
        if (selectedPath === 'custom') {
          const examplePath = path.join(homeDir, 'Pictures', 'Screenshots');
          const { customPath } = await prompts({
            type: 'text',
            name: 'customPath',
            message: `Enter custom save path (e.g., ${chalk.italic(examplePath)}):`,
            validate: validatePath
          });
          savePath = customPath;

          // Update cached paths if not in common paths
          if (!commonPathValues.includes(customPath)) {
            const updatedCache = [customPath, ...cachedPaths.filter(p => p !== customPath)].slice(0, 3);
            writeCachedPaths(updatedCache);
          }
        } else {
          savePath = selectedPath;
        }

        // Ensure the directory exists
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        let type = options.type || '';
        let displayIndex = options.display ? parseInt(options.display) : undefined;

        // Prompt user for screenshot type if not provided
        if (!type) {
          const response = await prompts({
            type: 'select',
            name: 'type',
            message: 'Choose screenshot type',
            choices: [
              { title: chalk.blue('Full Screen'), value: 'full' },
              { title: chalk.green('App Window'), value: 'window' }
            ]
          });
          type = response.type;
        }

        // Prompt user for display if type is full and displayIndex is not provided
        if (type === 'full' && !displayIndex) {
          const displays = await getDisplays();
          const choices = displays.map(display => ({
            title: chalk.yellow(`${display.name} (${display.resolution})`),
            value: display.index
          }));

          const response = await prompts({
            type: 'select',
            name: 'display',
            message: 'Choose a display',
            choices: choices
          });
          displayIndex = response.display;
        }

        console.log(chalk.cyan('Taking screenshot...'));
        const screenshotPath = await takeScreenshotAndOpen(type, displayIndex, path.join(savePath, `screenshot-${Date.now()}.png`));
        console.log(chalk.green(`Screenshot saved to ${chalk.bold(screenshotPath)} and opened`));

      } catch (error) {
        console.error(chalk.red('Error:'), error);
      }
    });

// Display help and version information
cli.help();
cli.version('1.0.0');

cli.parse();
