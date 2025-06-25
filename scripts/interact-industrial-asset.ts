import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Iniciando interacción con IndustrialAssetNFT...");

  // Obtener signers
  const [owner, operator, technician, user] = await ethers.getSigners();
  
  // Dirección del contrato desplegado (reemplazar con la dirección real)
  const contractAddress = "0x..."; // Reemplazar con la dirección real del contrato
  const IndustrialAssetNFT = await ethers.getContractFactory("IndustrialAssetNFT");
  const industrialAssetNFT = IndustrialAssetNFT.attach(contractAddress);

  console.log("👤 Owner:", owner.address);
  console.log("🔧 Operator:", operator.address);
  console.log("🔨 Technician:", technician.address);
  console.log("👤 User:", user.address);

  try {
    // 1. Asignar roles
    console.log("\n📋 Asignando roles...");
    await industrialAssetNFT.assignRoleToToken(1, operator.address, await industrialAssetNFT.OPERATOR_ROLE());
    await industrialAssetNFT.assignRoleToToken(1, technician.address, await industrialAssetNFT.TECHNICIAN_ROLE());
    console.log("✅ Roles asignados correctamente");

    // 2. Acuñar un nuevo activo
    console.log("\n🪙 Acuñando nuevo activo...");
    const tokenURI = "ipfs://QmXyZ1234567890abcdefghijklmnopqrstuvwxyz";
    const assetName = "Motor Industrial Siemens 7ML1200";
    
    const mintTx = await industrialAssetNFT.mintAsset(
      owner.address,
      tokenURI,
      assetName,
      75, // temperatura inicial
      1750 // RPM inicial
    );
    
    const mintReceipt = await mintTx.wait();
    console.log("✅ Activo acuñado. Token ID:", await industrialAssetNFT.getTotalTokens());

    // 3. Obtener datos operativos iniciales
    console.log("\n📊 Datos operativos iniciales:");
    const initialData = await industrialAssetNFT.getOperationalData(1);
    console.log("   - Temperatura:", initialData.temperature, "°C");
    console.log("   - RPM:", initialData.rpm);
    console.log("   - Estado:", initialData.status);
    console.log("   - Horas de operación:", initialData.totalOperatingHours);

    // 4. Actualizar datos operativos (como operador)
    console.log("\n🔄 Actualizando datos operativos...");
    const updateTx = await industrialAssetNFT.connect(operator).updateOperationalData(
      1,
      82, // nueva temperatura
      1800, // nuevo RPM
      "Mantenimiento"
    );
    await updateTx.wait();
    console.log("✅ Datos operativos actualizados");

    // 5. Registrar mantenimiento (como técnico)
    console.log("\n🔨 Registrando mantenimiento...");
    const maintenanceNote = "Cambio de aceite y filtros. Revisión de rodamientos.";
    const maintenanceTx = await industrialAssetNFT.connect(technician).recordMaintenance(1, maintenanceNote);
    await maintenanceTx.wait();
    console.log("✅ Mantenimiento registrado");

    // 6. Actualizar horas de operación
    console.log("\n⏰ Actualizando horas de operación...");
    await industrialAssetNFT.connect(operator).updateOperatingHours(1, 24);
    console.log("✅ Horas de operación actualizadas");

    // 7. Obtener datos actualizados
    console.log("\n📊 Datos operativos actualizados:");
    const updatedData = await industrialAssetNFT.getOperationalData(1);
    console.log("   - Temperatura:", updatedData.temperature, "°C");
    console.log("   - RPM:", updatedData.rpm);
    console.log("   - Estado:", updatedData.status);
    console.log("   - Horas de operación:", updatedData.totalOperatingHours);
    console.log("   - Último mantenimiento:", new Date(Number(updatedData.lastMaintenance) * 1000).toLocaleString());

    // 8. Obtener historial de mantenimiento
    console.log("\n📋 Historial de mantenimiento:");
    const maintenanceHistory = await industrialAssetNFT.getMaintenanceHistory(1);
    maintenanceHistory.forEach((note, index) => {
      console.log(`   ${index + 1}. ${note}`);
    });

    // 9. Verificar roles
    console.log("\n🔐 Verificación de roles:");
    console.log("   - Operator tiene rol OPERATOR:", await industrialAssetNFT.hasRoleForAsset(operator.address, await industrialAssetNFT.OPERATOR_ROLE()));
    console.log("   - Technician tiene rol TECHNICIAN:", await industrialAssetNFT.hasRoleForAsset(technician.address, await industrialAssetNFT.TECHNICIAN_ROLE()));
    console.log("   - User tiene rol OPERATOR:", await industrialAssetNFT.hasRoleForAsset(user.address, await industrialAssetNFT.OPERATOR_ROLE()));

    console.log("\n🎉 Interacción completada exitosamente!");

  } catch (error) {
    console.error("❌ Error durante la interacción:", error);
  }
}

// Ejecutar el script
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  }); 