import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
// FIX: Named import for simpleGit is required in ESM/TS
import { simpleGit, SimpleGit } from 'simple-git'; 
import { ConfigManager } from '../config/manager.js';
import { AIProvider } from '../ai/provider.js';
import { ContextManager } from './context.js';

export class ReviewEngine {
    private configManager: ConfigManager;
    private aiProvider: AIProvider;
    private contextManager: ContextManager;
    private git: SimpleGit;

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
        this.aiProvider = new AIProvider(configManager);
        this.contextManager = new ContextManager();
        // FIX: Standard initialization call
        this.git = simpleGit(); 
    }

    /**
     * Reviews a specific file by reading its current content
     */
    async reviewFile(filePath: string): Promise<void> {
        const spinner = ora(`Reading ${path.basename(filePath)}...`).start();

        try {
            const fullPath = path.resolve(process.cwd(), filePath);
            if (!fs.existsSync(fullPath)) {
                spinner.fail(chalk.red(`File not found: ${filePath}`));
                return;
            }

            const code = fs.readFileSync(fullPath, 'utf-8');
            
            // Optimization: Get the actual changes to reduce AI token usage
            const diff = await this.git.diff([filePath]); 

            spinner.text = 'AI is analyzing your changes...';
            
            const context = await this.contextManager.getContext(filePath);
            
            // Logic: If there is a diff, review the diff. Otherwise, review the whole file.
            const review = await this.aiProvider.reviewCode(diff || code, filePath, context);
            
            spinner.succeed(chalk.green('Review complete!'));
            this.displayReview(filePath, review);

            await this.contextManager.addToContext(filePath, code, review);

        } catch (error: any) {
            spinner.fail(chalk.red('Review failed: ' + error.message));
        }
    }

    /**
     * Reviews only files that are currently in the Git Staging Area
     */
    async reviewStaged(): Promise<void> {
        const spinner = ora('Checking staged files...').start();

        try {
            const status = await this.git.status();
            const stagedFiles = status.staged;

            if (stagedFiles.length === 0) {
                spinner.info(chalk.yellow('No staged files found. Use "git add" first.'));
                return;
            }

            spinner.succeed(chalk.green(`Found ${stagedFiles.length} staged file(s)`));

            for (const file of stagedFiles) {
                console.log(chalk.cyan(`\n📄 File: ${file}`));
                // Ensure file is a string before passing
                await this.reviewFile(file as string); 
            }
        } catch (error: any) {
            spinner.fail(chalk.red('Git Error: ' + error.message));
        }
    }

    private displayReview(filePath: string, review: any): void {
        // Safe check for the score to avoid crashes if the AI returns a string
        const score = parseInt(review.score) || 0;
        const scoreColor = score >= 8 ? chalk.green : score >= 5 ? chalk.yellow : chalk.red;
        
        let content = `${chalk.bold('Summary:')} ${review.summary}\n`;
        content += `${chalk.bold('Score:')} ${scoreColor(score + '/10')}\n\n`;

        if (review.issues && review.issues.length > 0) {
            content += `${chalk.red.bold('🚀 Issues Found:')}\n`;
            review.issues.forEach((issue: any) => {
                content += `${chalk.yellow('•')} [Line ${issue.line || '?'}] ${issue.msg}\n`;
                if (issue.fix) content += `   ${chalk.gray('Suggested Fix:')} ${chalk.italic(issue.fix)}\n`;
            });
        } else {
            content += chalk.green('✅ No critical issues found. Great job!\n');
        }

        if (review.optimizations && Array.isArray(review.optimizations)) {
            content += `\n${chalk.blue.bold('⚡ Optimizations:')}\n`;
            review.optimizations.forEach((opt: string) => {
                content += `${chalk.blue('→')} ${opt}\n`;
            });
        }

        console.log(boxen(content, {
            title: filePath,
            titleAlignment: 'center',
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        }));
    }

    async clearHistory(): Promise<void> {
        await this.contextManager.clearHistory();
        console.log(chalk.green('✅ Local history cleared.'));
    }
}