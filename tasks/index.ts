import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("accounts", "Imprime la lista de cuentas disponibles")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const accounts = await hre.ethers.getSigners();
    
    console.log("📋 Cuentas disponibles:");
    for (let i = 0; i < accounts.length; i++) {
      const balance = await hre.ethers.provider.getBalance(accounts[i].address);
      console.log(`  ${i}: ${accounts[i].address} (${hre.ethers.formatEther(balance)} ETH)`);
    }
  });

task("balance", "Imprime el balance de una cuenta")
  .addParam("account", "La dirección de la cuenta")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(`💰 Balance de ${taskArgs.account}: ${hre.ethers.formatEther(balance)} ETH`);
  });

task("network", "Imprime información de la red actual")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const network = await hre.ethers.provider.getNetwork();
    console.log(`🌐 Red actual: ${network.name} (Chain ID: ${network.chainId})`);
  });

task("compile:check", "Verifica la compilación sin generar artifacts")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log("🔍 Verificando compilación de contratos...");
    try {
      await hre.run("compile");
      console.log("✅ Compilación exitosa");
    } catch (error) {
      console.error("❌ Error en la compilación:", error);
      throw error;
    }
  }); 