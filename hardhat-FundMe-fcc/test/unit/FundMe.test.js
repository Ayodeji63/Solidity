const { assert, expect } = require("chai")
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
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async () => {
        it("Fail if you don't send enough ETH", async () => {
            await expect(FundMe.fund()).to.be.revertedWith(
                "You need to send more ETH"
            )
        })
        it("Updated the amount funded data structure", async () => {
            await FundMe.fund({ value: sendValue })
            const response = await FundMe.addressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async () => {
            await FundMe.fund({ value: sendValue })
            const funder = await FundMe.funders(0)
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw", async () => {
        beforeEach(async () => {
            await FundMe.fund({ value: sendValue })
        })
        it("withdraw ETH from a single founder", async () => {
            // Arrange
            const startingFundMeBalance = await FundMe.provider.getBalance(
                FundMe.address
            )
            const startingDeployerBalance = await FundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await FundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await FundMe.provider.getBalance(
                FundMe.address
            )
            const endingDeployerBalance = await FundMe.provider.getBalance(
                deployer
            )
            //Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance),
                endingDeployerBalance.add(gasCost).toString()
            )
        })
    })
})
