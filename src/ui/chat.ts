import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/manager.js';
import { AIProvider } from '../ai/provider.js';
import { ContextManager } from '../core/context.js';
// Note: We import ChatMessage as a type if your TS version requires it
import type { ChatMessage } from '../core/context.js';

export class ChatInterface {
    private configManager: ConfigManager;
    private aiProvider: AIProvider;
    private contextManager: ContextManager;
    private conversationHistory: ChatMessage[] = [];

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
        this.aiProvider = new AIProvider(configManager);
        this.contextManager = new ContextManager();
    }

    async start(): Promise<void> {
        console.clear();
        console.log(chalk.cyan.bold('╔════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║') + chalk.bold.white('       💬 codereviewer.ai Chat Mode        ') + chalk.cyan.bold('║'));
        console.log(chalk.cyan.bold('╚════════════════════════════════════════════╝\n'));
        
        console.log(chalk.gray('Type your questions about the code or reviews.'));
        console.log(chalk.gray('Commands: "exit" to quit, "clear" to reset history.\n'));

        // Load existing history
        this.conversationHistory = await this.contextManager.getChatHistory();
        
        if (this.conversationHistory.length > 0) {
            console.log(chalk.yellow(`📖 Loaded ${this.conversationHistory.length} previous messages.\n`));
            this.displayLastExchange();
        }

        await this.chatLoop();
    }

    private async chatLoop(): Promise<void> {
        while (true) {
            // Fix: Inquirer v9+ requires this specific handling for async loops
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'userInput',
                    message: chalk.green('You:'),
                    validate: (input: string) => input.trim().length > 0 || 'Please enter a message.'
                }
            ]);

            const userInput = answers.userInput;
            const command = userInput.trim().toLowerCase();

            if (command === 'exit' || command === 'quit') {
                await this.contextManager.saveChatHistory(this.conversationHistory);
                console.log(chalk.yellow('\n👋 Chat session saved. Goodbye!'));
                break;
            }

            if (command === 'clear') {
                this.conversationHistory = [];
                await this.contextManager.saveChatHistory([]);
                console.log(chalk.red('🗑️  Chat history cleared.\n'));
                continue;
            }

            await this.handleResponse(userInput);
        }
    }

    private async handleResponse(message: string): Promise<void> {
        const spinner = ora('AI is thinking...').start();

        try {
            this.conversationHistory.push({ role: 'user', content: message });

            // Ensure your AIProvider.ts actually has the .chat() method!
            const response = await this.aiProvider.chat(message, this.conversationHistory);

            spinner.stop();

            console.log(`\n${chalk.cyan.bold('AI:')} ${chalk.white(response)}\n`);

            this.conversationHistory.push({ role: 'assistant', content: response });

            // Keep context window manageable (e.g., last 20 messages)
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }

            await this.contextManager.saveChatHistory(this.conversationHistory);

        } catch (error: any) {
            spinner.fail(chalk.red('Error: ' + (error.message || 'Unknown AI error')));
        }
    }

    private displayLastExchange(): void {
        const lastTwo = this.conversationHistory.slice(-2);
        lastTwo.forEach(msg => {
            const label = msg.role === 'user' ? chalk.green('You:') : chalk.cyan.bold('AI:');
            // Clean display of previous chat content
            const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
            console.log(`${label} ${chalk.gray(preview)}`);
        });
        console.log(chalk.gray('————————————————————————————————─────────────\n'));
    }
}