require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

const PRIVATE_KEY = process.env.PRIVATE_KEY

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
    },
}
