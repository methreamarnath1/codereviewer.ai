import axios from 'axios';
import chalk from 'chalk';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../core/context.js';

export class AIProvider {
    private config: any;
    private genAI: GoogleGenAI | null = null;
    private geminiFallbackModels = [
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
    ];


    constructor(configManager: any) {
        this.config = configManager.getConfig();
        if (this.config.provider === 'gemini' && this.config.apiKey) {
            this.genAI = new GoogleGenAI({ apiKey: this.config.apiKey });
        }
    }
 

    /**
     * The main function to send code to the AI
     */
    async reviewCode(code: string, filePath: string, context?: any): Promise<any> {
        const prompt = this.buildReviewPrompt(code, filePath, context);

        try {
            switch (this.config.provider) {
                case 'gemini':
                    return await this.reviewWithGemini(prompt);
                case 'openai':
                    return await this.reviewWithOpenAI(prompt);
                case 'claude':
                    return await this.reviewWithClaude(prompt);
                default:
                    throw new Error('No AI provider configured. Run "awd init"');
            }

        } catch (error: any) {
            throw new Error(`AI Request Failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Chat with the AI using conversation history
     */ 
    async chat(message: string, history: ChatMessage[]): Promise<string> {
        try {
            switch (this.config.provider) {
                case 'gemini':
                    return await this.chatWithGemini(message, history);
                case 'openai':
                    return await this.chatWithOpenAI(message, history);
                case 'claude':
                    return await this.chatWithClaude(message, history);
                default:
                    throw new Error('No AI provider configured. Run "awd init"');
            }
        } catch (error: any) {
            throw new Error(`AI Chat Failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    private buildReviewPrompt(code: string, filePath: string, context?: any): string {
        return `
        You are "codereviewer.ai", an expert senior developer. 
        Review the following code for file: ${filePath}

        CRITERIA:
        1. Identify bugs or security flaws.
        2. Suggest performance optimizations.
        3. Check for best practices and readability.

        CONTEXT FROM PREVIOUS CHATS:
        ${JSON.stringify(context || "None")}

        CODE TO REVIEW:
        \`\`\`
        ${code}
        \`\`\`

        RESPONSE FORMAT:
        You MUST respond ONLY with a valid JSON object. Do not include markdown formatting or prose.
        {
          "summary": "Brief overall thought",
          "score": 1-10,
          "issues": [{"line": number, "type": "bug|style|security", "msg": "description", "fix": "suggested code"}],
          "optimizations": ["list of tips"]
        }
        `;
    }

    private async reviewWithGemini(prompt: string) {
        if (!this.genAI) {
            throw new Error('Google GenAI not initialized. Check your API key.');
        }

        // Try the configured model first
        try {
            const response = await this.genAI.models.generateContent({
                model: this.config.model,
                contents: prompt,
            });
            const text = response.text || '';
            return JSON.parse(this.cleanJSON(text));
        } catch (error: any) {
            // Check if it's a quota exceeded error
            if (error.message?.includes('RESOURCE_EXHAUSTED') ||
                error.message?.includes('Quota exceeded') ||
                error.status === 429) {

                console.log(chalk.yellow(`⚠️  ${this.config.model} quota exceeded. Trying fallback models...`));

                // Try fallback models
                for (const fallbackModel of this.geminiFallbackModels) {
                    if (fallbackModel === this.config.model) continue; // Skip if it's the same model

                    try {
                        console.log(chalk.blue(`🔄 Trying ${fallbackModel}...`));
                        const fallbackResponse = await this.genAI.models.generateContent({
                            model: fallbackModel,
                            contents: prompt,
                        });
                        const fallbackText = fallbackResponse.text || '';
                        console.log(chalk.green(`✅ Successfully used ${fallbackModel}`));
                        return JSON.parse(this.cleanJSON(fallbackText));
                    } catch (fallbackError: any) {
                        console.log(chalk.red(`❌ ${fallbackModel} also failed: ${fallbackError.message}`));
                        continue;
                    }
                }

                throw new Error(`All Gemini models failed. Last error: ${error.message}`);
            }
            throw error;
        }
    }

    private async reviewWithOpenAI(prompt: string) {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
        }, {
            headers: { Authorization: `Bearer ${this.config.apiKey}` }
        });
        return JSON.parse(response.data.choices[0].message.content);
    }

    private async reviewWithClaude(prompt: string) {
        // Logic for Claude API (Anthropic)
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: { 
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            }
        });
        return JSON.parse(this.cleanJSON(response.data.content[0].text));
    }

    private async chatWithGemini(message: string, history: ChatMessage[]): Promise<string> {
        if (!this.genAI) {
            throw new Error('Google GenAI not initialized. Check your API key.');
        }

        const prompt = this.buildChatPrompt(message, history);

        // Try the configured model first
        try {
            const response = await this.genAI.models.generateContent({
                model: this.config.model,
                contents: prompt,
            });
            return response.text || '';
        } catch (error: any) {
            // Check if it's a quota exceeded error
            if (error.message?.includes('RESOURCE_EXHAUSTED') ||
                error.message?.includes('Quota exceeded') ||
                error.status === 429) {

                console.log(chalk.yellow(`⚠️  ${this.config.model} quota exceeded. Trying fallback models...`));

                // Try fallback models
                for (const fallbackModel of this.geminiFallbackModels) {
                    if (fallbackModel === this.config.model) continue; // Skip if it's the same model

                    try {
                        console.log(chalk.blue(`🔄 Trying ${fallbackModel}...`));
                        const fallbackResponse = await this.genAI.models.generateContent({
                            model: fallbackModel,
                            contents: prompt,
                        });
                        console.log(chalk.green(`✅ Successfully used ${fallbackModel}`));
                        return fallbackResponse.text || '';
                    } catch (fallbackError: any) {
                        console.log(chalk.red(`❌ ${fallbackModel} also failed: ${fallbackError.message}`));
                        continue;
                    }
                }

                throw new Error(`All Gemini models failed. Last error: ${error.message}`);
            }
            throw error;
        }
    }

    private async chatWithOpenAI(message: string, history: ChatMessage[]): Promise<string> {
        const messages = history.map(h => ({ role: h.role, content: h.content }));
        messages.push({ role: 'user', content: message });
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4-turbo-preview',
            messages: messages
        }, {
            headers: { Authorization: `Bearer ${this.config.apiKey}` }
        });
        return response.data.choices[0].message.content;
    }

    private async chatWithClaude(message: string, history: ChatMessage[]): Promise<string> {
        const messages = history.map(h => ({ role: h.role, content: h.content }));
        messages.push({ role: 'user', content: message });
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: messages
        }, {
            headers: { 
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            }
        });
        return response.data.content[0].text;
    }

    private buildChatPrompt(message: string, history: ChatMessage[]): string {
        let prompt = "You are codereviewer.ai, an expert developer assistant. Help with code-related questions.\n\n";
        for (const msg of history) {
            prompt += `${msg.role}: ${msg.content}\n`;
        }
        prompt += `user: ${message}\nassistant:`;
        return prompt;
    }

    /**
     * Removes Markdown code blocks if the AI accidentally includes them
     */
    private cleanJSON(text: string): string {
        return text.replace(/```json|```/g, "").trim();
    }
}