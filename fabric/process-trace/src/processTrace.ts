import { Context, Contract } from 'fabric-contract-api';
import { ProcessTrace, BatchInfo } from './models/processTrace';
import * as crypto from 'crypto';

export class ProcessTraceContract extends Contract {
  
  // Crear un nuevo lote de producción
  async CreateBatch(ctx: Context, batchId: string, materialType: string, supplier: string, totalQuantity: number): Promise<void> {
    const exists = await this.BatchExists(ctx, batchId);
    if (exists) {
      throw new Error(`El lote ${batchId} ya existe`);
    }
    
    const now = Date.now();
    const batch: BatchInfo = {
      batchId,
      materialType,
      supplier,
      totalQuantity,
      currentQuantity: totalQuantity,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    
    await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
  }

  // Registrar entrada de material (input)
  async RecordInput(ctx: Context, batchId: string, quantity: number, fromLocation: string, toLocation: string, processId: string, operator: string, notes?: string): Promise<string> {
    const batch = await this.GetBatch(ctx, batchId);
    if (batch.status !== 'active') {
      throw new Error(`El lote ${batchId} no está activo`);
    }
    
    const traceId = this.generateTraceId(batchId, 'input');
    const timestamp = Date.now();
    const traceHash = this.generateTraceHash(batchId, 'input', quantity, fromLocation, toLocation, timestamp);
    
    const trace: ProcessTrace = {
      traceId,
      batchId,
      operation: 'input',
      quantity,
      fromLocation,
      toLocation,
      processId,
      operator,
      timestamp,
      traceHash,
      notes
    };
    
    await ctx.stub.putState(traceId, Buffer.from(JSON.stringify(trace)));
    
    // Emitir evento
    ctx.stub.setEvent('TraceRecorded', Buffer.from(JSON.stringify({
      traceId,
      batchId,
      operation: 'input',
      timestamp,
      traceHash
    })));
    
    return traceId;
  }

  // Registrar salida de material (output)
  async RecordOutput(ctx: Context, batchId: string, quantity: number, fromLocation: string, toLocation: string, processId: string, operator: string, notes?: string): Promise<string> {
    const batch = await this.GetBatch(ctx, batchId);
    if (batch.status !== 'active') {
      throw new Error(`El lote ${batchId} no está activo`);
    }
    if (batch.currentQuantity < quantity) {
      throw new Error(`Cantidad insuficiente en el lote ${batchId}`);
    }
    
    const traceId = this.generateTraceId(batchId, 'output');
    const timestamp = Date.now();
    const traceHash = this.generateTraceHash(batchId, 'output', quantity, fromLocation, toLocation, timestamp);
    
    const trace: ProcessTrace = {
      traceId,
      batchId,
      operation: 'output',
      quantity,
      fromLocation,
      toLocation,
      processId,
      operator,
      timestamp,
      traceHash,
      notes
    };
    
    await ctx.stub.putState(traceId, Buffer.from(JSON.stringify(trace)));
    
    // Actualizar cantidad del lote
    batch.currentQuantity -= quantity;
    batch.updatedAt = timestamp;
    if (batch.currentQuantity === 0) {
      batch.status = 'completed';
    }
    await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    
    // Emitir evento
    ctx.stub.setEvent('TraceRecorded', Buffer.from(JSON.stringify({
      traceId,
      batchId,
      operation: 'output',
      timestamp,
      traceHash
    })));
    
    return traceId;
  }

  // Registrar transferencia de material
  async RecordTransfer(ctx: Context, batchId: string, quantity: number, fromLocation: string, toLocation: string, processId: string, operator: string, notes?: string): Promise<string> {
    const batch = await this.GetBatch(ctx, batchId);
    if (batch.status !== 'active') {
      throw new Error(`El lote ${batchId} no está activo`);
    }
    
    const traceId = this.generateTraceId(batchId, 'transfer');
    const timestamp = Date.now();
    const traceHash = this.generateTraceHash(batchId, 'transfer', quantity, fromLocation, toLocation, timestamp);
    
    const trace: ProcessTrace = {
      traceId,
      batchId,
      operation: 'transfer',
      quantity,
      fromLocation,
      toLocation,
      processId,
      operator,
      timestamp,
      traceHash,
      notes
    };
    
    await ctx.stub.putState(traceId, Buffer.from(JSON.stringify(trace)));
    
    // Emitir evento
    ctx.stub.setEvent('TraceRecorded', Buffer.from(JSON.stringify({
      traceId,
      batchId,
      operation: 'transfer',
      timestamp,
      traceHash
    })));
    
    return traceId;
  }

  // Registrar verificación de calidad
  async RecordQualityCheck(ctx: Context, batchId: string, temperature: number, humidity: number, pressure: number, qualityStatus: string, operator: string, notes?: string): Promise<string> {
    const batch = await this.GetBatch(ctx, batchId);
    if (batch.status !== 'active') {
      throw new Error(`El lote ${batchId} no está activo`);
    }
    
    const traceId = this.generateTraceId(batchId, 'quality_check');
    const timestamp = Date.now();
    const traceHash = this.generateTraceHash(batchId, 'quality_check', 0, '', '', timestamp);
    
    const trace: ProcessTrace = {
      traceId,
      batchId,
      operation: 'quality_check',
      quantity: 0,
      fromLocation: '',
      toLocation: '',
      processId: 'quality_control',
      operator,
      timestamp,
      traceHash,
      notes,
      qualityData: {
        temperature,
        humidity,
        pressure,
        qualityStatus
      }
    };
    
    await ctx.stub.putState(traceId, Buffer.from(JSON.stringify(trace)));
    
    // Emitir evento
    ctx.stub.setEvent('TraceRecorded', Buffer.from(JSON.stringify({
      traceId,
      batchId,
      operation: 'quality_check',
      timestamp,
      traceHash
    })));
    
    return traceId;
  }

  // Obtener información de un lote
  async GetBatch(ctx: Context, batchId: string): Promise<BatchInfo> {
    const batchJSON = await ctx.stub.getState(batchId);
    if (!batchJSON || batchJSON.length === 0) {
      throw new Error(`El lote ${batchId} no existe`);
    }
    return JSON.parse(batchJSON.toString());
  }

  // Obtener historial de trazabilidad de un lote
  async GetTraceHistory(ctx: Context, batchId: string): Promise<string> {
    const traces: ProcessTrace[] = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    
    while (!result.done) {
      if (result.value && result.value.value.toString()) {
        const trace: ProcessTrace = JSON.parse(result.value.value.toString());
        if (trace.batchId === batchId) {
          traces.push(trace);
        }
      }
      result = await iterator.next();
    }
    await iterator.close();
    
    // Ordenar por timestamp
    traces.sort((a, b) => a.timestamp - b.timestamp);
    return JSON.stringify(traces);
  }

  // Obtener todos los lotes
  async GetAllBatches(ctx: Context): Promise<string> {
    const batches: BatchInfo[] = [];
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    
    while (!result.done) {
      if (result.value && result.value.value.toString()) {
        try {
          const batch: BatchInfo = JSON.parse(result.value.value.toString());
          // Verificar que es un lote (tiene batchId y materialType)
          if (batch.batchId && batch.materialType) {
            batches.push(batch);
          }
        } catch (error) {
          // Ignorar registros que no son lotes
        }
      }
      result = await iterator.next();
    }
    await iterator.close();
    
    return JSON.stringify(batches);
  }

  // Verificar si un lote existe
  async BatchExists(ctx: Context, batchId: string): Promise<boolean> {
    const batchJSON = await ctx.stub.getState(batchId);
    return batchJSON && batchJSON.length > 0;
  }

  // Generar ID único para el trace
  private generateTraceId(batchId: string, operation: string): string {
    const timestamp = Date.now();
    return `${batchId}_${operation}_${timestamp}`;
  }

  // Generar hash del trace para integridad
  private generateTraceHash(batchId: string, operation: string, quantity: number, fromLocation: string, toLocation: string, timestamp: number): string {
    const data = `${batchId}${operation}${quantity}${fromLocation}${toLocation}${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
} 