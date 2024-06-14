const vscode = require('vscode');
const Arweave = require('arweave');
const fs = require('fs');
const path = require('path');

function activate(context) {

	let networkInfoCommand = vscode.commands.registerCommand('extension.networkInfo', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		try {
			const networkInfo = await arweave.network.getInfo();
			vscode.window.showInformationMessage(`Arweave Network Info: ${JSON.stringify(networkInfo)}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to fetch network info: ${error.message}`);
		}
	});
	context.subscriptions.push(networkInfoCommand);

	let uploadDataCommand = vscode.commands.registerCommand('extension.uploadData', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found.');
			return;
		}

		const network = await vscode.window.showInputBox({
			prompt: 'Enter network (testnet or mainnet)'
		});

		if (!network) {
			vscode.window.showErrorMessage('Network selection is required.');
			return;
		}

		let arweave;
		if (network.toLowerCase() === 'testnet') {
			arweave = Arweave.init({ host: 'localhost', port: 1984, protocol: 'http' });
		} else if (network.toLowerCase() === 'mainnet') {
			arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		} else {
			vscode.window.showErrorMessage('Invalid network. Please enter "testnet" or "mainnet".');
			return;
		}

		const filePath = await vscode.window.showInputBox({
			prompt: 'Enter file path to upload:'
		});

		if (!filePath) {
			vscode.window.showErrorMessage('File path is required.');
			return;
		}

		try {
			const workspaceFolder = vscode.workspace.workspaceFolders[0];
			const walletFilePath = path.join(workspaceFolder.uri.fsPath, 'wallet.json');
			const walletData = fs.readFileSync(walletFilePath, 'utf-8').trim();
			if (!walletData) {
				vscode.window.showErrorMessage('No wallet found.');
				return;
			}
			const wallet = JSON.parse(walletData);

			const address = await arweave.wallets.jwkToAddress(wallet);
			const balance = await arweave.wallets.getBalance(address);
			if (parseInt(balance) <= 0) {
				vscode.window.showErrorMessage('Insufficient balance in wallet.');
				return;
			}

			const data = fs.readFileSync(filePath, 'utf-8');
			const transaction = await arweave.createTransaction({ data }, wallet);
			await arweave.transactions.sign(transaction, wallet);
			await arweave.transactions.post(transaction);

			vscode.window.showInformationMessage(`Data uploaded with transaction ID: ${transaction.id}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to upload data: ${error.message}`);
		}
	});

	context.subscriptions.push(uploadDataCommand);

	let createTransactionCommand = vscode.commands.registerCommand('extension.createTransaction', async () => {
        const network = await vscode.window.showInputBox({
            prompt: 'Enter network (testnet or mainnet)'
        });

        if (!network) {
            vscode.window.showErrorMessage('Network selection is required.');
            return;
        }

        let arweave;
        if (network.toLowerCase() === 'testnet') {
            arweave = Arweave.init({ host: 'localhost', port: 1984, protocol: 'http' });
        } else if (network.toLowerCase() === 'mainnet') {
            arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
        } else {
            vscode.window.showErrorMessage('Invalid network. Please enter "testnet" or "mainnet".');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found.');
            return;
        }

        const data = editor.document.getText();

        try {
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const walletFilePath = path.join(workspaceFolder.uri.fsPath, 'wallet.json');
            const walletData = fs.readFileSync(walletFilePath, 'utf-8').trim();
            if (!walletData) {
                vscode.window.showErrorMessage('No wallet found.');
                return;
            }
            const wallet = JSON.parse(walletData);

            const address = await arweave.wallets.jwkToAddress(wallet);
            const balance = await arweave.wallets.getBalance(address);
            if (parseInt(balance) <= 0) {
                vscode.window.showErrorMessage('Insufficient balance in wallet.');
                return;
            }

            const transaction = await arweave.createTransaction({ data }, wallet);
            await arweave.transactions.sign(transaction, wallet);
            const response = await arweave.transactions.post(transaction);

            if (response.status === 200) {
                vscode.window.showInformationMessage(`Transaction posted with ID: ${transaction.id}`);
            } else {
                vscode.window.showErrorMessage(`Failed to post transaction: ${response.statusText}`);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create transaction: ${error.message}`);
        }
    });

    context.subscriptions.push(createTransactionCommand);

	let retrieveDataCommand = vscode.commands.registerCommand('extension.retrieveData', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		const transactionId = await vscode.window.showInputBox({
			prompt: 'Enter transaction ID to retrieve data:'
		});
		if (transactionId) {
			try {
				const transaction = await arweave.transactions.get(transactionId);
				const data = transaction.get('data', { decode: true, string: true });
				vscode.window.showInformationMessage(`Data retrieved: ${data}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to retrieve data: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(retrieveDataCommand);

	let accountInfoCommand = vscode.commands.registerCommand('extension.accountInfo', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		try {
			const address = await arweave.wallets.getAddress();
			const balance = await arweave.wallets.getBalance(address);
			vscode.window.showInformationMessage(`Wallet Address: ${address}\nBalance: ${balance} AR`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to fetch account info: ${error.message}`);
		}
	});
	context.subscriptions.push(accountInfoCommand);

	let checkBalanceCommand = vscode.commands.registerCommand('arsupport.checkBalance', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders[0];
			const filePath = path.join(workspaceFolder.uri.fsPath, 'wallet.json');
			const walletData = fs.readFileSync(filePath, 'utf-8').trim();
			const wallet = JSON.parse(walletData);
			const address = await arweave.wallets.jwkToAddress(wallet);
			const balance = await arweave.wallets.getBalance(address);

			vscode.window.showInformationMessage(`Balance: ${balance} AR`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to fetch account info: ${error.message}`);
		}
	});
	context.subscriptions.push(checkBalanceCommand);

	let createWalletCommand = vscode.commands.registerCommand('arsupport.createWallet', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		try {
			const wallet = await arweave.wallets.generate();

			const workspaceFolder = vscode.workspace.workspaceFolders[0];
			const filePath = path.join(workspaceFolder.uri.fsPath, 'wallet.json');

			fs.writeFileSync(filePath, JSON.stringify(wallet));

			vscode.window.showInformationMessage(`New Wallet Created and saved to wallet.json:\n${wallet}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create wallet: ${error.message}`);
		}
	});
	context.subscriptions.push(createWalletCommand);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
