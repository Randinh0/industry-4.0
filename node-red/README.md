# Tarea 3: Integración Modbus-TCP con Node-RED

## 📋 Descripción

Esta tarea implementa la integración completa de Node-RED como gateway IoT para comunicación con PLCs industriales mediante protocolo Modbus-TCP, capturando y transmitiendo métricas operativas en tiempo real.

## 🏗️ Arquitectura

```
[PLC Industrial] ←→ [Modbus-TCP] ←→ [Node-RED] ←→ [MQTT Broker] ←→ [Sistema Backend]
                                    ↓
                              [Dashboard Web]
```

## 📦 Componentes Instalados

### Node-RED y Nodos
- `node-red` - Core de Node-RED
- `node-red-contrib-modbus` - Nodos para comunicación Modbus
- `node-red-contrib-ethers` - Integración con Ethereum
- `node-red-contrib-mqtt-broker` - Broker MQTT integrado
- `node-red-dashboard` - Dashboard web

### Dependencias de Prueba
- `modbus-serial` - Cliente Modbus para pruebas
- `mqtt` - Cliente MQTT para pruebas

## 🚀 Instalación y Configuración

### 1. Instalar Mosquitto MQTT Broker

```bash
# Ejecutar script de configuración
./node-red/scripts/setup-mqtt.sh
```

### 2. Iniciar Node-RED

```bash
# Ejecutar script de inicio
./node-red/scripts/start-nodered.sh
```

### 3. Simulador Modbus (Opcional)

```bash
# Iniciar simulador para pruebas
node node-red/scripts/modbus-simulator.js
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Node-RED
export NODE_RED_USER="admin"
export NODE_RED_PASS="admin123"
export NODE_RED_CREDENTIAL_SECRET="industry4.0-secret-key-2024"

# MQTT
export MQTT_BROKER="localhost"
export MQTT_PORT="1883"

# Ethereum
export ETHEREUM_NETWORK="localhost"
export ETHEREUM_RPC_URL="http://localhost:8545"
```

### Configuración de PLC

En el flujo de Node-RED, actualiza la configuración del nodo Modbus:

- **Host**: IP del PLC (ej: `192.168.1.100`)
- **Puerto**: `502` (puerto estándar Modbus-TCP)
- **Unit ID**: `1`
- **Intervalo de polling**: `5` segundos

## 📊 Flujo de Node-RED

### Nodos Principales

1. **Modbus Server Config** - Configuración de conexión al PLC
2. **Read Holding Registers** - Lectura de registros Modbus
3. **Data Transformer** - Transformación de datos a JSON
4. **MQTT Publisher** - Publicación en broker MQTT
5. **Ethereum Signer** - Firma de transacciones blockchain
6. **Error Handler** - Manejo de errores y reconexión

### Tópicos MQTT

- `industry4.0/plc/001/metrics` - Métricas operativas
- `industry4.0/plc/001/errors` - Errores y alertas
- `industry4.0/plc/001/alerts` - Alertas críticas

### Estructura de Datos

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deviceId": "PLC-001",
  "location": "Planta Principal",
  "metrics": {
    "status": 1,
    "temperature": 75.0,
    "rpm": 1800,
    "pressure": 25.0,
    "flowRate": 120.0,
    "vibration": 3.0,
    "powerConsumption": 45.0,
    "efficiency": 85.0,
    "maintenanceHours": 1250,
    "errorCode": 0,
    "quality": 92.0
  },
  "alerts": []
}
```

## 🧪 Pruebas

### Ejecutar Pruebas de Integración

```bash
# Ejecutar suite completa de pruebas
node node-red/scripts/test-integration.js
```

### Pruebas Manuales

1. **Verificar Modbus-TCP**:
   ```bash
   # Conectar al simulador
   node -e "
   const ModbusRTU = require('modbus-serial');
   const client = new ModbusRTU();
   client.connectTCP('localhost', {port: 502})
     .then(() => client.readHoldingRegisters(0, 5))
     .then(data => console.log('Registros:', data.data))
     .catch(console.error);
   "
   ```

2. **Verificar MQTT**:
   ```bash
   # Suscribirse a tópicos
   mosquitto_sub -h localhost -t "industry4.0/plc/+/metrics"
   ```

3. **Verificar Node-RED**:
   - Abrir: http://localhost:1880
   - Usuario: `admin`
   - Contraseña: `admin123`

## 📈 Dashboard

### Acceso al Dashboard

- **URL**: http://localhost:1880/ui
- **Credenciales**: admin/admin123

### Widgets Disponibles

- **Gauge de Temperatura** - Visualización en tiempo real
- **Gráficos de Rendimiento** - Histórico de métricas
- **Panel de Alertas** - Estado de alertas críticas
- **Indicadores de Estado** - Estado de conexiones

## 🔒 Seguridad

### Configuraciones Implementadas

- **Autenticación MQTT**: Usuario/contraseña configurados
- **TLS/SSL**: Configurable para comunicación segura
- **Credenciales Node-RED**: Protección de acceso web
- **Validación de Datos**: Verificación de integridad

### Recomendaciones

1. Cambiar contraseñas por defecto
2. Configurar certificados SSL/TLS
3. Implementar firewall para puertos Modbus
4. Usar VPN para conexiones remotas

## 🐛 Solución de Problemas

### Errores Comunes

1. **Conexión Modbus rechazada**:
   - Verificar IP y puerto del PLC
   - Comprobar firewall
   - Verificar configuración de red

2. **MQTT no conecta**:
   - Verificar que Mosquitto esté ejecutándose
   - Comprobar puerto 1883
   - Verificar credenciales

3. **Node-RED no inicia**:
   - Verificar puerto 1880 disponible
   - Comprobar permisos de directorio
   - Revisar logs de error

### Logs y Debugging

```bash
# Logs de Node-RED
tail -f node-red/data/node-red.log

# Logs de Mosquitto
sudo tail -f /var/log/mosquitto/mosquitto.log

# Verificar puertos
netstat -tlnp | grep -E ':(1880|1883|502)'
```

## 📚 Recursos Adicionales

### Documentación
- [Node-RED Documentation](https://nodered.org/docs/)
- [Modbus Protocol](https://modbus.org/specs.php)
- [MQTT Specification](https://mqtt.org/specification/)

### Herramientas de Desarrollo
- [ModbusPal](http://www.modbuspal.sourceforge.net/) - Simulador Modbus
- [MQTT Explorer](http://mqtt-explorer.com/) - Cliente MQTT visual
- [Node-RED Dashboard](https://flows.nodered.org/node/node-red-dashboard)

## ✅ Criterios de Aceptación

- [x] Node-RED instalado y configurado
- [x] Nodos Modbus-TCP funcionando
- [x] Integración MQTT operativa
- [x] Dashboard web disponible
- [x] Manejo de errores implementado
- [x] Reconexión automática configurada
- [x] Pruebas de integración pasando
- [x] Documentación completa

## 🔄 Próximos Pasos

1. Integrar con contratos inteligentes Ethereum
2. Implementar persistencia de datos
3. Configurar alertas avanzadas
4. Optimizar rendimiento para múltiples PLCs
5. Implementar autenticación robusta 