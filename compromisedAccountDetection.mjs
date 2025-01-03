import Web3 from "web3";
import fs from 'fs';

const hackers = [
    "0xfCa268A0f468B4A8fe0131045B86FB2225D66578",
    "0x9880E694538401003638eacD22CC9D0520000000",
    "0x5a985baBA8D8B538E2894555020041e4811d5713",
    "0x4365FF30e4af3FfD659A9839A7DEbfeBc086fC50",
    "0xC620292a45f46a1779244Fe4A6A6204cE4999999",
    "0x629B3ec8915791D69542819595d964634916ba2C"
];


const web3 = new Web3("https://rpc.ankr.com/linea/xyx00112233");

const lxpAddress = "0xd83af4fbD77f3AB65C3B1Dc4B38D7e67AEcf599A";
const lxp = new web3.eth.Contract(erc20Abi, lxpAddress);
let counter = 0;
let totalLxp = 0;
let hackedAccountsCounter = 0;
let compromised = [];
let reviewedAddresses = new Set();
let hackersCounter = 0;

const getCompromisedAddresses = async () => {
    try {
        console.log("Working . . .")
        for(let h = 0; h < hackers.length; h++){
            if(!controlHackers(hackers[h])){
                hackersCounter++;
                const url = `https://api.lineascan.build/api?module=account&action=txlist&address=${hackers[h]}&startblock=0&endblock=latest&page=1&offset=10000&sort=asc&apikey=API_KEY`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Error al llamar a la API: ${response.status}`);
                }
                const data = await response.json();
                let len = data.result.length;
                if (data.status === '1') {
                    for(let i = 0; i < len; i++){
                        const fromAddress = data.result[i].from.toLowerCase();
                        let address1 = hackers[h];
                        let address2 = "0x0000000000000000000000000000000000000000";
                        if(
                            fromAddress !== address1.toLocaleLowerCase() && 
                            fromAddress !== address2.toLocaleLowerCase() && 
                            !controlAddresses(fromAddress) &&
                            !controlAddresses2(fromAddress) &&
                            await controlLxpBalance(fromAddress)
                        ){
                            compromised.push(data.result[i].from);
                            hackedAccountsCounter++;
                        }
                    }
                    writeJsonHacker(hackers[h],hackedAccountsCounter);
                } else {
                    console.error('API ERROR: ', data.message);
                }
            }
            hackedAccountsCounter = 0;
        }
        //console.log("Accounts => ", compromised);
        console.log(" . . . ");
        console.log("Accounts Reviewed => ", reviewedAddresses.size);
        console.log("Compromised Accounts => ", counter);
        console.log("TotalLxp => ", totalLxp, " LXPs");
        //console.log("Total $ => ", totalLxp*0.08, " $0.08/LXP preMarket");
        console.log("Number Of Sweepers => ", hackers.length);
        console.log("NOTES => ");
        console.log("Only addresses with an LXP balance greater than ", 99 ," are shown");
        console.log(" . . . ");
        console.log("     ");
        console.log("     ");
        const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        console.log("Number Of Sweepers ------|> ", data.totalSweepers);
        console.log("Compromised Accounts ----|> ", data.totalCompromisedAccounts, " With at least 99 LXP Balance");
        console.log("Compromised LXP Balance -|> ", data.totalLxp, " LXPs");
        console.log("     ");
        console.log("Notes => ");
        console.log("Only addresses with an LXP balance greater than ", 99 ," are shown");
        console.log("     ");
        console.log("     ");
    } catch (error) {
        console.error('Error al obtener las transacciones:', error);
    }
}

function writeJsonCompromised(address,amountLXP){
    let actualData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    actualData.compromisedAccounts.push(address);
    actualData.compromisedAccountsData.push({"address" : address, "balanceLXP" : amountLXP});
    actualData.totalLxp += amountLXP;
    actualData.totalCompromisedAccounts++;
    const jsonData = JSON.stringify(actualData, null, 2);
    fs.writeFileSync('Data.json', jsonData);
}

function writeJsonHacker(address, hackedAccounts){
    console.log("Analyzing Sweeper Account => " + address);
    let actualData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const newHacker = {"address" : address, "numberOfHacked" : hackedAccounts}
    actualData.reviewedSweepers.push(newHacker);
    actualData.totalSweepers++;
    const jsonData = JSON.stringify(actualData, null, 2);
    fs.writeFileSync('Data.json', jsonData);
}

function controlAddresses(address) {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const addressLower = address.toLowerCase();
    return data.compromisedAccounts.some(acc => 
        acc.toLowerCase() === addressLower
    );
}

function controlHackers(address) {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const addressLower = address.toLowerCase();
    return data.reviewedSweepers.some(hacker => 
        hacker.address.toLowerCase() === addressLower
    );
}

function controlAddresses2(address){
    if (reviewedAddresses.has(address.toLowerCase())) {
        return true;
    }
    reviewedAddresses.add(address.toLowerCase());
    return false;
}

async function controlLxpBalance(address){
    const balance = await lxp.methods.balanceOf(address).call() / BigInt(10**18);
    if(balance > BigInt(99)){
        totalLxp += Number(balance);
        counter++;
        writeJsonCompromised(address,Number(balance));
        return true;
    } else {
        return false;
    }
}

getCompromisedAddresses();

const erc20Abi = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];


// node CompromisedAccountDetection.mjs
