require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("./tasks/block-number")
require("hardhat-gas-reporter")
require("solidity-coverage")

/** @type import('hardhat/config').HardhatUserConfig */
const GORERLI_RPC_URL = process.env.GORERLI_RPC_URL || "https:goerli-"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xKey"
const API_KEY = process.env.API_KEY || "0xKey"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: "https://eth-goerli.g.alchemy.com/v2/kzkV77tLcCfjAUzwR0SrMd0P74m_bEfC",
            accounts: [PRIVATE_KEY],
            chainId: 5,
        },
        localNetwork: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    solidity: "0.8.17",
    etherscan: {
        apiKey: API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
    },
}
