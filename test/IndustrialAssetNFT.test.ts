import { expect } from "chai";
import { ethers } from "hardhat";
import { IndustrialAssetNFT } from "../typechain-types";

describe("IndustrialAssetNFT", function () {
  let industrialAssetNFT: IndustrialAssetNFT;
  let owner: any;
  let operator: any;
  let technician: any;
  let user: any;
  let addrs: any[];

  beforeEach(async function () {
    [owner, operator, technician, user, ...addrs] = await ethers.getSigners();
    
    const IndustrialAssetNFTFactory = await ethers.getContractFactory("IndustrialAssetNFT");
    industrialAssetNFT = await IndustrialAssetNFTFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await industrialAssetNFT.hasRole(await industrialAssetNFT.OWNER_ROLE(), owner.address)).to.equal(true);
    });

    it("Should have correct name and symbol", async function () {
      expect(await industrialAssetNFT.name()).to.equal("Industrial Asset NFT");
      expect(await industrialAssetNFT.symbol()).to.equal("IANT");
    });
  });

  describe("Role Management", function () {
    beforeEach(async function () {
      // Primero acuñar un token para poder asignar roles
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500
      );
    });

    it("Should assign operator role", async function () {
      await industrialAssetNFT.assignRoleToToken(1, operator.address, await industrialAssetNFT.OPERATOR_ROLE());
      expect(await industrialAssetNFT.hasRoleForAsset(operator.address, await industrialAssetNFT.OPERATOR_ROLE())).to.equal(true);
    });

    it("Should assign technician role", async function () {
      await industrialAssetNFT.assignRoleToToken(1, technician.address, await industrialAssetNFT.TECHNICIAN_ROLE());
      expect(await industrialAssetNFT.hasRoleForAsset(technician.address, await industrialAssetNFT.TECHNICIAN_ROLE())).to.equal(true);
    });

    it("Should fail when non-owner tries to assign role", async function () {
      await expect(
        industrialAssetNFT.connect(user).assignRoleToToken(1, operator.address, await industrialAssetNFT.OPERATOR_ROLE())
      ).to.be.revertedWithCustomError(industrialAssetNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Asset Minting", function () {
    const tokenURI = "ipfs://QmTest123";
    const assetName = "Motor Industrial XYZ";

    it("Should mint asset successfully", async function () {
      const tx = await industrialAssetNFT.mintAsset(
        owner.address,
        tokenURI,
        assetName,
        75, // temperatura inicial
        1500 // RPM inicial
      );

      await expect(tx)
        .to.emit(industrialAssetNFT, "AssetMinted")
        .withArgs(1, owner.address, assetName);

      expect(await industrialAssetNFT.ownerOf(1)).to.equal(owner.address);
      expect(await industrialAssetNFT.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should initialize operational data correctly", async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        tokenURI,
        assetName,
        75,
        1500
      );

      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.temperature).to.equal(75);
      expect(operationalData.rpm).to.equal(1500);
      expect(operationalData.status).to.equal("Operativo");
      expect(operationalData.totalOperatingHours).to.equal(0);
    });

    it("Should fail when non-owner tries to mint", async function () {
      await expect(
        industrialAssetNFT.connect(user).mintAsset(
          user.address,
          tokenURI,
          assetName,
          75,
          1500
        )
      ).to.be.revertedWithCustomError(industrialAssetNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Operational Data Updates", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500
      );
      await industrialAssetNFT.assignRoleToToken(1, operator.address, await industrialAssetNFT.OPERATOR_ROLE());
    });

    it("Should update operational data successfully", async function () {
      const tx = await industrialAssetNFT.connect(operator).updateOperationalData(
        1,
        80,
        1600,
        "Mantenimiento"
      );

      await expect(tx)
        .to.emit(industrialAssetNFT, "OperationalDataUpdated")
        .withArgs(1, 80, 1600, "Mantenimiento");

      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.temperature).to.equal(80);
      expect(operationalData.rpm).to.equal(1600);
      expect(operationalData.status).to.equal("Mantenimiento");
    });

    it("Should fail when non-operator tries to update data", async function () {
      await expect(
        industrialAssetNFT.connect(user).updateOperationalData(1, 80, 1600, "Mantenimiento")
      ).to.be.revertedWithCustomError(industrialAssetNFT, "AccessControlUnauthorizedAccount");
    });

    it("Should fail when updating non-existent token", async function () {
      await expect(
        industrialAssetNFT.connect(operator).updateOperationalData(999, 80, 1600, "Mantenimiento")
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Maintenance Recording", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500
      );
      await industrialAssetNFT.assignRoleToToken(1, technician.address, await industrialAssetNFT.TECHNICIAN_ROLE());
    });

    it("Should record maintenance successfully", async function () {
      const maintenanceNote = "Cambio de aceite y filtros";
      const tx = await industrialAssetNFT.connect(technician).recordMaintenance(1, maintenanceNote);

      await expect(tx)
        .to.emit(industrialAssetNFT, "MaintenanceRecorded")
        .withArgs(1, maintenanceNote, await ethers.provider.getBlock("latest").then(block => block!.timestamp));

      const history = await industrialAssetNFT.getMaintenanceHistory(1);
      expect(history[0]).to.equal(maintenanceNote);
    });

    it("Should update last maintenance timestamp", async function () {
      const initialData = await industrialAssetNFT.getOperationalData(1);
      const initialTimestamp = initialData.lastMaintenance;

      await ethers.provider.send("evm_mine", []);
      
      await industrialAssetNFT.connect(technician).recordMaintenance(1, "Test maintenance");
      
      const updatedData = await industrialAssetNFT.getOperationalData(1);
      expect(updatedData.lastMaintenance).to.be.gt(initialTimestamp);
    });

    it("Should fail when non-technician tries to record maintenance", async function () {
      await expect(
        industrialAssetNFT.connect(user).recordMaintenance(1, "Test maintenance")
      ).to.be.revertedWithCustomError(industrialAssetNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Operating Hours Updates", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500
      );
      await industrialAssetNFT.assignRoleToToken(1, operator.address, await industrialAssetNFT.OPERATOR_ROLE());
    });

    it("Should update operating hours successfully", async function () {
      await industrialAssetNFT.connect(operator).updateOperatingHours(1, 8);
      
      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.totalOperatingHours).to.equal(8);
    });

    it("Should accumulate operating hours", async function () {
      await industrialAssetNFT.connect(operator).updateOperatingHours(1, 8);
      await industrialAssetNFT.connect(operator).updateOperatingHours(1, 4);
      
      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.totalOperatingHours).to.equal(12);
    });
  });

  describe("Data Retrieval", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500
      );
    });

    it("Should return correct operational data", async function () {
      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.temperature).to.equal(75);
      expect(operationalData.rpm).to.equal(1500);
      expect(operationalData.status).to.equal("Operativo");
    });

    it("Should return empty maintenance history for new asset", async function () {
      const history = await industrialAssetNFT.getMaintenanceHistory(1);
      expect(history.length).to.equal(0);
    });

    it("Should return correct total tokens count", async function () {
      expect(await industrialAssetNFT.getTotalTokens()).to.equal(1);
      
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest456",
        "Test Asset 2",
        80,
        1600
      );
      
      expect(await industrialAssetNFT.getTotalTokens()).to.equal(2);
    });

    it("Should fail when querying non-existent token", async function () {
      await expect(
        industrialAssetNFT.getOperationalData(999)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Token Burning", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500
      );
      await industrialAssetNFT.assignRoleToToken(1, technician.address, await industrialAssetNFT.TECHNICIAN_ROLE());
      await industrialAssetNFT.connect(technician).recordMaintenance(1, "Test maintenance");
    });

    it("Should clean up data when token is burned", async function () {
      await industrialAssetNFT.burn(1);
      
      // Verificar que los datos operativos se han limpiado
      await expect(
        industrialAssetNFT.getOperationalData(1)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Gas Optimization", function () {
    it("Should mint multiple assets efficiently", async function () {
      const gasUsed = [];
      
      for (let i = 0; i < 5; i++) {
        const tx = await industrialAssetNFT.mintAsset(
          owner.address,
          `ipfs://QmTest${i}`,
          `Asset ${i}`,
          75 + i,
          1500 + i * 100
        );
        const receipt = await tx.wait();
        gasUsed.push(receipt!.gasUsed);
      }
      
      // Verificar que el gas usado es razonable (menos de 250k por mint)
      gasUsed.forEach(gas => {
        expect(gas).to.be.lt(250000);
      });
    });
  });
}); 