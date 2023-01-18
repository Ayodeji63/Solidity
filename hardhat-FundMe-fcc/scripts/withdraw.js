const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const FundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding...")
    const transactionResponse = await FundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Funded...")
}

main()
    .then(() => process.exit(0))
    .catch(() => {
        console.error(error)
        process.exit(1)
    })
