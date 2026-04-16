import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

export const homePage = {
    /**
     * Displays the high-tech matrix-style header
     */
    displayWelcome: async () => {
        // Ensure the terminal is clear for the professional 'splash' effect
        console.clear();
        
        // Fix: Store the color in a constant for cleaner reuse
        const matrixGreen = chalk.hex('#00FF41');
        
        // Your specific ASCII Art - Wrapped in a raw string to protect backslashes
        console.log(matrixGreen.bold(`
    ██████╗ ██████╗ ██████╗ ███████╗██████╗ ███████╗██╗   ██╗██╗███████╗██╗    ██╗███████╗██████╗ 
    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██║   ██║██║██╔════╝██║    ██║██╔════╝██╔══██╗
    ██║     ██║   ██║██║  ██║█████╗  ██████╔╝█████╗  ██║   ██║██║█████╗  ██║ █╗ ██║█████╗  ██████╔╝
    ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██╗██╔══╝  ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║██╔══╝  ██╔══██╗
    ╚██████╗╚██████╔╝██████╔╝███████╗██║  ██║███████╗ ╚████╔╝ ██║███████╗╚███╔███╔╝███████╗██║  ██║
     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝.ai
        `));

        // Adding a subtle subtitle using gradient
        try {
            const subHeader = figlet.textSync('CODEREVIEWER', {
                font: 'Small',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            });
            console.log(gradient(['#00FF41', '#008F11']).multiline(subHeader));
        } catch (err) {
            // Fallback if figlet fails
            console.log(matrixGreen.bold('      --- CODEREVIEWER.AI ---      '));
        }
        
        console.log(chalk.gray('————————————————————————————————————————————————————————————————————'));
        console.log(chalk.white('  Advanced AI Analysis • Performance Optimization • Security Audit'));
        console.log(chalk.gray('————————————————————————————————————————————————————————————————————\n'));
    },

    /**
     * Shows a clean list of available commands
     */
    displayQuickHelp: () => {
        console.log(chalk.bold.white('📂 GETTING STARTED'));
        console.log(`  ${chalk.green('awd init')}        ${chalk.gray('→ Setup your API keys and provider')}`);
        console.log(`  ${chalk.green('awd review')}      ${chalk.gray('→ Review staged changes in Git')}`);
        console.log(`  ${chalk.green('awd watch')}       ${chalk.gray('→ Enable real-time auto-review mode')}`);
        console.log(`  ${chalk.green('awd chat')}        ${chalk.gray('→ Discuss results with the AI assistant')}\n`);

        console.log(chalk.bold.white('⚙️  SYSTEM'));
        console.log(`  ${chalk.green('awd status')}      ${chalk.gray('→ Show current configuration')}`);
        console.log(`  ${chalk.green('awd history')}     ${chalk.gray('→ View previous review scores')}\n`);
        
        console.log(chalk.hex('#00FF41')('Ready for input...'));
    }
};