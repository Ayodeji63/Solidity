require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
/** @type import('hardhat/config').HardhatUserConfig */
const GORERLI_RPC_URL = process.env.GORERLI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const API_KEY = process.env.API_KEY
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: "https://eth-goerli.g.alchemy.com/v2/kzkV77tLcCfjAUzwR0SrMd0P74m_bEfC",
            accounts: [PRIVATE_KEY],
            chainId: 5,
        },
    },
    solidity: "0.8.17",
    etherscan: {
        apiKey: API_KEY,
    },
}
