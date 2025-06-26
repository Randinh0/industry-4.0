# ProductionTrace1155 - Contrato ERC-1155 para Trazabilidad Industrial

## Descripción General

El contrato `ProductionTrace1155` es una implementación ERC-1155 especializada para la trazabilidad de lotes de materia prima en procesos industriales. Permite registrar entradas y salidas de materiales con metadatos detallados, control de calidad y un sistema completo de trazabilidad.

## Características Principales

### 🏭 Gestión de Lotes
- **Creación de lotes**: Cada lote tiene un ID único y metadatos completos
- **Metadatos extendidos**: Incluye tipo de material, proveedor, fechas, ubicación, etc.
- **Control de calidad**: Datos ambientales y resultados de inspección
- **Estados del lote**: Disponible, en proceso, consumido

### 📊 Trazabilidad Completa
- **Registro de operaciones**: Entrada (input) y salida (output) de materiales
- **Historial completo**: Todas las operaciones quedan registradas
- **Verificación de integridad**: Hash criptográfico para cada registro
- **Estadísticas**: Conteo de operaciones por tipo

### 🔐 Seguridad y Permisos
- **Sistema de roles**: SUPPLIER, OPERATOR, QUALITY, AUDITOR
- **Firmas EIP-712**: Operaciones seguras con firmas digitales
- **Control de acceso**: Solo usuarios autorizados pueden realizar operaciones
- **Prevención de replay**: Nonces únicos para cada operación

### 🔄 Operaciones Avanzadas
- **División de lotes**: Dividir un lote en múltiples lotes más pequeños
- **Fusión de lotes**: Combinar lotes del mismo tipo de material
- **Transferencias**: Movimiento de tokens entre direcciones

## Estructuras de Datos

### BatchMetadata
```solidity
struct BatchMetadata {
    string batchId;           // ID único del lote
    string materialType;      // Tipo de material (acero, plástico, etc.)
    string supplier;          // Proveedor del material
    uint256 productionDate;   // Fecha de producción
    uint256 expiryDate;       // Fecha de caducidad
    string qualityGrade;      // Grado de calidad (A, B, C, etc.)
    uint256 quantity;         // Cantidad total del lote
    string unit;              // Unidad de medida (kg, ton, etc.)
    string location;          // Ubicación actual
    string status;            // Estado del lote
    string certificate;       // Certificado de calidad
    bool isCertified;         // Si está certificado
}
```

### TraceRecord
```solidity
struct TraceRecord {
    uint256 timestamp;        // Timestamp del registro
    string operation;         // Tipo de operación (input, output, transfer)
    uint256 quantity;         // Cantidad involucrada
    string fromLocation;      // Ubicación origen
    string toLocation;        // Ubicación destino
    string processId;         // ID del proceso industrial
    string operator;          // Operador responsable
    string notes;             // Notas adicionales
    bytes32 traceHash;        // Hash del registro para integridad
}
```

### QualityData
```solidity
struct QualityData {
    uint256 temperature;      // Temperatura de almacenamiento
    uint256 humidity;         // Humedad relativa
    uint256 pressure;         // Presión ambiental
    string qualityStatus;     // Estado de calidad
    uint256 lastInspection;   // Última inspección
    string inspector;         // Inspector responsable
    bool meetsSpecifications; // Cumple especificaciones
    string testResults;       // Resultados de pruebas
}
```

## Funciones Principales

### Creación y Gestión de Lotes

#### `createBatch`
```solidity
function createBatch(
    address to,
    string memory batchId,
    string memory materialType,
    string memory supplier,
    uint256 quantity,
    string memory unit,
    string memory location,
    string memory qualityGrade,
    uint256 expiryDate,
    string memory certificate
) public onlyRole(SUPPLIER_ROLE) returns (uint256)
```
Crea un nuevo lote de materia prima con todos sus metadatos.

### Trazabilidad

#### `recordInput`
```solidity
function recordInput(
    uint256 tokenId,
    uint256 quantity,
    string memory fromLocation,
    string memory toLocation,
    string memory processId,
    string memory notes
) public onlyRole(OPERATOR_ROLE)
```
Registra la entrada de material a un proceso industrial.

#### `recordOutput`
```solidity
function recordOutput(
    uint256 tokenId,
    uint256 quantity,
    string memory fromLocation,
    string memory toLocation,
    string memory processId,
    string memory notes
) public onlyRole(OPERATOR_ROLE)
```
Registra la salida de material de un proceso industrial.

#### `recordTraceWithSignature`
```solidity
function recordTraceWithSignature(
    uint256 tokenId,
    string memory operation,
    uint256 quantity,
    string memory fromLocation,
    string memory toLocation,
    string memory processId,
    string memory notes,
    bytes memory signature
) public
```
Registra trazabilidad usando firmas EIP-712 para mayor seguridad.

### Control de Calidad

#### `updateQualityData`
```solidity
function updateQualityData(
    uint256 tokenId,
    uint256 temperature,
    uint256 humidity,
    uint256 pressure,
    string memory qualityStatus,
    string memory inspector,
    bool meetsSpecifications,
    string memory testResults
) public onlyRole(QUALITY_ROLE)
```
Actualiza los datos de calidad de un lote.

### Operaciones Avanzadas

#### `splitBatch`
```solidity
function splitBatch(
    uint256 tokenId,
    uint256 quantity,
    string memory newBatchId
) public onlyRole(OPERATOR_ROLE) returns (uint256)
```
Divide un lote en dos lotes más pequeños.

#### `mergeBatches`
```solidity
function mergeBatches(
    uint256 tokenId1,
    uint256 tokenId2
) public onlyRole(OPERATOR_ROLE)
```
Fusiona dos lotes del mismo tipo de material.

### Consultas

#### `getTraceHistory`
```solidity
function getTraceHistory(uint256 tokenId) public view returns (TraceRecord[] memory)
```
Obtiene el historial completo de trazabilidad de un lote.

#### `getBatchMetadata`
```solidity
function getBatchMetadata(uint256 tokenId) public view returns (BatchMetadata memory)
```
Obtiene los metadatos de un lote.

#### `getQualityData`
```solidity
function getQualityData(uint256 tokenId) public view returns (QualityData memory)
```
Obtiene los datos de calidad de un lote.

#### `getTraceStatistics`
```solidity
function getTraceStatistics(uint256 tokenId) public view returns (
    uint256 totalRecords,
    uint256 inputRecords,
    uint256 outputRecords,
    uint256 transferRecords,
    uint256 firstRecord,
    uint256 lastRecord
)
```
Obtiene estadísticas de trazabilidad de un lote.

#### `verifyTraceIntegrity`
```solidity
function verifyTraceIntegrity(uint256 tokenId, uint256 traceIndex) public view returns (bool)
```
Verifica la integridad de un registro de trazabilidad específico.

## Eventos

### Eventos de Lotes
- `BatchCreated`: Emitido al crear un nuevo lote
- `BatchTransferred`: Emitido al transferir tokens
- `BatchConsumed`: Emitido al consumir material
- `BatchSplit`: Emitido al dividir un lote
- `BatchMerged`: Emitido al fusionar lotes

### Eventos de Trazabilidad
- `TraceRecorded`: Emitido al registrar cualquier operación de trazabilidad

### Eventos de Calidad
- `QualityDataUpdated`: Emitido al actualizar datos de calidad

## Roles del Sistema

### SUPPLIER_ROLE
- Crear nuevos lotes de materia prima
- Asignar metadatos iniciales

### OPERATOR_ROLE
- Registrar entradas y salidas de material
- Dividir y fusionar lotes
- Realizar transferencias

### QUALITY_ROLE
- Actualizar datos de calidad
- Registrar resultados de inspección

### AUDITOR_ROLE
- Consultar todos los datos
- Verificar integridad de registros

### DEFAULT_ADMIN_ROLE
- Gestionar roles del sistema
- Configuraciones administrativas

## Casos de Uso

### 1. Cadena de Suministro Industrial
```
Proveedor → Almacén → Línea de Producción → Producto Terminado
```

### 2. Control de Calidad
```
Inspección Inicial → Monitoreo Continuo → Inspección Final
```

### 3. Trazabilidad de Lotes
```
Lote Original → División → Procesamiento → Fusión → Consumo
```

## Seguridad

### Firmas EIP-712
El contrato soporta firmas EIP-712 para operaciones seguras sin necesidad de transacciones directas.

### Prevención de Replay
Cada dirección tiene un nonce único que se incrementa con cada operación firmada.

### Verificación de Integridad
Cada registro de trazabilidad incluye un hash criptográfico que permite verificar su integridad.

## Despliegue y Uso

### Compilación
```bash
npx hardhat compile
```

### Despliegue
```bash
npx hardhat run scripts/deploy-production-trace.ts --network <red>
```

### Pruebas
```bash
npx hardhat test test/ProductionTrace1155.test.ts
```

## Integración con Industria 4.0

Este contrato está diseñado para integrarse con sistemas IoT y MES (Manufacturing Execution Systems) para proporcionar trazabilidad completa en tiempo real de los procesos industriales.

### APIs Recomendadas
- Lectura de sensores IoT para datos ambientales
- Integración con sistemas MES para procesos industriales
- Conectores con sistemas ERP para gestión de inventarios
- Dashboards en tiempo real para monitoreo

## Licencia

MIT License - Ver archivo LICENSE para más detalles. 