const { assert } = require("chai")
const { ethers, getNamedAccounts, deployments } = require("hardhat")

describe("FundMe", async () => {
    let FundMe
    let mockV3Aggregator
    let deployer
    const sendValue = ethers.utils.parseEther("1.0")

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        FundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", async () => {
        it("sets the aggregator price correctly", async () => {
            const response = await FundMe.priceFeed()
            assert.equal(response, mockV3Aggregator)
        })
    })
})
