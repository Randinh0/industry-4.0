#!/bin/bash

# Script de configuración simplificado para Mosquitto MQTT Broker
# Industry 4.0 - Task 3

echo "🔧 Configurando Mosquitto MQTT Broker (versión simplificada)..."

# Verificar si Mosquitto está instalado
if ! command -v mosquitto &> /dev/null; then
    echo "📦 Instalando Mosquitto..."
    sudo apt-get update
    sudo apt-get install -y mosquitto mosquitto-clients
fi

# Crear configuración mínima
echo "⚙️ Creando configuración mínima..."
sudo tee /etc/mosquitto/conf.d/industry4.0-simple.conf > /dev/null <<EOF
# Configuración Industry 4.0 - Versión Simplificada
listener 1883
allow_anonymous true

# Configuración de logging
log_type all
log_dest file /var/log/mosquitto/mosquitto.log
EOF

# Crear directorios necesarios
echo "📁 Creando directorios..."
sudo mkdir -p /var/log/mosquitto
sudo chown mosquitto:mosquitto /var/log/mosquitto

# Reiniciar servicio
echo "🔄 Reiniciando servicio Mosquitto..."
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Verificar estado
echo "✅ Verificando estado del servicio..."
if systemctl is-active --quiet mosquitto; then
    echo "🎉 Mosquitto MQTT Broker configurado correctamente!"
    echo "📋 Información de conexión:"
    echo "   - Broker: localhost"
    echo "   - Puerto: 1883"
    echo "   - Autenticación: Anónima (para desarrollo)"
    echo "   - Tópicos principales:"
    echo "     * industry4.0/plc/+/metrics"
    echo "     * industry4.0/plc/+/errors"
    echo "     * industry4.0/plc/+/alerts"
else
    echo "❌ Error: Mosquitto no se pudo iniciar"
    sudo systemctl status mosquitto --no-pager
    exit 1
fi 