const { deployments, network, ethers } = require("hardhat")
const {
    developmentsChains,
    networkConfig,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const VRf_SUB_FUND_AMOUNT = ethers.utils.parseEther("0.1")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    if (developmentsChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse =
            await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionReceipt.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subscriptionId

        // Fund the subsc
        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRf_SUB_FUND_AMOUNT
        )
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId][entranceFee]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callBackGasLimit = network[chainId]["callBackGasLimit"]
    const interval = networkConfig[chainId][interval]

    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        callBackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfiramtions || 1,
    })

    // if (!developments.includes(network.name) && process.env.ETHER) {

    // }

    console.log("--------------------------------")
}

module.exports.tags = ["all", "raffle"]
