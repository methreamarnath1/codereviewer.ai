import { Command } from 'commander';
import chalk from 'chalk';
import { homePage } from './ui/home.js'; // Note the .js extension for ESM
import { ConfigWizard } from './config/wizard.js';
import { ConfigManager } from './config/manager.js';
import { ReviewEngine } from './core/reviewer.js';
import { FileWatcher } from './core/watcher.js';
import { ChatInterface } from './ui/chat.js';
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

// --- 3. Code Review ---
program
  .command('review [file]')
  .description('Review staged changes or a specific file')
  .option('-s, --staged', 'Review only files in git staging area', true)
  .action(async (file, options) => {
    if (!configManager.isConfigured()) {
      console.log(chalk.red('\n❌ Not configured! Run: ') + chalk.white('awd init'));
      return;
    }
    const reviewer = new ReviewEngine(configManager);
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

program.parse(process.argv);