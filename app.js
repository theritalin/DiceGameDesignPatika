const { ethers } = require("ethers");
const contractAddress = "0x996f661f1bF0B1d749bD4C57beDD03887E028D99"; // Replace with your contract address
const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "playerNumber",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "computerNumber",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "playerWins",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "payout",
        type: "uint256",
      },
    ],
    name: "GameResult",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "playerBalances",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "play",
    outputs: [],
    stateMutability: "payable",
    type: "function",
    payable: true,
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "seed1",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "seed2",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "bNumber",
        type: "uint256",
      },
    ],
    name: "roll",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "checkGameBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [],
    name: "get_owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
];

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);
let connected = false;

///changes to ether format from wei
function toEther(n) {
  return n / 10 ** 18;
}

///to connect the metamask-Login
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    connected = true;
    document.getElementById("connect-button").textContent = "Disconnect";
    await ethereum
      .request({ method: "eth_requestAccounts" })
      .then(async (accounts) => {
        const account = accounts[0];

        //account address
        const accountAddressElement =
          document.getElementById("account-address");
        accountAddressElement.textContent = `Connected Account: ${account}`;

        //in-game balance
        let balance = await contract.checkGameBalance();
        const balanceElement = document.getElementById("balance");
        balanceElement.textContent = `Player Balance: ${toEther(balance)}`;

        //contract balance
        let cbalance = await provider.getBalance(contractAddress);
        const cbalanceElement = document.getElementById("contract-balance");
        cbalanceElement.textContent = `Contract Balance: ${toEther(cbalance)}`;
      })
      .catch((error) => {
        console.error("Error connecting to MetaMask:", error);
      });
  }
}

//to disconnect - logout
async function disconnect() {
  console.log("çalıştı");
  if (typeof window.ethereum !== "undefined") {
    connected = false;
    document.getElementById("connect-button").textContent = "Connect";
    try {
      await ethereum.request({ method: "eth_logout" });

      // Clear the connected account and balance elements
      const accountAddressElement = document.getElementById("account-address");
      accountAddressElement.textContent = "Disconnected";

      const balanceElement = document.getElementById("balance");
      balanceElement.textContent = "Player Balance: 0";

      const cbalanceElement = document.getElementById("contract-balance");
      cbalanceElement.textContent = "Contract Balance: 0";
    } catch (error) {
      console.error("Error disconnecting from MetaMask:", error);
    }
  }
}

//to run play the game
async function execute() {
  try {
    console.log(signer.account);

    const transaction = await contract.play({
      from: signer.account,
      value: ethers.utils.parseEther("0.001"),
    });

    await transaction.wait();

    // Get the latest game result event
    const filter = contract.filters.GameResult(null, null, null, null, null);
    const events = await contract.queryFilter(filter, transaction.blockNumber);
    const latestEvent = events[events.length - 1];

    // Get the player and computer numbers (dice values) from the event
    const playerNumber = latestEvent.args.playerNumber.toNumber();
    const computerNumber = latestEvent.args.computerNumber.toNumber();

    // Display the dice values
    console.log("Player Number (Dice 1):", playerNumber);
    console.log("Computer Number (Dice 2):", computerNumber);
    document.getElementById("dice1").src = `${playerNumber}.png`;
    document.getElementById("dice2").src = `${computerNumber}.png`;

    playerNumber > computerNumber
      ? (document.getElementById("result").textContent = "You Win")
      : (document.getElementById("result").textContent = "Sorry You Lost");

    //in-game balance
    let balance = await contract.checkGameBalance();
    const balanceElement = document.getElementById("balance");
    balanceElement.textContent = `Player Balance: ${toEther(balance)}`;

    //contract balance
    let cbalance = await provider.getBalance(contractAddress);
    const cbalanceElement = document.getElementById("contract-balance");
    cbalanceElement.textContent = `Contract Balance: ${toEther(cbalance)}`;
  } catch (error) {
    console.error("Error executing play function:", error);
  }
}

//to withdraw game balance to metamask
async function withdraw() {
  try {
    await contract.withdraw();

    //in-game balance
    let balance = await contract.checkGameBalance();
    const balanceElement = document.getElementById("balance");
    balanceElement.textContent = `Player Balance: ${toEther(balance)}`;

    //contract balance
    let cbalance = await provider.getBalance(contractAddress);
    const cbalanceElement = document.getElementById("contract-balance");
    cbalanceElement.textContent = `Contract Balance: ${toEther(cbalance)}`;
  } catch (error) {
    console.error("Error executing withdraw function:", error);
  }
}

module.exports = {
  connect,
  execute,
  withdraw,
  disconnect,
  connected,
};
