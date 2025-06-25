import { expect } from "chai";
import { ethers } from "hardhat";
import { TestContract } from "../typechain-types";

describe("TestContract", function () {
  let testContract: TestContract;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const TestContractFactory = await ethers.getContractFactory("TestContract");
    testContract = await TestContractFactory.deploy("Test Asset", 100);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await testContract.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and initial value", async function () {
      const [name, value] = await testContract.getInfo();
      expect(name).to.equal("Test Asset");
      expect(value).to.equal(100);
    });
  });

  describe("Value Updates", function () {
    it("Should allow owner to update value", async function () {
      await expect(testContract.updateValue(200))
        .to.emit(testContract, "ValueUpdated")
        .withArgs(100, 200);
      
      const [, value] = await testContract.getInfo();
      expect(value).to.equal(200);
    });

    it("Should not allow non-owner to update value", async function () {
      await expect(
        testContract.connect(addr1).updateValue(200)
      ).to.be.revertedWithCustomError(testContract, "OwnableUnauthorizedAccount");
    });
  });
}); 