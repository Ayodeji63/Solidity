const { ethers } = require("hardhat")
const { assert, expect } = require("chai")

describe("Voting", () => {
    let votingFactory, voting

    beforeEach(async () => {
        votingFactory = await ethers.getContractFactory("Voting")
        voting = await votingFactory.deploy([
            "0x4174696b75000000000000000000000000000000000000000000000000000000",
            "0x50657465722d4f62690000000000000000000000000000000000000000000000",
        ])
    })

    it("Should be the first address", async () => {
        const expectedValue =
            "0x4174696b75000000000000000000000000000000000000000000000000000000"
        const currentValue = await voting.winnerName()
        assert.equal(currentValue.toString(), expectedValue)
    })

    it("Should be zero", async () => {
        const expectedValue = "0"
        const currentValue = await voting.winningProposal()
        assert.equal(currentValue.toString(), expectedValue)
    })
    it("Should be the first address", async () => {
        const transactionResponse = await voting.vote(1)
        await transactionResponse.wait(1)

        const expectedValue = "1"
        const currentValue = await voting.winningProposal()
        assert.equal(currentValue.toString(), expectedValue)
    })
})
