const fs = require('fs').promises; // Include Node.js filesystem module
const Arweave = require('arweave'); // Include Arweave SDK
const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });

async function generateAndStoreWallet() {
    try {
        const wallet = await arweave.wallets.generate();
        const address = await arweave.wallets.jwkToAddress(wallet);

        // Prepare the data to be stored in wallet.txt
        const walletData = `Address: ${address}\n\nWallet Details:\n${JSON.stringify(wallet, null, 2)}`;
        console.log(address);
        // Write the wallet data to wallet.txt
        // await fs.writeFile('wallet.txt', walletData);
        
        // console.log('Wallet information stored in wallet.txt');
    } catch (error) {
        console.error('Error generating or storing wallet:', error);
    }
}
async function readWalletAndFetchBalance() {
    try {
        // Read the wallet.json file
        const walletData = await fs.readFile('wallet.json', 'utf-8');
        const wallet = JSON.parse(walletData);

        // Get the wallet address
        const address = await arweave.wallets.jwkToAddress(wallet);

        // Fetch the wallet balance
        const balance = await arweave.wallets.getBalance(address);

        console.log(`Wallet Address: ${address}`);
        console.log(`Wallet Balance: ${balance} AR`);

    } catch (error) {
        console.error('Error reading wallet or fetching balance:', error);
    }
}

readWalletAndFetchBalance();
// generateAndStoreWallet();
