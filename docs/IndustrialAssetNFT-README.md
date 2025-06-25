# IndustrialAssetNFT - Contrato ERC-721 para Tokenización de Activos Industriales

## Descripción

El contrato `IndustrialAssetNFT` es una implementación de ERC-721 que permite la tokenización de activos industriales con capacidades avanzadas de gestión de metadatos operativos on-chain. Está diseñado específicamente para entornos de Industria 4.0 donde se requiere un seguimiento preciso del estado y mantenimiento de maquinaria industrial.

## Características Principales

### 🏷️ Tokenización de Activos
- Implementación completa del estándar ERC-721
- Metadatos extensibles mediante URI
- Identificación única de cada activo industrial

### 🔧 Gestión de Roles
- **OWNER_ROLE**: Propietario del contrato, puede acuñar tokens y asignar roles
- **OPERATOR_ROLE**: Operadores que pueden actualizar datos operativos
- **TECHNICIAN_ROLE**: Técnicos que pueden registrar mantenimiento

### 📊 Datos Operativos On-Chain
- Temperatura actual del activo
- RPM (Revoluciones por minuto)
- Estado operativo (Operativo/Mantenimiento/Inactivo)
- Horas totales de operación
- Timestamp del último mantenimiento

### 📋 Historial de Mantenimiento
- Registro cronológico de actividades de mantenimiento
- Notas detalladas de cada intervención
- Actualización automática del timestamp de último mantenimiento

## Estructura del Contrato

### Variables de Estado
```solidity
struct OperationalData {
    uint256 temperature;
    uint256 rpm;
    uint256 lastMaintenance;
    uint256 totalOperatingHours;
    string status;
}

mapping(uint256 => OperationalData) public operationalData;
mapping(uint256 => string[]) public maintenanceHistory;
```

### Eventos
- `AssetMinted`: Emitido cuando se acuña un nuevo activo
- `OperationalDataUpdated`: Emitido cuando se actualizan datos operativos
- `MaintenanceRecorded`: Emitido cuando se registra mantenimiento
- `RoleAssigned`: Emitido cuando se asigna un rol

## Funciones Principales

### Acuñación de Activos
```solidity
function mintAsset(
    address to,
    string memory tokenURI,
    string memory assetName,
    uint256 initialTemp,
    uint256 initialRpm
) public onlyRole(OWNER_ROLE) returns (uint256)
```

### Gestión de Datos Operativos
```solidity
function updateOperationalData(
    uint256 tokenId,
    uint256 temperature,
    uint256 rpm,
    string memory status
) public onlyRole(OPERATOR_ROLE)
```

### Registro de Mantenimiento
```solidity
function recordMaintenance(
    uint256 tokenId,
    string memory maintenanceNote
) public onlyRole(TECHNICIAN_ROLE)
```

### Consulta de Datos
```solidity
function getOperationalData(uint256 tokenId) 
    public view returns (OperationalData memory)

function getMaintenanceHistory(uint256 tokenId) 
    public view returns (string[] memory)
```

## Estructura de Metadatos

Los metadatos de cada activo siguen el estándar JSON especificado:

```json
{
  "name": "[Nombre del activo]",
  "description": "[Descripción]",
  "image": "[IPFS URI]",
  "attributes": [
    {"trait_type": "Tipo", "value": "[Tipo de maquinaria]"},
    {"trait_type": "Modelo", "value": "[Modelo]"},
    {"trait_type": "Estado", "value": "[Operativo/Mantenimiento/Inactivo]"}
  ],
  "operationalData": {
    "temperature": 0,
    "rpm": 0,
    "lastMaintenance": 0,
    "totalOperatingHours": 0
  }
}
```

## Flujo de Trabajo Típico

1. **Despliegue**: El propietario despliega el contrato
2. **Asignación de Roles**: Se asignan roles a operadores y técnicos
3. **Acuñación**: Se acuñan tokens para cada activo industrial
4. **Monitoreo**: Los operadores actualizan datos operativos regularmente
5. **Mantenimiento**: Los técnicos registran actividades de mantenimiento
6. **Consulta**: Se consultan datos para análisis y toma de decisiones

## Seguridad

### Control de Acceso
- Todas las funciones críticas están protegidas por roles
- Solo el propietario puede acuñar tokens y asignar roles
- Validación de existencia de tokens antes de operaciones

### Optimización de Gas
- Uso eficiente de storage
- Limpieza de datos al quemar tokens
- Eventos para indexación off-chain

## Testing

### Tests Unitarios
- Verificación de acuñación correcta
- Validación de permisos y roles
- Comprobación de actualización de datos
- Verificación de eventos emitidos

### Tests de Integración
- Flujo completo de trabajo
- Interacción con metadatos IPFS
- Optimización de gas

## Deployment

### Requisitos
- Solidity ^0.8.20
- OpenZeppelin Contracts ^5.3.0
- Hardhat para desarrollo y testing

### Comandos
```bash
# Compilar
npm run compile

# Ejecutar tests
npm run test

# Deploy en red local
npm run deploy:local

# Deploy en red específica
npx hardhat run scripts/deploy-industrial-asset.ts --network <network>
```

## Uso con IPFS

Para almacenar metadatos extensos:

1. Crear archivo JSON con metadatos
2. Subir a IPFS usando pinata.cloud o ipfs.io
3. Usar el hash IPFS como tokenURI al acuñar

### Ejemplo de Metadatos IPFS
```json
{
  "name": "Motor Industrial Siemens 7ML1200",
  "description": "Motor eléctrico trifásico de alta eficiencia...",
  "image": "ipfs://QmXyZ1234567890abcdefghijklmnopqrstuvwxyz",
  "attributes": [...],
  "operationalData": {...},
  "specifications": {...},
  "warranty": {...}
}
```

## Compatibilidad

- **ERC-721**: Implementación completa del estándar
- **OpenSea**: Compatible con marketplaces NFT
- **MetaMask**: Soporte completo para wallets
- **IPFS**: Integración nativa para metadatos

## Roadmap

- [ ] Implementación de oráculos para datos IoT en tiempo real
- [ ] Integración con sistemas de mantenimiento predictivo
- [ ] Soporte para múltiples tipos de activos
- [ ] Dashboard web para gestión de activos
- [ ] Integración con sistemas ERP industriales

## Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama para tu feature
3. Implementar cambios con tests
4. Crear Pull Request

## Licencia

MIT License - Ver archivo LICENSE para detalles. 