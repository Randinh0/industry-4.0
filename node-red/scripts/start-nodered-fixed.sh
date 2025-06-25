#!/bin/bash

# Script de inicio para Node-RED (Versión Corregida)
# Industry 4.0 - Task 3

echo "🚀 Iniciando Node-RED para Industry 4.0..."

# Variables de entorno
export NODE_RED_HOME="/home/rand/Desktop/Industry 4.0/node-red"
export NODE_RED_USER="admin"
export NODE_RED_PASS="admin123"
export NODE_RED_CREDENTIAL_SECRET="industry4.0-secret-key-2024"

# Configuración de MQTT
export MQTT_BROKER="localhost"
export MQTT_PORT="1883"

# Configuración de Ethereum
export ETHEREUM_NETWORK="localhost"
export ETHEREUM_RPC_URL="http://localhost:8545"

# Verificar que Mosquitto esté ejecutándose
echo "🔍 Verificando estado de Mosquitto..."
if ! systemctl is-active --quiet mosquitto; then
    echo "⚠️ Mosquitto no está ejecutándose. Iniciando..."
    sudo systemctl start mosquitto
    sleep 2
fi

if systemctl is-active --quiet mosquitto; then
    echo "✅ Mosquitto está ejecutándose correctamente"
else
    echo "❌ Error: Mosquitto no se pudo iniciar"
    exit 1
fi

# Verificar que el directorio de datos existe
if [ ! -d "$NODE_RED_HOME/data" ]; then
    echo "📁 Creando directorio de datos..."
    mkdir -p "$NODE_RED_HOME/data"
fi

# Crear configuración simplificada para Node-RED
echo "⚙️ Creando configuración de Node-RED..."
cat > "$NODE_RED_HOME/data/settings.js" << 'EOF'
module.exports = {
    // Configuración del servidor HTTP
    uiPort: process.env.PORT || 1880,
    
    // Configuración de seguridad
    httpNodeAuth: {
        user: process.env.NODE_RED_USER || "admin",
        pass: process.env.NODE_RED_PASS || "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN."
    },
    
    // Configuración de credenciales
    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "industry4.0-secret-key",
    
    // Configuración de logging
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },
    
    // Configuración de editor
    editorTheme: {
        projects: {
            enabled: false
        }
    },
    
    // Configuración de función global
    functionGlobalContext: {
        // Variables globales para el proyecto
        projectName: "Industry 4.0",
        version: "1.0.0",
        mqttBroker: process.env.MQTT_BROKER || "localhost",
        mqttPort: process.env.MQTT_PORT || 1883,
        ethereumNetwork: process.env.ETHEREUM_NETWORK || "localhost",
        ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || "http://localhost:8545"
    },
    
    // Configuración de persistencia
    storageModule: require("node-red/storage/localfilesystem"),
    
    // Configuración de directorios
    userDir: "./",
    flowFile: "flows.json"
};
EOF

# Iniciar Node-RED
echo "🎯 Iniciando Node-RED..."
echo "📊 Dashboard disponible en: http://localhost:1880"
echo "🔑 Usuario: admin"
echo "🔑 Contraseña: admin123"

cd "$NODE_RED_HOME/data"
node-red 