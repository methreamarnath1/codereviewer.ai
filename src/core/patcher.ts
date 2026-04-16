import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import { AIProvider } from '../ai/provider.js';
import { ConfigManager } from '../config/manager.js';

interface PatchInfo {
    filePath: string;
    original: string;
    patched: string;
    issues: string[];
    backupPath: string;
}

export class AutoPatcher {
    async reviewAndPatch(filePath: string, aiProvider: AIProvider): Promise<PatchInfo | null> {
        try {
            const fullPath = path.resolve(process.cwd(), filePath);
            const fileExists = await this.fileExists(fullPath);
            if (!fileExists) {
                console.log(chalk.red(`File not found: ${filePath}`));
                return null;
            }

            console.log(chalk.cyan(`📋 Analyzing ${filePath} for automatic fixes...`));
            const original = await fs.readFile(fullPath, 'utf-8');
            const response = await aiProvider.getFixPatches(original, filePath);
            const reviewResult = this.parsePatchesFromResponse(response);

            if (!reviewResult.patches.length) {
                console.log(chalk.blue(`ℹ️  No automatic fixes available for ${filePath}`));
                return null;
            }

            const patched = this.applyPatches(original, reviewResult.patches);
            this.showDiff(filePath, reviewResult.patches);

            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: chalk.yellow('Apply these patches?'),
                    default: false
                }
            ]);

            if (!confirm) {
                console.log(chalk.yellow('⏸️  Patches cancelled'));
                return null;
            }

            const backupPath = `${fullPath}.backup.${Date.now()}`;
            await fs.writeFile(backupPath, original, 'utf-8');
            await fs.writeFile(fullPath, patched, 'utf-8');

            console.log(chalk.green(`✅ Patches applied to ${filePath}`));
            console.log(chalk.dim(`📦 Backup saved: ${backupPath}`));

            return {
                filePath,
                original,
                patched,
                issues: reviewResult.patches.map(p => p.issue),
                backupPath
            };
        } catch (error: any) {
            console.error(chalk.red(`❌ Patcher error: ${error.message}`));
            return null;
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private applyPatches(code: string, patches: Array<{ original: string; fixed: string; issue: string; }>): string {
        let result = code;
        for (const patch of patches) {
            if (patch.original && result.includes(patch.original)) {
                result = result.replace(patch.original, patch.fixed);
            } else {
                console.warn(chalk.yellow(`⚠️  Could not apply patch for: ${patch.issue}`));
            }
        }
        return result;
    }

    private showDiff(filePath: string, patches: Array<{ original: string; fixed: string; issue: string; }>): void {
        console.log('\n' + chalk.cyan.bold(`📝 Patch Preview for ${filePath}`));
        console.log(chalk.dim('─'.repeat(70)));

        patches.forEach((patch, index) => {
            console.log(chalk.red(`\n❌ Issue ${index + 1}: ${patch.issue}`));
            console.log(chalk.red(`   - ${patch.original.substring(0, 120).replace(/\n/g, ' ')}...`));
            console.log(chalk.green(`   + ${patch.fixed.substring(0, 120).replace(/\n/g, ' ')}...`));
        });

        console.log('\n' + chalk.dim('─'.repeat(70)) + '\n');
    }

    private parsePatchesFromResponse(response: string): { patches: Array<{ issue: string; original: string; fixed: string; }>; } {
        const patches: Array<{ issue: string; original: string; fixed: string; }> = [];
        const regex = /---FIX_START---([\s\S]*?)---FIX_END---/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(response)) !== null) {
            const block = match[1];
            const issue = block.match(/ISSUE:\s*(.+?)(?=\nORIGINAL|$)/s)?.[1]?.trim() || '';
            const original = block.match(/ORIGINAL:\s*([\s\S]*?)(?=\nFIXED|$)/s)?.[1]?.trim() || '';
            const fixed = block.match(/FIXED:\s*([\s\S]*?)(?=\n---|$)/s)?.[1]?.trim() || '';

            if (original && fixed) {
                patches.push({
                    issue: issue || 'Unknown issue',
                    original: original.replace(/^`+|`+$/g, '').trim(),
                    fixed: fixed.replace(/^`+|`+$/g, '').trim()
                });
            }
        }

        return { patches };
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const targetFile = process.argv[2];
    if (!targetFile) {
        console.log('Usage: tsx src/core/patcher.ts <file-to-patch>');
        process.exit(1);
    }

    const configManager = new ConfigManager();
    const aiProvider = new AIProvider(configManager);
    const patcher = new AutoPatcher();

    patcher.reviewAndPatch(targetFile, aiProvider).then(result => {
        if (!result) process.exit(1);
    }).catch(error => {
        console.error(chalk.red(`Error running patcher: ${error.message}`));
        process.exit(1);
    });
}
