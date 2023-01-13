const { ethers, network } = require("hardhat")
async function main() {
    const votingFactory = await ethers.getContractFactory("Voting")
    console.log(`Deploying Contract...`)
    const voting = await votingFactory.deploy([
        "0x50657465722d4f62690000000000000000000000000000000000000000000000",
        "0x4174696b75000000000000000000000000000000000000000000000000000000",
    ])
    await voting.deployed()
    console.log(`Deployed contract to: ${voting.address}`)

    if (network.config.chainId == 5 && process.env.API_KEY) {
        console.log(`Waiting for block txes`)
        await voting.deployTransaction.wait(6)
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
