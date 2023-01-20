require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-ethers")

const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKET_CAP = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    solidity: "0.8.17",
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
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKET_CAP,
        token: "MATIC",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
}
