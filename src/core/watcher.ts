import { watch, FSWatcher } from 'chokidar'; // Fixed import
import chalk from 'chalk';
import path from 'path';
import { ConfigManager } from '../config/manager.js';
import { ReviewEngine } from './reviewer.js';

export class FileWatcher {
    // Fixed: Using the explicitly imported FSWatcher type
    private watcher: FSWatcher | null = null;
    private reviewer: ReviewEngine;
    private configManager: ConfigManager;

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
        this.reviewer = new ReviewEngine(configManager);
    }

    /**
     * Starts the background process to watch for file changes
     */
    async start(): Promise<void> {
        // Clear terminal for a clean "Watch Mode" UI
        console.clear();
        console.log(chalk.bold.green('👀 codereviewer.ai is now watching your code...'));
        console.log(chalk.gray('Press Ctrl+C to stop the watcher.\n'));

        // Fixed: Use the watch() function directly
        this.watcher = watch(process.cwd(), {
            ignored: [
                /(^|[\/\\])\../, // ignore dotfiles (.git, .awesomediagns)
                '**/node_modules/**',
                '**/dist/**',
                '**/package-lock.json'
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100
            }
        });

        // Event listener for saved changes
        this.watcher.on('change', async (filePath: string) => {
            const fileName = path.basename(filePath);
            const ext = path.extname(filePath);

            const supportedExtensions = ['.ts', '.js', '.py', '.go', '.cpp', '.java', '.tsx', '.jsx'];
            
            if (supportedExtensions.includes(ext)) {
                console.log(chalk.cyan(`\n💾 Change detected in: ${fileName}`));
                
                // Trigger the review engine
                try {
                    await this.reviewer.reviewFile(filePath);
                } catch (error) {
                    console.error(chalk.red('Review failed during auto-watch.'));
                }
                
                console.log(chalk.gray('\nWaiting for next change...'));
            }
        });

        this.watcher.on('error', (error: unknown) => {
            console.error(chalk.red(`Watcher error: ${(error as Error).message}`));
        });

        // Handle process termination to clean up the watcher
        process.on('SIGINT', () => {
            this.stop();
            // Give the close() promise a moment to resolve before exiting
            setTimeout(() => process.exit(0), 100);
        });
    }

    /**
     * Stops the watcher safely
     */
    stop(): void {
        if (this.watcher) {
            this.watcher.close().then(() => {
                console.log(chalk.yellow('\n🛑 Watcher stopped. Goodbye!'));
            });
        }
    }
}