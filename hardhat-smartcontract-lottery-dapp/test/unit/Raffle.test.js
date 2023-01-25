const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Test", async () => {
      let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
      const chainId = network.config.chainId

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        )
        raffleEntranceFee = await raffle.getEntranceFee()
        interval = await raffle.getInterval()
      })

      describe("constructor", async () => {
        it("initialized the raffle correctly", async () => {
          // Ideally we make our test have just 1 assert per it

          const raffleState = await raffle.getRaffleState()
          const interval = await raffle.getInterval()
          assert.equal(raffleState.toString(), "0")
          assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
      })

      describe("enterRaffle", async () => {
        it("revert when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle_NotEnoughEthEntered"
          )
        })
        it("records players when they enter", async () => {
          await raffle.enterRaffle({
            value: raffleEntranceFee,
          })

          const playerFromContract = await raffle.getPlayer(0)
          assert.equal(playerFromContract, deployer)
        })
        it("emits event on enter", async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, "RaffleEnter")
        })

        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })

          // We pretend to be a Chainlink Keeper
          await raffle.performUpkeep([])
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWith("Raffle__NOTOPEN")
        })
      })
      describe("checkUpKeep", async () => {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })
          const { upkeepNeeded } = await raffle.checkUpkeep([])
          assert(!upkeepNeeded)
        })
        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })
          await raffle.performUpkeep([])
          const raffleState = await raffle.getRaffleState()
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
          assert.equal(raffleState.toString(), "1", upkeepNeeded == false)
          //   assert.equal(upkeepNeeded, false)
        })
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
          assert(!upkeepNeeded)
        })
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
        })
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ])
        await network.provider.request({ method: "evm_mine", params: [] })
        const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")
        assert(upkeepNeeded)
      })
      describe("performUpKeep", () => {
        it("it can only run if checkupKeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })
          const tx = await raffle.performUpkeep("0x")
          assert(tx)
        })
        it("reverts when checkupkeep is false", async () => {
          await expect(raffle.performUpkeep([])).to.be.revertedWith(
            "Raffle_UpkeepNotNeeded"
          )
        })
        it("updates the raffle state, emits and event, and call vrf coordinator", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })
          const txResponse = await raffle.performUpkeep([])
          const txReceipt = await txResponse.wait(1)
          const requestId = txReceipt.events[1].args.requestId
          const raffleState = await raffle.getRaffleState()
          assert(requestId.toNumber() > 0)
          assert(raffleState.toString() == "1")
        })
      })
      describe("fulfilRandomWords", () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.request({
            method: "evm_mine",
            params: [],
          })
          it("can only be called after performUpkeep", async () => {
            await expect(
              vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
            ).to.be.revertedWith("nonexistent request")
            await expect(
              vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
            ).to.be.revertedWith("nonexistent request")
          })
          it("picks a winner, resets the lottery, and sends money", async () => {
            const additionalEntrance = 3
            const startingIndex = 1
            const accounts = await ethers.getSigners()
            for (
              let i = startingIndex;
              i < startingIndex + additionalEntrance;
              i++
            ) {
              const accountConnectedRaffle = await raffle.connect(accounts[i])
              // raffle = raffleContract.connect(accounts[i])
              await accountConnectedRaffle.enterRaffle({
                value: raffleEntranceFee,
              })
            }
            const stratingTimeStamp = await raffle.getLastTimeStamp()

            //performUpkeep (mock being Chainlink Keepers)
            // fulfillRandomWords (mock being the Chainlink VRF)
            // We will have to wait for the fulfillRandomWords to be called

            await new Promise(async (resolve, reject) => {
              raffle.once("WinnerPicked", async () => {
                console.log("Found the event!")
                try {
                  const recentWinner = await raffle.getRecentWinner()
                  console.log(recentWinner)
                  console.log(accounts[2])
                  console.log(accounts[0])
                  console.log(accounts[1])
                  console.log(accounts[3])
                  const raffleState = await raffle.getRaffleState()
                  const endingTimeStamp = await raffle.getLastTimeStamp()
                  const winnerBalance = await accounts[1].getBalance()

                  await expect(raffle.getPlayer(0)).to.be.reverted
                  assert.equal(recentWinner.toString(), accounts[2].address)
                  assert.equal(raffleState, 0)

                  assert.equal(
                    winnerBalance.toString(),
                    startingBalance
                      .add(
                        raffleEntranceFee
                          .mul(additionalEntrance)
                          .add(raffleEntranceFee)
                      )
                      .toString()
                  )

                  const numPlayers = await raffle.getNumberOfPlayer()
                  assert.equal(numPlayers.toString(), "0")
                  assert.equal(raffleState.toString(), "0")
                  assert(endingTimeStamp > stratingTimeStamp)
                } catch (e) {
                  reject(e)
                }
                resolve()
              })
              // Setting up the listener
              // below, we will fire the event, and the listener will pick it up, and resolve
              const tx = await raffle.performUpkeep([])
              const txReceipt = await tx.wait(1)
              const startingBalance = await accounts[2].getBalance()
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                txReceipt.events[1].args.requestId,
                raffle.address
              )
            })
          })
        })
      })
    })
