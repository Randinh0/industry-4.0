import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProductionTrace1155", function () {
  let productionTrace: any;
  let owner: SignerWithAddress;
  let supplier: SignerWithAddress;
  let operator: SignerWithAddress;
  let qualityInspector: SignerWithAddress;
  let auditor: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, supplier, operator, qualityInspector, auditor, user] = await ethers.getSigners();

    const ProductionTrace1155 = await ethers.getContractFactory("ProductionTrace1155");
    productionTrace = await ProductionTrace1155.deploy();
    await productionTrace.waitForDeployment();

    // Asignar roles
    const contract = productionTrace as any;
    await contract.grantRole(await contract.SUPPLIER_ROLE(), supplier.address);
    await contract.grantRole(await contract.OPERATOR_ROLE(), operator.address);
    await contract.grantRole(await contract.QUALITY_ROLE(), qualityInspector.address);
    await contract.grantRole(await contract.AUDITOR_ROLE(), auditor.address);
  });

  describe("Creación de lotes", function () {
    it("Debería crear un nuevo lote correctamente", async function () {
      const batchId = "BATCH-001";
      const materialType = "Acero";
      const supplierName = "Aceros del Norte";
      const quantity = 1000;
      const unit = "kg";
      const qualityGrade = "A";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 año

      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        batchId,
        materialType,
        supplierName,
        quantity,
        unit,
        qualityGrade,
        expiryDate
      );

      const tokenId = await productionTrace.getTokenIdByBatchId(batchId);
      expect(tokenId).to.equal(1);

      const metadata = await productionTrace.getBatchMetadata(tokenId);
      expect(metadata.batchId).to.equal(batchId);
      expect(metadata.materialType).to.equal(materialType);
      expect(metadata.supplier).to.equal(supplierName);
      expect(metadata.quantity).to.equal(quantity);
      expect(metadata.unit).to.equal(unit);
      expect(metadata.qualityGrade).to.equal(qualityGrade);

      const balance = await productionTrace.balanceOf(supplier.address, tokenId);
      expect(balance).to.equal(quantity);
    });

    it("No debería permitir crear lotes con ID duplicado", async function () {
      const batchId = "BATCH-001";
      
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        batchId,
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      await expect(
        productionTrace.connect(supplier).createBatch(
          supplier.address,
          batchId,
          "Acero",
          "Proveedor B",
          500,
          "kg",
          "B",
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
        )
      ).to.be.revertedWith("dup");
    });

    it("No debería permitir crear lotes sin rol de proveedor", async function () {
      await expect(
        productionTrace.connect(user).createBatch(
          user.address,
          "BATCH-001",
          "Acero",
          "Proveedor A",
          1000,
          "kg",
          "A",
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
        )
      ).to.be.reverted;
    });
  });

  describe("Registro de trazabilidad", function () {
    let tokenId: number;

    beforeEach(async function () {
      // Crear un lote para las pruebas
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        "BATCH-001",
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      tokenId = await productionTrace.getTokenIdByBatchId("BATCH-001");
      
      // Transferir tokens al operador para poder hacer operaciones
      await productionTrace.connect(supplier).safeTransferFrom(
        supplier.address,
        operator.address,
        tokenId,
        500,
        "0x"
      );
    });

    it("Debería registrar entrada de material correctamente", async function () {
      await productionTrace.connect(operator).recordInput(
        tokenId,
        200,
        "Almacén A",
        "Línea de Producción 1",
        "PROC-001"
      );

      const traceHistory = await productionTrace.getTraceHistory(tokenId);
      expect(traceHistory.length).to.equal(1);
      expect(traceHistory[0].operation).to.equal("input");
      expect(traceHistory[0].quantity).to.equal(200);
      expect(traceHistory[0].fromLocation).to.equal("Almacén A");
      expect(traceHistory[0].toLocation).to.equal("Línea de Producción 1");
      expect(traceHistory[0].processId).to.equal("PROC-001");

      const metadata = await productionTrace.getBatchMetadata(tokenId);
      expect(metadata.quantity).to.equal(800); // 1000 - 200
    });

    it("Debería registrar salida de material correctamente", async function () {
      await productionTrace.connect(operator).recordOutput(
        tokenId,
        150,
        "Línea de Producción 1",
        "Almacén de Producto Terminado",
        "PROC-001"
      );

      const traceHistory = await productionTrace.getTraceHistory(tokenId);
      expect(traceHistory.length).to.equal(1);
      expect(traceHistory[0].operation).to.equal("output");
      expect(traceHistory[0].quantity).to.equal(150);
      expect(traceHistory[0].fromLocation).to.equal("Línea de Producción 1");
      expect(traceHistory[0].toLocation).to.equal("Almacén de Producto Terminado");
      expect(traceHistory[0].processId).to.equal("PROC-001");

      const metadata = await productionTrace.getBatchMetadata(tokenId);
      expect(metadata.quantity).to.equal(850); // 1000 - 150
    });

    it("No debería permitir registrar operaciones sin rol de operador", async function () {
      await expect(
        productionTrace.connect(user).recordInput(
          tokenId,
          200,
          "Almacén A",
          "Línea de Producción 1",
          "PROC-001"
        )
      ).to.be.reverted;
    });

    it("No debería permitir registrar operaciones con cantidad insuficiente", async function () {
      await expect(
        productionTrace.connect(operator).recordInput(
          tokenId,
          1000, // Más de lo que tiene el operador
          "Almacén A",
          "Línea de Producción 1",
          "PROC-001"
        )
      ).to.be.revertedWith("bal");
    });
  });

  describe("Datos de calidad", function () {
    let tokenId: number;

    beforeEach(async function () {
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        "BATCH-001",
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      tokenId = await productionTrace.getTokenIdByBatchId("BATCH-001");
    });

    it("Debería actualizar datos de calidad correctamente", async function () {
      await productionTrace.connect(qualityInspector).updateQualityData(
        tokenId,
        25, // temperatura
        60, // humedad
        1013, // presión
        "excelente"
      );

      const qualityData = await productionTrace.getQualityData(tokenId);
      expect(qualityData.temperature).to.equal(25);
      expect(qualityData.humidity).to.equal(60);
      expect(qualityData.pressure).to.equal(1013);
      expect(qualityData.qualityStatus).to.equal("excelente");
      expect(qualityData.lastInspection).to.be.gt(0);
    });

    it("No debería permitir actualizar calidad sin rol de inspector", async function () {
      await expect(
        productionTrace.connect(user).updateQualityData(
          tokenId,
          25,
          60,
          1013,
          "excelente"
        )
      ).to.be.reverted;
    });
  });

  describe("Consultas y estadísticas", function () {
    let tokenId: number;

    beforeEach(async function () {
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        "BATCH-001",
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      tokenId = await productionTrace.getTokenIdByBatchId("BATCH-001");
      
      await productionTrace.connect(supplier).safeTransferFrom(
        supplier.address,
        operator.address,
        tokenId,
        1000,
        "0x"
      );
    });

    it("Debería obtener historial de trazabilidad correctamente", async function () {
      // Realizar algunas operaciones
      await productionTrace.connect(operator).recordInput(tokenId, 200, "Almacén A", "Línea 1", "PROC-001");
      await productionTrace.connect(operator).recordOutput(tokenId, 150, "Línea 1", "Almacén PT", "PROC-001");
      await productionTrace.connect(operator).recordInput(tokenId, 100, "Almacén A", "Línea 2", "PROC-002");

      const traceHistory = await productionTrace.getTraceHistory(tokenId);
      expect(traceHistory.length).to.equal(3);
      expect(traceHistory[0].operation).to.equal("input");
      expect(traceHistory[0].quantity).to.equal(200);
      expect(traceHistory[1].operation).to.equal("output");
      expect(traceHistory[1].quantity).to.equal(150);
      expect(traceHistory[2].operation).to.equal("input");
      expect(traceHistory[2].quantity).to.equal(100);
    });
  });

  describe("Eventos", function () {
    it("Debería emitir evento BatchCreated al crear un lote", async function () {
      const batchId = "BATCH-001";
      const materialType = "Acero";
      const supplierName = "Proveedor A";
      const quantity = 1000;

      await expect(
        productionTrace.connect(supplier).createBatch(
          supplier.address,
          batchId,
          materialType,
          supplierName,
          quantity,
          "kg",
          "A",
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
        )
      )
        .to.emit(productionTrace, "BatchCreated")
        .withArgs(1, batchId, materialType, quantity, supplierName);
    });

    it("Debería emitir evento TraceRecorded al registrar trazabilidad", async function () {
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        "BATCH-001",
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      const tokenId = await productionTrace.getTokenIdByBatchId("BATCH-001");
      
      await productionTrace.connect(supplier).safeTransferFrom(
        supplier.address,
        operator.address,
        tokenId,
        500,
        "0x"
      );

      await expect(
        productionTrace.connect(operator).recordInput(tokenId, 200, "Almacén A", "Línea 1", "PROC-001")
      )
        .to.emit(productionTrace, "TraceRecorded")
        .withArgs(tokenId, "input", 200, "Almacén A", "Línea 1", "PROC-001");
    });

    it("Debería emitir evento QualityDataUpdated al actualizar calidad", async function () {
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        "BATCH-001",
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      const tokenId = await productionTrace.getTokenIdByBatchId("BATCH-001");

      await expect(
        productionTrace.connect(qualityInspector).updateQualityData(tokenId, 25, 60, 1013, "excelente")
      )
        .to.emit(productionTrace, "QualityDataUpdated")
        .withArgs(tokenId, "excelente");
    });
  });

  describe("Funcionalidades ERC-1155", function () {
    it("Debería transferir tokens correctamente", async function () {
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        "BATCH-001",
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      const tokenId = await productionTrace.getTokenIdByBatchId("BATCH-001");
      
      await productionTrace.connect(supplier).safeTransferFrom(
        supplier.address,
        operator.address,
        tokenId,
        300,
        "0x"
      );

      const supplierBalance = await productionTrace.balanceOf(supplier.address, tokenId);
      const operatorBalance = await productionTrace.balanceOf(operator.address, tokenId);
      
      expect(supplierBalance).to.equal(700);
      expect(operatorBalance).to.equal(300);
    });

    it("Debería obtener URI correctamente", async function () {
      const batchId = "BATCH-001";
      await productionTrace.connect(supplier).createBatch(
        supplier.address,
        batchId,
        "Acero",
        "Proveedor A",
        1000,
        "kg",
        "A",
        Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      );

      const tokenId = await productionTrace.getTokenIdByBatchId(batchId);
      const uri = await productionTrace.uri(tokenId);
      
      expect(uri).to.equal(`ipfs://${batchId}`);
    });
  });
}); 