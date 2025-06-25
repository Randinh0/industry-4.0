import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Iniciando despliegue de contratos de prueba...");

  // Obtener la cuenta de despliegue
  const [deployer] = await ethers.getSigners();
  console.log("📝 Desplegando contratos con la cuenta:", deployer.address);
  console.log("💰 Balance de la cuenta:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Aquí se desplegarán los contratos cuando estén listos
  console.log("✅ Configuración de Hardhat completada correctamente");
  console.log("📋 Próximos pasos:");
  console.log("   1. Crear contratos ERC-721 para tokenización de activos");
  console.log("   2. Crear contratos de mantenimiento automatizado");
  console.log("   3. Crear contratos de financiamiento colectivo");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error durante el despliegue:", error);
    process.exit(1);
  }); 