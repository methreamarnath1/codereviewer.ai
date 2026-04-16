import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface ReviewEntry {
    file: string;
    timestamp: string;
    code: string;
    review: any;
    score: number;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class ContextManager {
    private contextDir: string;
    private historyFile: string;
    private chatFile: string;

    constructor() {
        // This looks for the local project folder created by ConfigManager
        this.contextDir = path.join(process.cwd(), '.awesomediagns');
        this.historyFile = path.join(this.contextDir, 'history', 'reviews.json');
        this.chatFile = path.join(this.contextDir, 'history', 'chat.json');
        this.ensureDirectories();
    }

    /**
     * Ensures the local .awesomediagns folder exists before writing
     */
    private ensureDirectories(): void {
        const historyDir = path.join(this.contextDir, 'history');
        
        if (!fs.existsSync(historyDir)) {
            try {
                fs.mkdirSync(historyDir, { recursive: true });
            } catch (err) {
                // If not in a project, we don't crash, but we can't save context
                return;
            }
        }

        if (!fs.existsSync(this.historyFile)) {
            fs.writeFileSync(this.historyFile, JSON.stringify([], null, 2));
        }
        if (!fs.existsSync(this.chatFile)) {
            fs.writeFileSync(this.chatFile, JSON.stringify([], null, 2));
        }
    }

    /**
     * Gets previous review data for a specific file to give AI "memory"
     */
    async getContext(filePath: string): Promise<any> {
        try {
            const history = this.loadHistory();
            const fileHistory = history
                .filter((entry: ReviewEntry) => entry.file === filePath)
                .slice(-3); // Last 3 reviews for this specific file

            return {
                previousReviews: fileHistory.map((entry: ReviewEntry) => ({
                    timestamp: entry.timestamp,
                    score: entry.score,
                    summary: entry.review.summary
                }))
            };
        } catch (error) {
            return { previousReviews: [] };
        }
    }

    /**
     * Saves a new review into the local project history
     */
    async addToContext(filePath: string, code: string, review: any): Promise<void> {
        try {
            const history = this.loadHistory();
            const entry: ReviewEntry = {
                file: filePath,
                timestamp: new Date().toISOString(),
                code: code.length > 500 ? code.substring(0, 500) + '...' : code,
                review,
                score: review.score || 0
            };

            history.push(entry);
            // Limit to last 50 reviews to keep file size small
            const limitedHistory = history.slice(-50);
            fs.writeFileSync(this.historyFile, JSON.stringify(limitedHistory, null, 2));
        } catch (error) {
            console.error(chalk.red('Failed to save review context locally.'));
        }
    }

    /**
     * Conversation History for the AI Chat mode
     */
    async getChatHistory(): Promise<ChatMessage[]> {
        if (!fs.existsSync(this.chatFile)) return [];
        try {
            const data = fs.readFileSync(this.chatFile, 'utf-8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async saveChatHistory(messages: ChatMessage[]): Promise<void> {
        try {
            fs.writeFileSync(this.chatFile, JSON.stringify(messages, null, 2));
        } catch (error) {
            console.error(chalk.red('Failed to save chat history.'));
        }
    }

    async getHistory(limit: number = 10): Promise<ReviewEntry[]> {
        const history = this.loadHistory();
        return history.slice(-limit).reverse();
    }

    async clearHistory(): Promise<void> {
        fs.writeFileSync(this.historyFile, JSON.stringify([], null, 2));
        fs.writeFileSync(this.chatFile, JSON.stringify([], null, 2));
    }

    private loadHistory(): ReviewEntry[] {
        try {
            if (!fs.existsSync(this.historyFile)) return [];
            const data = fs.readFileSync(this.historyFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }
}