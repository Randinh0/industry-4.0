# AssetRegistry Chaincode

Chaincode para la tokenización y trazabilidad de activos industriales en Hyperledger Fabric.

## Funcionalidades principales
- Registro inmutable de activos físicos
- CRUD completo (crear, leer, actualizar, eliminar)
- Metadatos IoT asociados a cada activo

## Estructura de datos
- `assetId`: Identificador único
- `owner`: Propietario
- `location`: Ubicación
- `type`: Tipo de activo
- `metadataIoT`: Metadatos IoT (JSON)
- `createdAt`, `updatedAt`: Timestamps

## Uso
1. Instalar dependencias: `npm install`
2. Compilar: `npm run build`
3. Desplegar en red Fabric siguiendo la documentación oficial

## Pruebas
- Ejecutar `npm test` para pruebas unitarias 