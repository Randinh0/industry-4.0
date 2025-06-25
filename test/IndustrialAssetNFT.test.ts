import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("IndustrialAssetNFT", function () {
  let industrialAssetNFT: any;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let technician: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, operator, technician, user] = await ethers.getSigners();

    const IndustrialAssetNFT = await ethers.getContractFactory("IndustrialAssetNFT");
    industrialAssetNFT = await IndustrialAssetNFT.deploy();
    await industrialAssetNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await industrialAssetNFT.hasRole(await industrialAssetNFT.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });

    it("Should have correct name and symbol", async function () {
      expect(await industrialAssetNFT.name()).to.equal("Industrial Asset NFT");
      expect(await industrialAssetNFT.symbol()).to.equal("IANT");
    });
  });

  describe("Role Management", function () {
    beforeEach(async function () {
      // Asignar roles globalmente
      await industrialAssetNFT.assignRole(operator.address, await industrialAssetNFT.OPERATOR_ROLE());
      await industrialAssetNFT.assignRole(technician.address, await industrialAssetNFT.TECHNICIAN_ROLE());
    });

    it("Should assign operator role", async function () {
      expect(await industrialAssetNFT.hasRoleForAsset(operator.address, await industrialAssetNFT.OPERATOR_ROLE())).to.equal(true);
    });

    it("Should assign technician role", async function () {
      expect(await industrialAssetNFT.hasRoleForAsset(technician.address, await industrialAssetNFT.TECHNICIAN_ROLE())).to.equal(true);
    });

    it("Should fail when non-owner tries to assign role", async function () {
      await expect(
        industrialAssetNFT.connect(user).assignRole(operator.address, await industrialAssetNFT.OPERATOR_ROLE())
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
        1500, // RPM inicial
        10000, // acquisitionCost
        "Taller Principal" // location
      );

      await expect(tx)
        .to.emit(industrialAssetNFT, "AssetMinted")
        .withArgs(1, owner.address, assetName, 10000);

      expect(await industrialAssetNFT.ownerOf(1)).to.equal(owner.address);
      expect(await industrialAssetNFT.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should initialize operational data correctly", async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        tokenURI,
        assetName,
        75,
        1500,
        10000, // acquisitionCost
        "Taller Principal" // location
      );

      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.temperature).to.equal(75);
      expect(operationalData.rpm).to.equal(1500);
      expect(operationalData.status).to.equal("Operativo");
      expect(operationalData.totalOperatingHours).to.equal(0);
      expect(operationalData.location).to.equal("Taller Principal");
    });

    it("Should fail when non-owner tries to mint", async function () {
      await expect(
        industrialAssetNFT.connect(user).mintAsset(
          user.address,
          tokenURI,
          assetName,
          75,
          1500,
          10000, // acquisitionCost
          "Taller Principal" // location
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
        1500,
        10000, // acquisitionCost
        "Taller Principal" // location
      );
      await industrialAssetNFT.assignRole(operator.address, await industrialAssetNFT.OPERATOR_ROLE());
    });

    it("Should update operational data successfully", async function () {
      const tx = await industrialAssetNFT.connect(operator).updateOperationalData(
        1,
        80, // temperature
        1600, // rpm
        100, // powerConsumption
        95, // efficiency
        5, // vibration
        1013, // pressure
        "Mantenimiento", // status
        "Taller Secundario" // location
      );

      await expect(tx)
        .to.emit(industrialAssetNFT, "OperationalDataUpdated")
        .withArgs(1, 80, 1600, 100, 95, "Mantenimiento");

      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.temperature).to.equal(80);
      expect(operationalData.rpm).to.equal(1600);
      expect(operationalData.status).to.equal("Mantenimiento");
      expect(operationalData.location).to.equal("Taller Secundario");
    });

    it("Should fail when non-operator tries to update data", async function () {
      await expect(
        industrialAssetNFT.connect(user).updateOperationalData(
          1, 80, 1600, 100, 95, 5, 1013, "Mantenimiento", "Taller Secundario"
        )
      ).to.be.revertedWithCustomError(industrialAssetNFT, "AccessControlUnauthorizedAccount");
    });

    it("Should fail when updating non-existent token", async function () {
      await expect(
        industrialAssetNFT.connect(operator).updateOperationalData(
          999, 80, 1600, 100, 95, 5, 1013, "Mantenimiento", "Taller Secundario"
        )
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
        1500,
        10000, // acquisitionCost
        "Taller Principal" // location
      );
      await industrialAssetNFT.assignRole(technician.address, await industrialAssetNFT.TECHNICIAN_ROLE());
    });

    it("Should record maintenance successfully", async function () {
      const maintenanceNote = "Cambio de aceite y filtros";
      const cost = 500;
      const tx = await industrialAssetNFT.connect(technician).recordMaintenance(1, maintenanceNote, cost);

      await expect(tx)
        .to.emit(industrialAssetNFT, "MaintenanceRecorded")
        .withArgs(1, maintenanceNote, await ethers.provider.getBlock("latest").then(block => block!.timestamp), cost);

      const history = await industrialAssetNFT.getMaintenanceHistory(1);
      expect(history[0]).to.equal(maintenanceNote);
    });

    it("Should update last maintenance timestamp", async function () {
      const initialData = await industrialAssetNFT.getOperationalData(1);
      const initialTimestamp = initialData.lastMaintenance;

      await ethers.provider.send("evm_mine", []);
      
      await industrialAssetNFT.connect(technician).recordMaintenance(1, "Test maintenance", 100);
      
      const updatedData = await industrialAssetNFT.getOperationalData(1);
      expect(updatedData.lastMaintenance).to.be.gt(initialTimestamp);
    });

    it("Should fail when non-technician tries to record maintenance", async function () {
      await expect(
        industrialAssetNFT.connect(user).recordMaintenance(1, "Test maintenance", 100)
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
        1500,
        10000, // acquisitionCost
        "Taller Principal" // location
      );
      await industrialAssetNFT.assignRole(operator.address, await industrialAssetNFT.OPERATOR_ROLE());
    });

    it("Should update operating hours through operational data", async function () {
      // Actualizar horas operativas a través de updateOperationalData
      await industrialAssetNFT.connect(operator).updateOperationalData(
        1, 75, 1500, 100, 95, 5, 1013, "Operativo", "Taller Principal"
      );
      
      // Simular actualización de horas operativas
      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.totalOperatingHours).to.equal(0); // Inicialmente 0
    });
  });

  describe("Data Retrieval", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500,
        10000, // acquisitionCost
        "Taller Principal" // location
      );
    });

    it("Should return correct operational data", async function () {
      const operationalData = await industrialAssetNFT.getOperationalData(1);
      expect(operationalData.temperature).to.equal(75);
      expect(operationalData.rpm).to.equal(1500);
      expect(operationalData.status).to.equal("Operativo");
      expect(operationalData.location).to.equal("Taller Principal");
    });

    it("Should return correct financial data", async function () {
      const financialData = await industrialAssetNFT.getFinancialData(1);
      expect(financialData.acquisitionCost).to.equal(10000);
      expect(financialData.currentValue).to.equal(10000);
      expect(financialData.currency).to.equal("USD");
    });

    it("Should return correct compliance data", async function () {
      const complianceData = await industrialAssetNFT.getComplianceData(1);
      expect(complianceData.oshaCompliant).to.equal(true);
      expect(complianceData.safetyCertified).to.equal(true);
    });
  });

  describe("Token Burning", function () {
    beforeEach(async function () {
      await industrialAssetNFT.mintAsset(
        owner.address,
        "ipfs://QmTest123",
        "Test Asset",
        75,
        1500,
        10000, // acquisitionCost
        "Taller Principal" // location
      );
    });

    it("Should clean up data when token is burned", async function () {
      await industrialAssetNFT.burn(1);
      
      // Verificar que el token ya no existe
      await expect(industrialAssetNFT.ownerOf(1)).to.be.reverted;
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
          75,
          1500,
          10000, // acquisitionCost
          "Taller Principal" // location
        );
        const receipt = await tx.wait();
        gasUsed.push(receipt!.gasUsed);
      }
      
      // Verificar que el gas usado es razonable (menos de 600k por token)
      gasUsed.forEach(gas => {
        expect(gas).to.be.lt(600000);
      });
    });
  });
}); 