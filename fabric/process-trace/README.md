# ProcessTrace Chaincode

Chaincode para el registro de trazabilidad de lotes de producción en Hyperledger Fabric.

## Funcionalidades principales
- Creación y gestión de lotes de producción
- Registro de entradas, salidas y transferencias de material
- Verificación de calidad con datos ambientales
- Eventos TraceRecorded con hashes y sellos de tiempo
- Historial completo de trazabilidad por lote

## Operaciones soportadas
- **CreateBatch**: Crear un nuevo lote de producción
- **RecordInput**: Registrar entrada de material
- **RecordOutput**: Registrar salida de material
- **RecordTransfer**: Registrar transferencia de material
- **RecordQualityCheck**: Registrar verificación de calidad
- **GetBatch**: Obtener información de un lote
- **GetTraceHistory**: Obtener historial de trazabilidad
- **GetAllBatches**: Listar todos los lotes

## Estructura de datos
### ProcessTrace
- `traceId`: Identificador único del registro
- `batchId`: ID del lote asociado
- `operation`: Tipo de operación (input/output/transfer/quality_check)
- `quantity`: Cantidad involucrada
- `fromLocation`/`toLocation`: Ubicaciones origen y destino
- `processId`: ID del proceso industrial
- `operator`: Operador responsable
- `timestamp`: Sello de tiempo
- `traceHash`: Hash para integridad
- `qualityData`: Datos de calidad (opcional)

### BatchInfo
- `batchId`: Identificador único del lote
- `materialType`: Tipo de material
- `supplier`: Proveedor
- `totalQuantity`/`currentQuantity`: Cantidades total y actual
- `status`: Estado del lote (active/completed/cancelled)

## Eventos
El chaincode emite eventos `TraceRecorded` con:
- traceId, batchId, operation, timestamp, traceHash

## Uso
1. Instalar dependencias: `npm install`
2. Compilar: `npm run build`
3. Desplegar en red Fabric

## Pruebas
- Ejecutar `npm test` para pruebas unitarias 