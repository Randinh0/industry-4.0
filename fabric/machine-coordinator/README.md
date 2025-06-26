# MachineCoordinator Chaincode

Chaincode para la orquestación de máquinas industriales y verificación de SLA en Hyperledger Fabric.

## Funcionalidades principales
- Registro y gestión de máquinas industriales
- Control de estados: start/pause/resume/stop
- Verificación automática de SLA basada en métricas de rendimiento
- Programación de mantenimiento preventivo y correctivo
- Historial completo de transiciones de estado
- Eventos en tiempo real para cambios de estado

## Operaciones de control de máquinas
- **RegisterMachine**: Registrar una nueva máquina
- **StartMachine**: Iniciar máquina (start)
- **PauseMachine**: Pausar máquina (pause)
- **ResumeMachine**: Reanudar máquina (resume)
- **StopMachine**: Detener máquina (stop)
- **UpdatePerformanceMetrics**: Actualizar métricas de rendimiento
- **ScheduleMaintenance**: Programar mantenimiento

## Consultas y monitoreo
- **GetMachine**: Obtener información de una máquina
- **GetMachineTransitionHistory**: Historial de transiciones
- **GetAllMachines**: Listar todas las máquinas

## Estados de máquina
- **stopped**: Detenida
- **running**: En ejecución
- **paused**: Pausada
- **maintenance**: En mantenimiento
- **error**: Con error

## Modos de operación
- **manual**: Control manual
- **automatic**: Control automático
- **emergency**: Modo emergencia

## Verificación de SLA
El chaincode verifica automáticamente:
- **Eficiencia**: Debe ser ≥ 80%
- **Temperatura**: No debe superar 90°C
- **Vibración**: No debe superar 10 unidades
- **Uptime**: Porcentaje de tiempo operativo
- **Response Time**: Tiempo de respuesta

## Eventos emitidos
- **MachineRegistered**: Nueva máquina registrada
- **MachineStarted**: Máquina iniciada
- **MachinePaused**: Máquina pausada
- **MachineResumed**: Máquina reanudada
- **MachineStopped**: Máquina detenida
- **SLAViolation**: Violación de SLA detectada
- **MaintenanceScheduled**: Mantenimiento programado

## Estructura de datos
### MachineState
- `machineId`: Identificador único
- `name`, `type`, `location`: Información básica
- `status`, `currentMode`: Estado y modo actual
- `operator`: Operador responsable
- `slaCompliance`: Métricas de cumplimiento SLA
- `performanceMetrics`: Métricas de rendimiento

### StateTransition
- Registro inmutable de cada cambio de estado
- Incluye operador, timestamp y razón del cambio
- Impacto en SLA documentado

## Uso
1. Instalar dependencias: `npm install`
2. Compilar: `npm run build`
3. Desplegar en red Fabric

## Pruebas
- Ejecutar `npm test` para pruebas unitarias 