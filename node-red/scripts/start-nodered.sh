#!/bin/bash

# Script de inicio para Node-RED
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
fi

# Verificar que el directorio de datos existe
if [ ! -d "$NODE_RED_HOME/data" ]; then
    echo "📁 Creando directorio de datos..."
    mkdir -p "$NODE_RED_HOME/data"
fi

# Copiar configuración si no existe
if [ ! -f "$NODE_RED_HOME/data/settings.js" ]; then
    echo "⚙️ Copiando configuración..."
    cp "$NODE_RED_HOME/settings.js" "$NODE_RED_HOME/data/"
fi

# Iniciar Node-RED
echo "🎯 Iniciando Node-RED..."
echo "📊 Dashboard disponible en: http://localhost:1880"
echo "🔑 Usuario: admin"
echo "🔑 Contraseña: admin123"

cd "$NODE_RED_HOME"
node-red --userDir ./data --settings ./settings.js 