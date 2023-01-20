const { assert } = require("chai")
const { ethers } = require("hardhat")
const { getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let FundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              FundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async () => {
              const fundTxResponse = await FundMe.fund({ value: sendValue })
              await fundTxResponse.wait(1)
              const withdrawTxResponse = await FundMe.withdraw()
              await withdrawTxResponse.wait(1)

              const endingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              console.log(
                  endingFundMeBalance.toString() +
                      " Should equal 0, running assert equal...."
              )
              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
