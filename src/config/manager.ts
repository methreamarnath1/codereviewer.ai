import Conf from 'conf';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// 1. Defined a strict schema for the config to prevent type errors
export interface AppConfig {
    provider: 'openai' | 'gemini' | 'claude';
    apiKey: string;
    model: string;
    reviewDepth: 'quick' | 'deep';
    mode: 'manual' | 'auto';
    includeContext: boolean;
    maxContextMessages: number;
    projectPath?: string;
}

export class ConfigManager {
    // We cast the Conf instance to allow better flexibility with the 'conf' library versions
    private config: Conf<AppConfig>;

    constructor() {
        this.config = new Conf<AppConfig>({
            projectName: 'codereviewerai',
            // Default settings if the user hasn't run 'init'
            defaults: {
                provider: 'gemini',
                apiKey: '',
                model: 'gemini-2.5-flash-lite',
                reviewDepth: 'deep',
                mode: 'manual',
                includeContext: true,
                maxContextMessages: 10
            }
        });
    }

    isConfigured(): boolean {
        const key = this.config.get('apiKey');
        return typeof key === 'string' && key.length > 0;
    }

    // Fixed: Explicitly return AppConfig to ensure UI elements can read keys safely
    getConfig(): AppConfig {
        return this.config.store as AppConfig;
    }

    // Fixed: Standardized update method
    setKey<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
        this.config.set(key, value);
    }

    // Helper for saving multiple answers from Inquirer at once
    setFullConfig(answers: Partial<AppConfig>): void {
        for (const [key, value] of Object.entries(answers)) {
            this.config.set(key as keyof AppConfig, value);
        }
    }

    displayConfig(): void {
        const store = this.getConfig();
        console.log(chalk.cyan.bold('\n🛠️  Current Configuration:'));
        
        console.log(`
  ${chalk.yellow('Provider:')} ${store.provider}
  ${chalk.yellow('Model:')}    ${store.model}
  ${chalk.yellow('Mode:')}     ${store.mode}
  ${chalk.yellow('Depth:')}    ${store.reviewDepth}
  ${chalk.yellow('API Key:')}  ${store.apiKey ? '********' + store.apiKey.slice(-4) : chalk.red('Not Set')}
        `);
    }

    /**
     * LOCAL PROJECT LOGIC
     * This creates the .awesomediagns folder in the CURRENT working directory
     */
    initProject(projectPath: string): void {
        this.setKey('projectPath', projectPath);
        
        const localDir = path.join(projectPath, '.awesomediagns');
        const historyDir = path.join(localDir, 'history');

        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
            fs.mkdirSync(historyDir, { recursive: true });
            
            // Auto-ignore the local metadata from Git
            const gitignore = path.join(projectPath, '.gitignore');
            const ignoreEntry = '\n# AwesomeDiagns metadata\n.awesomediagns/\n';
            
            if (fs.existsSync(gitignore)) {
                const content = fs.readFileSync(gitignore, 'utf8');
                if (!content.includes('.awesomediagns')) {
                    fs.appendFileSync(gitignore, ignoreEntry);
                }
            } else {
                fs.writeFileSync(gitignore, ignoreEntry);
            }
            console.log(chalk.green('✅ Project initialized with local context folder.'));
        }
    }

    // Check if the current folder is an AWD project
    isProjectInitialized(currentPath: string = process.cwd()): boolean {
        return fs.existsSync(path.join(currentPath, '.awesomediagns'));
    }

    // Useful for a fallback to find files if needed
    getProjectConfig() {
        return {
            watchedFiles: ['*.ts', '*.js', '*.jsx', '*.tsx', '*.py', '*.go'],
            ignoredPatterns: ['node_modules', 'dist', '.git']
        };
    }

    clearConfig(): void {
        this.config.clear();
        console.log(chalk.red('🗑️  Global configuration wiped.'));
    }
}