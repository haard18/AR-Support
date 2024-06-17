const Arweave = require('arweave');
const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
async function retrieve(transactionId){
    let transaction = await arweave.transactions.getStatus(transactionId);
    // let data = transaction.get('data', {decode: true, string: false});
    console.log(transaction)
}
retrieve('GZ6NRjQc10f3Ml9_zXg5M4pRxAYNnCZWY6AKZQBN_Ws')