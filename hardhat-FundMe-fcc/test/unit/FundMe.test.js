const { assert, expect } = require("chai")
const { ethers, getNamedAccounts, deployments } = require("hardhat")

const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
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
                  const response = await FundMe.s_priceFeed()
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
                  const response = await FundMe.s_addressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of s_funders", async () => {
                  await FundMe.fund({ value: sendValue })
                  const funder = await FundMe.s_funders(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await FundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await FundMe.provider.getBalance(FundMe.address)
                  const startingDeployerBalance =
                      await FundMe.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await FundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await FundMe.provider.getBalance(
                      FundMe.address
                  )
                  const endingDeployerBalance =
                      await FundMe.provider.getBalance(deployer)
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
          })
          it("allows us to withdraw with multiple s_funders", async () => {
              const accounts = await ethers.getSigners()
              for (let i = 1; i < 6; i++) {
                  const fundMeConnectedContract = await FundMe.connect(
                      accounts[i]
                  )
                  await fundMeConnectedContract.fund({ value: sendValue })
              }

              const startingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const startingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              // Act
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

              // Assert
              //Assert
              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(),
                  endingDeployerBalance.add(gasCost).toString()
              )

              // Make sure that the s_funders are reset properly
              await expect(FundMe.s_funders(0)).to.be.reverted

              for (let i = 1; i < 6; i++) {
                  assert.equal(
                      await FundMe.s_addressToAmountFunded(accounts[i].address),
                      0
                  )
              }
          })

          it("Only allows the owner to withdraw", async () => {
              const accounts = await ethers.getSigners()
              const attacker = accounts[1]
              const attackerConnectedContract = await FundMe.connect(attacker)
              await expect(attackerConnectedContract.withdraw()).to.be.reverted
          })

          it("cheaper withdraw testing", async () => {
              const accounts = await ethers.getSigners()
              for (let i = 1; i < 6; i++) {
                  const fundMeConnectedContract = await FundMe.connect(
                      accounts[i]
                  )
                  await fundMeConnectedContract.fund({ value: sendValue })
              }

              const startingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const startingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              // Act
              const transactionResponse = await FundMe.cheaperWithdraw()
              const transactionReceipt = await transactionResponse.wait(1)

              const { gasUsed, effectiveGasPrice } = transactionReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)

              const endingFundMeBalance = await FundMe.provider.getBalance(
                  FundMe.address
              )
              const endingDeployerBalance = await FundMe.provider.getBalance(
                  deployer
              )

              // Assert
              //Assert
              assert.equal(endingFundMeBalance, 0)
              assert.equal(
                  startingFundMeBalance.add(startingDeployerBalance).toString(),
                  endingDeployerBalance.add(gasCost).toString()
              )

              // Make sure that the s_s_funders are reset properly
              await expect(FundMe.s_funders(0)).to.be.reverted

              for (let i = 1; i < 6; i++) {
                  assert.equal(
                      await FundMe.s_addressToAmountFunded(accounts[i].address),
                      0
                  )
              }
          })
      })
