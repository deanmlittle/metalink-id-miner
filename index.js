const axios = require('axios'),
prompt = require('prompt-async'),
bsv = require('bsv'),
chalk = require('chalk');

const start = async() => {
    try {
        prompt.start();
        const {address} = await prompt.get(["address"]);
        if(address === 'exit'){
            return;
        }
        const {data} = await axios.get(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`);
        while(data.length && data[0].value<5000){
            data.shift();
        }
        if(!data.length){
            throw("No UTXOs found or insufficient UTXO balance.");
        }
        const {target} = await prompt.get(["target"]);
        if(!target.length){
            throw("No target found.");
        }
        const a = bsv.Address.fromString(address);
        const s = bsv.Script.buildPublicKeyHashOut(a).toHex();

        const utxo = {
            address: address,
            txId: data[0].tx_hash,
            outputIndex: data[0].tx_pos,
            height: data[0].height,
            script: s,
            satoshis: data[0].value
        };
        console.log(chalk.green(`Address: ${address} - Target: ${target}`));
        mineId(utxo, target);
    } catch(e){
        console.log(chalk.red(e));
        start();
    }
}

// const getAddress = async() => {
    
// }

// const getTarget = async() => {
    
// }

const mineId = async(u, t) => {
    let tx = new bsv.Transaction();
    tx.from(u);
    let mined = false;
    const s1 = new bsv.PrivateKey.fromRandom();
    const p1 = new bsv.PublicKey.fromPrivateKey(s1).toString();
    let s2, p2;
    let schema = {
        o: p1,
        a: ''
    };
    for(let i=0; !mined; i++){
        s2 = new bsv.PrivateKey.fromRandom();
        p2 = new bsv.PublicKey.fromPrivateKey(s2).toString();
        schema.a = p2;
        let newTX = new bsv.Transaction(tx.uncheckedSerialize());
        let s = new bsv.Script();
        s.add(bsv.Opcode.OP_FALSE);
        s.add(bsv.Opcode.OP_RETURN);
        s.add(Buffer.from(JSON.stringify(schema)));
        newTX.addOutput(new bsv.Transaction.Output({ script: s, satoshis: 0 }));
        if(newTX.hash.startsWith(t)){
            console.log(chalk.green(newTX.hash));
            mined = true;
        } else {
            console.log(newTX.hash);
        }
        console.log(newTX.uncheckedSerialize());
        // console.log(newTX.outputs.length);
    }
    console.log(JSON.stringify(schema));
    console.log("Owner priv: ", s1.toString());
    console.log("Active priv: ", s2.toString());
}

start();