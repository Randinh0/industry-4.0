import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Desplegando ProductionTrace1155 (Modularizado)...");

  // Obtener el contrato factory
  const ProductionTrace1155 = await ethers.getContractFactory("ProductionTrace1155");
  
  // Desplegar el contrato
  const productionTrace = await ProductionTrace1155.deploy();
  await productionTrace.waitForDeployment();

  const address = await productionTrace.getAddress();
  console.log("✅ ProductionTrace1155 desplegado en:", address);

  // Obtener las cuentas para asignar roles
  const [deployer, ...signers] = await ethers.getSigners();
  
  console.log("👤 Deployer:", deployer.address);

  // Asignar roles a diferentes cuentas (para demostración)
  if (signers.length >= 4) {
    const [supplier, operator, qualityInspector, auditor] = signers;
    
    console.log("🔐 Asignando roles...");
    
    // Asignar roles usando any para evitar errores de tipos
    const contract = productionTrace as any;
    
    // Asignar rol de proveedor
    const supplierRole = await contract.SUPPLIER_ROLE();
    await contract.grantRole(supplierRole, supplier.address);
    console.log("   ✅ SUPPLIER_ROLE asignado a:", supplier.address);
    
    // Asignar rol de operador
    const operatorRole = await contract.OPERATOR_ROLE();
    await contract.grantRole(operatorRole, operator.address);
    console.log("   ✅ OPERATOR_ROLE asignado a:", operator.address);
    
    // Asignar rol de inspector de calidad
    const qualityRole = await contract.QUALITY_ROLE();
    await contract.grantRole(qualityRole, qualityInspector.address);
    console.log("   ✅ QUALITY_ROLE asignado a:", qualityInspector.address);
    
    // Asignar rol de auditor
    const auditorRole = await contract.AUDITOR_ROLE();
    await contract.grantRole(auditorRole, auditor.address);
    console.log("   ✅ AUDITOR_ROLE asignado a:", auditor.address);
  }

  console.log("\n📋 Información del contrato:");
  console.log("   Contrato: ProductionTrace1155 (Modularizado)");
  console.log("   Dirección:", address);
  console.log("   Red:", (await ethers.provider.getNetwork()).name);
  console.log("   Deployer:", deployer.address);

  console.log("\n🏗️  Arquitectura modular:");
  console.log("   ✅ ProductionBatch1155 - Gestión de lotes ERC-1155");
  console.log("   ✅ TraceabilityModule - Trazabilidad y historial");
  console.log("   ✅ QualityModule - Control de calidad");
  console.log("   ✅ ProductionTrace1155 - Contrato principal unificado");

  console.log("\n🎯 Funcionalidades implementadas:");
  console.log("   ✅ Creación de lotes de materia prima");
  console.log("   ✅ Registro de entrada/salida de materiales");
  console.log("   ✅ Trazabilidad completa con historial");
  console.log("   ✅ Control de calidad con datos ambientales");
  console.log("   ✅ División y fusión de lotes");
  console.log("   ✅ Verificación de integridad de registros");
  console.log("   ✅ Estadísticas de trazabilidad");
  console.log("   ✅ Firmas EIP-712 para operaciones seguras");
  console.log("   ✅ Sistema de roles y permisos");

  console.log("\n🔗 Para interactuar con el contrato:");
  console.log(`   npx hardhat console --network ${(await ethers.provider.getNetwork()).name}`);
  console.log(`   const contract = await ethers.getContractAt("ProductionTrace1155", "${address}")`);

  return address;
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  main()
    .then((address) => {
      console.log("\n🎉 ¡Despliegue completado exitosamente!");
      console.log("   Dirección del contrato:", address);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error durante el despliegue:", error);
      process.exit(1);
    });
}

export { main }; 