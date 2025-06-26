"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessTraceContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
const crypto = __importStar(require("crypto"));
class ProcessTraceContract extends fabric_contract_api_1.Contract {
    // Crear un nuevo lote de producción
    async CreateBatch(ctx, batchId, materialType, supplier, totalQuantity) {
        const exists = await this.BatchExists(ctx, batchId);
        if (exists) {
            throw new Error(`El lote ${batchId} ya existe`);
        }
        const now = Date.now();
        const batch = {
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
    async RecordInput(ctx, batchId, quantity, fromLocation, toLocation, processId, operator, notes) {
        const batch = await this.GetBatch(ctx, batchId);
        if (batch.status !== 'active') {
            throw new Error(`El lote ${batchId} no está activo`);
        }
        const traceId = this.generateTraceId(batchId, 'input');
        const timestamp = Date.now();
        const traceHash = this.generateTraceHash(batchId, 'input', quantity, fromLocation, toLocation, timestamp);
        const trace = {
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
    async RecordOutput(ctx, batchId, quantity, fromLocation, toLocation, processId, operator, notes) {
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
        const trace = {
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
    async RecordTransfer(ctx, batchId, quantity, fromLocation, toLocation, processId, operator, notes) {
        const batch = await this.GetBatch(ctx, batchId);
        if (batch.status !== 'active') {
            throw new Error(`El lote ${batchId} no está activo`);
        }
        const traceId = this.generateTraceId(batchId, 'transfer');
        const timestamp = Date.now();
        const traceHash = this.generateTraceHash(batchId, 'transfer', quantity, fromLocation, toLocation, timestamp);
        const trace = {
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
    async RecordQualityCheck(ctx, batchId, temperature, humidity, pressure, qualityStatus, operator, notes) {
        const batch = await this.GetBatch(ctx, batchId);
        if (batch.status !== 'active') {
            throw new Error(`El lote ${batchId} no está activo`);
        }
        const traceId = this.generateTraceId(batchId, 'quality_check');
        const timestamp = Date.now();
        const traceHash = this.generateTraceHash(batchId, 'quality_check', 0, '', '', timestamp);
        const trace = {
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
    async GetBatch(ctx, batchId) {
        const batchJSON = await ctx.stub.getState(batchId);
        if (!batchJSON || batchJSON.length === 0) {
            throw new Error(`El lote ${batchId} no existe`);
        }
        return JSON.parse(batchJSON.toString());
    }
    // Obtener historial de trazabilidad de un lote
    async GetTraceHistory(ctx, batchId) {
        const traces = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                const trace = JSON.parse(result.value.value.toString());
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
    async GetAllBatches(ctx) {
        const batches = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                try {
                    const batch = JSON.parse(result.value.value.toString());
                    // Verificar que es un lote (tiene batchId y materialType)
                    if (batch.batchId && batch.materialType) {
                        batches.push(batch);
                    }
                }
                catch (error) {
                    // Ignorar registros que no son lotes
                }
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(batches);
    }
    // Verificar si un lote existe
    async BatchExists(ctx, batchId) {
        const batchJSON = await ctx.stub.getState(batchId);
        return batchJSON && batchJSON.length > 0;
    }
    // Generar ID único para el trace
    generateTraceId(batchId, operation) {
        const timestamp = Date.now();
        return `${batchId}_${operation}_${timestamp}`;
    }
    // Generar hash del trace para integridad
    generateTraceHash(batchId, operation, quantity, fromLocation, toLocation, timestamp) {
        const data = `${batchId}${operation}${quantity}${fromLocation}${toLocation}${timestamp}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
exports.ProcessTraceContract = ProcessTraceContract;
