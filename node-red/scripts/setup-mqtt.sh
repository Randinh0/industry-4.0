#!/bin/bash

# Script de configuración para Mosquitto MQTT Broker
# Industry 4.0 - Task 3

echo "🔧 Configurando Mosquitto MQTT Broker para Industry 4.0..."

# Instalar Mosquitto
echo "📦 Instalando Mosquitto..."
sudo apt-get update
sudo apt-get install -y mosquitto mosquitto-clients

# Crear configuración personalizada
echo "⚙️ Creando configuración personalizada..."
sudo tee /etc/mosquitto/conf.d/industry4.0.conf > /dev/null <<EOF
# Configuración Industry 4.0
listener 1883
allow_anonymous true

# Configuración de persistencia
persistence true
persistence_location /var/lib/mosquitto/

# Configuración de logging
log_type all
log_dest file /var/log/mosquitto/mosquitto.log

# Configuración de seguridad básica
password_file /etc/mosquitto/passwd

# Configuración de tópicos
# industry4.0/plc/+/metrics - Métricas de PLCs
# industry4.0/plc/+/errors - Errores de PLCs
# industry4.0/plc/+/alerts - Alertas críticas
EOF

# Crear usuario para autenticación
echo "👤 Creando usuario MQTT..."
sudo mosquitto_passwd -c /etc/mosquitto/passwd industry4.0

# Configurar permisos
echo "🔐 Configurando permisos..."
sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
sudo chmod 600 /etc/mosquitto/passwd

# Reiniciar servicio
echo "🔄 Reiniciando servicio Mosquitto..."
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Verificar estado
echo "✅ Verificando estado del servicio..."
sudo systemctl status mosquitto --no-pager

echo "🎉 Mosquitto MQTT Broker configurado correctamente!"
echo "📋 Información de conexión:"
echo "   - Broker: localhost"
echo "   - Puerto: 1883"
echo "   - Usuario: industry4.0"
echo "   - Tópicos principales:"
echo "     * industry4.0/plc/+/metrics"
echo "     * industry4.0/plc/+/errors"
echo "     * industry4.0/plc/+/alerts" 