import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Iniciando deployment del contrato IndustrialAssetNFT...");

  // Obtener el contrato factory
  const IndustrialAssetNFT = await ethers.getContractFactory("IndustrialAssetNFT");
  
  // Deploy del contrato
  const industrialAssetNFT = await IndustrialAssetNFT.deploy();
  
  // Esperar a que se confirme el deployment
  await industrialAssetNFT.waitForDeployment();
  
  const address = await industrialAssetNFT.getAddress();
  
  console.log("✅ Contrato IndustrialAssetNFT desplegado en:", address);
  console.log("📋 Detalles del contrato:");
  console.log("   - Nombre:", await industrialAssetNFT.name());
  console.log("   - Símbolo:", await industrialAssetNFT.symbol());
  console.log("   - Owner:", await industrialAssetNFT.hasRole(await industrialAssetNFT.OWNER_ROLE(), (await ethers.getSigners())[0].address));
  
  console.log("\n🔧 Roles disponibles:");
  console.log("   - OPERATOR_ROLE:", await industrialAssetNFT.OPERATOR_ROLE());
  console.log("   - TECHNICIAN_ROLE:", await industrialAssetNFT.TECHNICIAN_ROLE());
  console.log("   - OWNER_ROLE:", await industrialAssetNFT.OWNER_ROLE());
  
  console.log("\n📝 Para verificar el contrato en Etherscan, usa:");
  console.log(`   npx hardhat verify --network <network> ${address}`);
  
  return address;
}

// Ejecutar el script
main()
  .then((address) => {
    console.log("\n🎉 Deployment completado exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error durante el deployment:", error);
    process.exit(1);
  }); 