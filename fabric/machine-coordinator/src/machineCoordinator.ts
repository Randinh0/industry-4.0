import { Context, Contract } from 'fabric-contract-api';
import { 
  MachineState, 
  MachineStatus, 
  MachineMode, 
  StateTransition, 
  MaintenanceSchedule,
  SLAMetrics,
  PerformanceMetrics 
} from './models/machineState';
import * as crypto from 'crypto';

export class MachineCoordinatorContract extends Contract {
  
  // Registrar una nueva máquina
  async RegisterMachine(
    ctx: Context, 
    machineId: string, 
    name: string, 
    type: string, 
    location: string, 
    operator: string,
    uptimeTarget: number,
    responseTimeTarget: number
  ): Promise<void> {
    const exists = await this.MachineExists(ctx, machineId);
    if (exists) {
      throw new Error(`La máquina ${machineId} ya está registrada`);
    }
    
    const now = Date.now();
    const machine: MachineState = {
      machineId,
      name,
      type,
      location,
      status: 'stopped',
      currentMode: 'manual',
      operator,
      lastStateChange: now,
      totalOperatingHours: 0,
      lastMaintenance: now,
      nextMaintenanceDue: now + (30 * 24 * 60 * 60 * 1000), // 30 días por defecto
      slaCompliance: {
        uptimeTarget,
        currentUptime: 0,
        responseTimeTarget,
        currentResponseTime: 0,
        lastSLAUpdate: now,
        slaViolations: 0,
        lastViolation: 0
      },
      performanceMetrics: {
        temperature: 0,
        pressure: 0,
        vibration: 0,
        efficiency: 0,
        powerConsumption: 0,
        throughput: 0,
        lastMetricsUpdate: now
      }
    };
    
    await ctx.stub.putState(machineId, Buffer.from(JSON.stringify(machine)));
    
    // Emitir evento
    ctx.stub.setEvent('MachineRegistered', Buffer.from(JSON.stringify({
      machineId,
      name,
      type,
      location,
      timestamp: now
    })));
  }

  // Iniciar máquina (start)
  async StartMachine(ctx: Context, machineId: string, operator: string, mode: MachineMode = 'automatic'): Promise<string> {
    const machine = await this.GetMachine(ctx, machineId);
    
    if (machine.status === 'running') {
      throw new Error(`La máquina ${machineId} ya está en ejecución`);
    }
    
    if (machine.status === 'maintenance') {
      throw new Error(`La máquina ${machineId} está en mantenimiento`);
    }
    
    if (machine.status === 'error') {
      throw new Error(`La máquina ${machineId} tiene un error y no puede iniciarse`);
    }
    
    const transitionId = this.generateTransitionId(machineId, 'start');
    const now = Date.now();
    
    const transition: StateTransition = {
      transitionId,
      machineId,
      fromStatus: machine.status,
      toStatus: 'running',
      fromMode: machine.currentMode,
      toMode: mode,
      operator,
      timestamp: now,
      reason: 'Inicio de operación',
      slaImpact: true
    };
    
    // Actualizar estado de la máquina
    machine.status = 'running';
    machine.currentMode = mode;
    machine.operator = operator;
    machine.lastStateChange = now;
    
    await ctx.stub.putState(machineId, Buffer.from(JSON.stringify(machine)));
    await ctx.stub.putState(transitionId, Buffer.from(JSON.stringify(transition)));
    
    // Emitir evento
    ctx.stub.setEvent('MachineStarted', Buffer.from(JSON.stringify({
      machineId,
      operator,
      mode,
      timestamp: now
    })));
    
    return transitionId;
  }

  // Pausar máquina (pause)
  async PauseMachine(ctx: Context, machineId: string, operator: string, reason?: string): Promise<string> {
    const machine = await this.GetMachine(ctx, machineId);
    
    if (machine.status !== 'running') {
      throw new Error(`La máquina ${machineId} no está en ejecución`);
    }
    
    const transitionId = this.generateTransitionId(machineId, 'pause');
    const now = Date.now();
    
    const transition: StateTransition = {
      transitionId,
      machineId,
      fromStatus: machine.status,
      toStatus: 'paused',
      fromMode: machine.currentMode,
      toMode: machine.currentMode,
      operator,
      timestamp: now,
      reason: reason || 'Pausa manual',
      slaImpact: true
    };
    
    // Actualizar estado de la máquina
    machine.status = 'paused';
    machine.operator = operator;
    machine.lastStateChange = now;
    
    await ctx.stub.putState(machineId, Buffer.from(JSON.stringify(machine)));
    await ctx.stub.putState(transitionId, Buffer.from(JSON.stringify(transition)));
    
    // Emitir evento
    ctx.stub.setEvent('MachinePaused', Buffer.from(JSON.stringify({
      machineId,
      operator,
      reason,
      timestamp: now
    })));
    
    return transitionId;
  }

  // Reanudar máquina (resume)
  async ResumeMachine(ctx: Context, machineId: string, operator: string): Promise<string> {
    const machine = await this.GetMachine(ctx, machineId);
    
    if (machine.status !== 'paused') {
      throw new Error(`La máquina ${machineId} no está pausada`);
    }
    
    const transitionId = this.generateTransitionId(machineId, 'resume');
    const now = Date.now();
    
    const transition: StateTransition = {
      transitionId,
      machineId,
      fromStatus: machine.status,
      toStatus: 'running',
      fromMode: machine.currentMode,
      toMode: machine.currentMode,
      operator,
      timestamp: now,
      reason: 'Reanudación de operación',
      slaImpact: true
    };
    
    // Actualizar estado de la máquina
    machine.status = 'running';
    machine.operator = operator;
    machine.lastStateChange = now;
    
    await ctx.stub.putState(machineId, Buffer.from(JSON.stringify(machine)));
    await ctx.stub.putState(transitionId, Buffer.from(JSON.stringify(transition)));
    
    // Emitir evento
    ctx.stub.setEvent('MachineResumed', Buffer.from(JSON.stringify({
      machineId,
      operator,
      timestamp: now
    })));
    
    return transitionId;
  }

  // Detener máquina (stop)
  async StopMachine(ctx: Context, machineId: string, operator: string, reason?: string): Promise<string> {
    const machine = await this.GetMachine(ctx, machineId);
    
    if (machine.status === 'stopped') {
      throw new Error(`La máquina ${machineId} ya está detenida`);
    }
    
    const transitionId = this.generateTransitionId(machineId, 'stop');
    const now = Date.now();
    
    const transition: StateTransition = {
      transitionId,
      machineId,
      fromStatus: machine.status,
      toStatus: 'stopped',
      fromMode: machine.currentMode,
      toMode: 'manual',
      operator,
      timestamp: now,
      reason: reason || 'Parada manual',
      slaImpact: true
    };
    
    // Actualizar estado de la máquina
    machine.status = 'stopped';
    machine.currentMode = 'manual';
    machine.operator = operator;
    machine.lastStateChange = now;
    
    await ctx.stub.putState(machineId, Buffer.from(JSON.stringify(machine)));
    await ctx.stub.putState(transitionId, Buffer.from(JSON.stringify(transition)));
    
    // Emitir evento
    ctx.stub.setEvent('MachineStopped', Buffer.from(JSON.stringify({
      machineId,
      operator,
      reason,
      timestamp: now
    })));
    
    return transitionId;
  }

  // Actualizar métricas de rendimiento
  async UpdatePerformanceMetrics(
    ctx: Context, 
    machineId: string, 
    temperature: number, 
    pressure: number, 
    vibration: number, 
    efficiency: number, 
    powerConsumption: number, 
    throughput: number
  ): Promise<void> {
    const machine = await this.GetMachine(ctx, machineId);
    const now = Date.now();
    
    machine.performanceMetrics = {
      temperature,
      pressure,
      vibration,
      efficiency,
      powerConsumption,
      throughput,
      lastMetricsUpdate: now
    };
    
    await ctx.stub.putState(machineId, Buffer.from(JSON.stringify(machine)));
    
    // Verificar SLA basado en las métricas
    await this.verifySLA(ctx, machine);
  }

  // Verificar SLA
  private async verifySLA(ctx: Context, machine: MachineState): Promise<void> {
    const now = Date.now();
    let slaViolation = false;
    
    // Verificar eficiencia
    if (machine.performanceMetrics.efficiency < 80) { // Menos del 80% de eficiencia
      slaViolation = true;
    }
    
    // Verificar temperatura (ejemplo: no debe superar 90°C)
    if (machine.performanceMetrics.temperature > 90) {
      slaViolation = true;
    }
    
    // Verificar vibración (ejemplo: no debe superar 10 unidades)
    if (machine.performanceMetrics.vibration > 10) {
      slaViolation = true;
    }
    
    if (slaViolation) {
      machine.slaCompliance.slaViolations++;
      machine.slaCompliance.lastViolation = now;
      
      // Emitir evento de violación de SLA
      ctx.stub.setEvent('SLAViolation', Buffer.from(JSON.stringify({
        machineId: machine.machineId,
        violationType: 'performance',
        metrics: machine.performanceMetrics,
        timestamp: now
      })));
    }
    
    machine.slaCompliance.lastSLAUpdate = now;
    await ctx.stub.putState(machine.machineId, Buffer.from(JSON.stringify(machine)));
  }

  // Programar mantenimiento
  async ScheduleMaintenance(
    ctx: Context, 
    machineId: string, 
    maintenanceType: 'preventive' | 'corrective' | 'emergency',
    scheduledDate: number,
    estimatedDuration: number,
    assignedTechnician: string,
    priority: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<string> {
    const machine = await this.GetMachine(ctx, machineId);
    const now = Date.now();
    
    const maintenanceId = this.generateMaintenanceId(machineId);
    const maintenance: MaintenanceSchedule = {
      machineId,
      maintenanceType,
      scheduledDate,
      estimatedDuration,
      assignedTechnician,
      priority,
      status: 'scheduled',
      description,
      createdAt: now,
      updatedAt: now
    };
    
    await ctx.stub.putState(maintenanceId, Buffer.from(JSON.stringify(maintenance)));
    
    // Emitir evento
    ctx.stub.setEvent('MaintenanceScheduled', Buffer.from(JSON.stringify({
      machineId,
      maintenanceType,
      scheduledDate,
      assignedTechnician,
      priority,
      timestamp: now
    })));
    
    return maintenanceId;
  }

  // Obtener información de una máquina
  async GetMachine(ctx: Context, machineId: string): Promise<MachineState> {
    const machineJSON = await ctx.stub.getState(machineId);
    if (!machineJSON || machineJSON.length === 0) {
      throw new Error(`La máquina ${machineId} no existe`);
    }
    return JSON.parse(machineJSON.toString());
  }

  // Obtener historial de transiciones de una máquina
  async GetMachineTransitionHistory(ctx: Context, machineId: string): Promise<string> {
    const transitions: StateTransition[] = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    
    while (!result.done) {
      if (result.value && result.value.value.toString()) {
        try {
          const transition: StateTransition = JSON.parse(result.value.value.toString());
          if (transition.machineId === machineId) {
            transitions.push(transition);
          }
        } catch (error) {
          // Ignorar registros que no son transiciones
        }
      }
      result = await iterator.next();
    }
    await iterator.close();
    
    // Ordenar por timestamp
    transitions.sort((a, b) => a.timestamp - b.timestamp);
    return JSON.stringify(transitions);
  }

  // Obtener todas las máquinas
  async GetAllMachines(ctx: Context): Promise<string> {
    const machines: MachineState[] = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    
    while (!result.done) {
      if (result.value && result.value.value.toString()) {
        try {
          const machine: MachineState = JSON.parse(result.value.value.toString());
          // Verificar que es una máquina (tiene machineId y name)
          if (machine.machineId && machine.name) {
            machines.push(machine);
          }
        } catch (error) {
          // Ignorar registros que no son máquinas
        }
      }
      result = await iterator.next();
    }
    await iterator.close();
    
    return JSON.stringify(machines);
  }

  // Verificar si una máquina existe
  async MachineExists(ctx: Context, machineId: string): Promise<boolean> {
    const machineJSON = await ctx.stub.getState(machineId);
    return machineJSON && machineJSON.length > 0;
  }

  // Generar ID único para transición
  private generateTransitionId(machineId: string, action: string): string {
    const timestamp = Date.now();
    return `${machineId}_${action}_${timestamp}`;
  }

  // Generar ID único para mantenimiento
  private generateMaintenanceId(machineId: string): string {
    const timestamp = Date.now();
    return `maintenance_${machineId}_${timestamp}`;
  }
} 