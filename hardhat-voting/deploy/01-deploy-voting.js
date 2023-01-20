const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const voting = await deploy("Voting", {
        from: deployer,
        args: [],
        log: true,
    })

    console.log("-----------------------------------")
}
