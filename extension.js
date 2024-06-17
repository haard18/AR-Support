// import { exec } from 'child_process';
const { exec } = require('child_process');
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

	let installAOSCommand = vscode.commands.registerCommand('arsupport.installAOS', async () => {
		// Check if Node.js is installed
		exec('node -v', (err, stdout, stderr) => {
			if (err) {
				vscode.window.showErrorMessage('Node.js is not installed. Please install Node.js to use this command.');
				return;
			}

			// Node.js is installed, proceed to check npm
			exec('npm https://get_ao.g8way.io -v', (err, stdout, stderr) => {
				if (err) {
					// npm is not installed, proceed to install AOS
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						title: "Installing AOS",
						cancellable: false
					}, (progress, token) => {
						progress.report({ increment: 0 });

						return new Promise((resolve, reject) => {
							exec('npm i -g https://get_ao.g8way.io', (error, stdout, stderr) => {
								if (error) {
									vscode.window.showErrorMessage(`Failed to install AOS: ${stderr}`);
									reject();
								} else {
									vscode.window.showInformationMessage('AOS successfully installed.');
									const terminal = vscode.window.createTerminal();
									terminal.sendText('aos');
									terminal.show();
									resolve();
								}
							});
						});
					});
				} else {
					const terminal = vscode.window.createTerminal();
					terminal.sendText('aos');
					terminal.show();
					vscode.window.showInformationMessage('AOS is already installed.');
				}
			});
		});
	});

	context.subscriptions.push(installAOSCommand);


	let createAOChatCommand = vscode.commands.registerCommand('arsupport.createAOChat', async () => {

		try {
			exec('aos --version', (err, stdout, stderr) => {
				if (err) {
					vscode.window.showErrorMessage('AO is not installed. Please install AO to use this command.');
					return;
				}
				const workspaceFolder = vscode.workspace.workspaceFolders[0];
				const folderPath = path.join(workspaceFolder.uri.fsPath, 'aochat');

				// Create the directory if it doesn't exist
				if (!fs.existsSync(folderPath)) {
					fs.mkdirSync(folderPath);
				}

				const filePath = path.join(folderPath, 'chatroom.lua');

				// Show progress bar
				const progressOptions = {
					location: vscode.ProgressLocation.Notification,
					title: 'Creating chatroom.lua',
				};

				vscode.window.withProgress(progressOptions, async (progress) => {
					progress.report({ increment: 0, message: 'Starting to create chatroom...' });

					await new Promise((resolve) => setTimeout(resolve, 2000));

					progress.report({ increment: 50, message: 'Writing file...' });

					// Write file
					fs.writeFileSync(filePath, 'Members = Members or {}');

					progress.report({ increment: 100, message: 'File created successfully!' });

					// Open the terminal and load the Lua script
					const terminal = vscode.window.createTerminal();
					terminal.sendText(`cd aochat`);
					terminal.sendText('aos');
					// terminal.sendText('load chatroom.lua');
					vscode.window.showInformationMessage("Chatroom created successfully! Run .load chatroom.lua in AOS to interact with the chatroom.")
					terminal.show();

					return new Promise((resolve) => setTimeout(resolve, 1000));
				});
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create chatroom.lua: ${error.message}`);
		}
	});
	context.subscriptions.push(createAOChatCommand);
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
	//transactionStatusCommand
	let transactionStatusCommand = vscode.commands.registerCommand('arsupport.transactionStatus', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		const transactionId = await vscode.window.showInputBox({
			prompt: 'Enter transaction ID to check status:'
		});
		if (transactionId) {
			try {
				const status = await arweave.transactions.getStatus(transactionId);
				vscode.window.showInformationMessage(`Transaction Status: ${JSON.stringify(status)}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to retrieve transaction status: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(transactionStatusCommand);

	let retrieveDataCommand = vscode.commands.registerCommand('extension.retrieveData', async () => {
		const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
		const transactionId = await vscode.window.showInputBox({
			prompt: 'Enter transaction ID to retrieve data:'
		});
		if (transactionId) {
			try {
				const transaction = await arweave.transactions.get(transactionId);
				const data = transaction.get('data', { decode: true, string: false });
				const workspaceFolder = vscode.workspace.workspaceFolders[0];
				const folderPath = path.join(workspaceFolder.uri.fsPath, 'retrieval');
				if (!fs.existsSync(folderPath)) {
					fs.mkdirSync(folderPath);
				}
				const filePath = path.join(folderPath, `${transactionId}.json`);
				fs.writeFileSync(filePath, JSON.stringify(data));
				vscode.window.showInformationMessage(`Data retrieved and saved to ${filePath}`);
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

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
