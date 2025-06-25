#!/bin/bash

# Script de instalación completa para Tarea 3: Integración Modbus-TCP con Node-RED
# Industry 4.0 - Task 3

set -e  # Salir en caso de error

echo "🏭 ========================================="
echo "   Industry 4.0 - Tarea 3"
echo "   Integración Modbus-TCP con Node-RED"
echo "========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Este script debe ejecutarse desde el directorio raíz del proyecto Industry 4.0"
    exit 1
fi

# Verificar permisos de sudo
if ! sudo -n true 2>/dev/null; then
    log_warning "Se requerirán permisos de sudo para algunas operaciones"
fi

log_info "Iniciando instalación de la Tarea 3..."

# Paso 1: Instalar Node-RED globalmente
log_info "Paso 1/6: Instalando Node-RED..."
if command -v node-red &> /dev/null; then
    log_success "Node-RED ya está instalado"
else
    sudo npm install -g node-red
    log_success "Node-RED instalado correctamente"
fi

# Paso 2: Instalar dependencias del proyecto
log_info "Paso 2/6: Instalando dependencias del proyecto..."
npm install node-red-contrib-modbus node-red-contrib-ethers node-red-contrib-mqtt-broker node-red-dashboard modbus-serial mqtt
log_success "Dependencias instaladas correctamente"

# Paso 3: Configurar Mosquitto MQTT Broker
log_info "Paso 3/6: Configurando Mosquitto MQTT Broker..."
if [ -f "node-red/scripts/setup-mqtt.sh" ]; then
    chmod +x node-red/scripts/setup-mqtt.sh
    ./node-red/scripts/setup-mqtt.sh
    log_success "Mosquitto MQTT Broker configurado"
else
    log_error "Script de configuración MQTT no encontrado"
    exit 1
fi

# Paso 4: Crear directorios necesarios
log_info "Paso 4/6: Creando estructura de directorios..."
mkdir -p node-red/data
mkdir -p node-red/logs
mkdir -p node-red/flows
log_success "Estructura de directorios creada"

# Paso 5: Configurar permisos de scripts
log_info "Paso 5/6: Configurando permisos de scripts..."
chmod +x node-red/scripts/*.sh
chmod +x node-red/scripts/*.js
log_success "Permisos configurados"

# Paso 6: Verificar instalación
log_info "Paso 6/6: Verificando instalación..."

# Verificar Node-RED
if command -v node-red &> /dev/null; then
    log_success "Node-RED: OK"
else
    log_error "Node-RED: FALLO"
    exit 1
fi

# Verificar Mosquitto
if systemctl is-active --quiet mosquitto; then
    log_success "Mosquitto: OK"
else
    log_warning "Mosquitto: No está ejecutándose (se iniciará automáticamente)"
fi

# Verificar puertos
log_info "Verificando puertos..."
if netstat -tlnp 2>/dev/null | grep -q ":1883 "; then
    log_success "Puerto MQTT (1883): OK"
else
    log_warning "Puerto MQTT (1883): No disponible"
fi

if netstat -tlnp 2>/dev/null | grep -q ":502 "; then
    log_success "Puerto Modbus (502): OK"
else
    log_warning "Puerto Modbus (502): No disponible (se usará simulador)"
fi

echo ""
echo "🎉 ========================================="
echo "   INSTALACIÓN COMPLETADA EXITOSAMENTE"
echo "========================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Iniciar Node-RED:"
echo "   ./node-red/scripts/start-nodered.sh"
echo ""
echo "2. (Opcional) Iniciar simulador Modbus:"
echo "   node node-red/scripts/modbus-simulator.js"
echo ""
echo "3. Ejecutar pruebas de integración:"
echo "   node node-red/scripts/test-integration.js"
echo ""
echo "4. Acceder al dashboard:"
echo "   http://localhost:1880"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "5. Ver documentación completa:"
echo "   cat node-red/README.md"
echo ""
echo "🔧 Configuración adicional:"
echo "   - Editar node-red/settings.js para personalizar"
echo "   - Modificar node-red/flows/modbus-tcp-flow.json para ajustar flujo"
echo "   - Configurar variables de entorno según necesidades"
echo ""
echo "📚 Recursos:"
echo "   - README: node-red/README.md"
echo "   - Logs: node-red/data/node-red.log"
echo "   - Configuración: node-red/settings.js"
echo ""
log_success "¡Tarea 3 lista para usar!" 