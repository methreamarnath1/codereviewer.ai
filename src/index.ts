import { Command } from 'commander';
import chalk from 'chalk';
import { homePage } from './ui/home.js'; // Note the .js extension for ESM
import { ConfigWizard } from './config/wizard.js';
import { ConfigManager } from './config/manager.js';
import { ReviewEngine } from './core/reviewer.js';
import { FileWatcher } from './core/watcher.js';
import { ChatInterface } from './ui/chat.js';
import { AutoPatcher } from './core/patcher.js';
import { AIProvider } from './ai/provider.js';
import { simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

const program = new Command();
const configManager = new ConfigManager();
const configWizard = new ConfigWizard();

program
  .name('awd')
  .description('codereviewer.ai - AI-powered code review for developers')
  .version(packageJson.version)
  .alias('awesomediagns');

// --- 1. Home / Help ---
program
  .command('home')
  .description('Display the AwesomeDiagns home screen')
  .action(async () => {
    await homePage.displayWelcome();
    homePage.displayQuickHelp();
  });

// --- 2. Configuration ---
program
  .command('init')
  .description('Initialize your AI provider and API keys')
  .action(async () => {
    await configWizard.runSetup();
  });

program
  .command('config')
  .description('View or update current configuration')
  .option('-s, --show', 'Show current config')
  .option('-r, --reset', 'Clear all settings')
  .action(async (options) => {
    if (options.show) {
      configManager.displayConfig();
    } else if (options.reset) {
      configManager.clearConfig();
    } else {
      await configWizard.runSetup();
    }
  });

program
  .command('clean-history')
  .alias('clean')
  .description('Delete all review and chat history')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options) => {
    if (!configManager.isConfigured()) {
      console.log(chalk.red('\n❌ Not configured! Run: ') + chalk.white('awd init'));
      return;
    }

    const { default: inquirer } = await import('inquirer');
    if (!options.confirm) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: chalk.yellow('⚠️  Delete all history? This cannot be undone!'),
          default: false
        }
      ]);

      if (!confirmed) {
        console.log(chalk.blue('ℹ️  Cancelled'));
        return;
      }
    }

    try {
      const reviewer = new ReviewEngine(configManager);
      await reviewer.clearHistory();
      console.log(chalk.green('✅ History cleared successfully'));
    } catch (error: any) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// --- History ---
program
  .command('history')
  .description('View review history')
  .option('-l, --limit <number>', 'Limit number of entries', '10')
  .action(async (options) => {
    if (!configManager.isConfigured()) {
      console.log(chalk.red('\n❌ Not configured! Run: ') + chalk.white('awd init'));
      return;
    }

    try {
      const reviewer = new ReviewEngine(configManager);
      const history = await reviewer.getHistory(parseInt(options.limit));

      if (history.length === 0) {
        console.log(chalk.yellow('📭 No review history found.'));
        return;
      }

      console.log(chalk.blue('\n📊 Review History:\n'));

      history.forEach((entry, index) => {
        const date = new Date(entry.timestamp).toLocaleString();
        const score = entry.score ? `Score: ${entry.score}/10` : 'No score';
        console.log(`${index + 1}. ${chalk.green(entry.file)}`);
        console.log(`   ${chalk.gray(date)} | ${chalk.cyan(score)}`);
        console.log(`   ${chalk.white(entry.review?.summary || 'No summary')}\n`);
      });
    } catch (error: any) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// --- 3. Code Review ---
program
  .command('review [file]')
  .description('Review staged changes or a specific file')
  .option('-s, --staged', 'Review only files in git staging area', true)
  .option('--patch', 'Apply automatic fixes')
  .option('--patch-all', 'Patch all files in the project')
  .action(async (file, options) => {
    if (!configManager.isConfigured()) {
      console.log(chalk.red('\n❌ Not configured! Run: ') + chalk.white('awd init'));
      return;
    }

    const reviewer = new ReviewEngine(configManager);
    const patcher = new AutoPatcher();
    const aiProvider = new AIProvider(configManager);

    const shouldPatch = options.patch || options.patchAll;
    const usePatchAll = options.patchAll;

    if (shouldPatch) {
      let filesToPatch: string[] = [];

      if (usePatchAll) {
        filesToPatch = await gatherProjectFiles(process.cwd());
      } else if (file) {
        filesToPatch = [file];
      } else if (options.staged) {
        const git = simpleGit();
        const status = await git.status();
        filesToPatch = status.staged;
      }

      if (filesToPatch.length === 0) {
        console.log(chalk.yellow('No files found to patch. Provide a file or stage changes.'));
        return;
      }

      for (const targetFile of filesToPatch) {
        await patcher.reviewAndPatch(targetFile, aiProvider);
      }
      return;
    }

    if (file) {
      await reviewer.reviewFile(file);
    } else {
      await reviewer.reviewStaged();
    }
  });

// --- 4. Auto-Mode (Watcher) ---
program
  .command('watch')
  .description('Start real-time auto-review mode (on save)')
  .action(async () => {
    if (!configManager.isConfigured()) return;
    const watcher = new FileWatcher(configManager);
    await watcher.start();
  });

// --- 5. Interactive Chat ---
program
  .command('chat')
  .description('Start a conversation with the AI about your code')
  .action(async () => {
    const chat = new ChatInterface(configManager);
    await chat.start();
  });

// --- Default Action ---
// If the user just types 'awd', show the home page
program.action(async () => {
  await homePage.displayWelcome();
  homePage.displayQuickHelp();
});

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('\nInvalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

async function gatherProjectFiles(basePath: string): Promise<string[]> {
  const files: string[] = [];
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java', '.cs', '.cpp', '.c', '.php', '.rs', '.json', '.html', '.css'];
  const ignored = ['node_modules', 'dist', '.git', '.awesomediagns'];

  async function walk(directory: string) {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (ignored.includes(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  await walk(basePath);
  return files;
}

program.parse(process.argv);