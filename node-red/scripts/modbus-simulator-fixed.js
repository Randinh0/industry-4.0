#!/usr/bin/env node

/**
 * Simulador Modbus TCP para Industry 4.0 (Versión Corregida)
 * Simula un PLC industrial con registros de holding
 * Usa net.Server directamente sin dependencias externas
 */

const net = require('net');

class ModbusSimulator {
    constructor(host = '0.0.0.0', port = 502) {
        this.host = host;
        this.port = port;
        this.server = null;
        this.holdingRegisters = new Array(100).fill(0);
        this.initialized = false;
        this.clients = new Set();
    }

    initialize() {
        // Inicializar registros con valores simulados
        this.holdingRegisters[0] = 1;  // Estado: 1 = On
        this.holdingRegisters[1] = 750; // Temperatura: 75.0°C
        this.holdingRegisters[2] = 1800; // RPM: 1800
        this.holdingRegisters[3] = 2500; // Presión: 25.0 bar
        this.holdingRegisters[4] = 1200; // Caudal: 120.0 L/min
        this.holdingRegisters[5] = 300; // Vibración: 3.0 mm/s
        this.holdingRegisters[6] = 4500; // Consumo: 45.0 kW
        this.holdingRegisters[7] = 8500; // Eficiencia: 85.0%
        this.holdingRegisters[8] = 1250; // Horas de mantenimiento
        this.holdingRegisters[9] = 0;   // Código de error
        this.holdingRegisters[10] = 9200; // Calidad: 92.0%

        this.initialized = true;
        console.log('✅ Registros Modbus inicializados con valores simulados');
    }

    start() {
        if (!this.initialized) {
            this.initialize();
        }

        this.server = net.createServer((socket) => {
            console.log(`🔌 Cliente conectado: ${socket.remoteAddress}:${socket.remotePort}`);
            this.clients.add(socket);

            socket.on('data', (data) => {
                this.handleModbusRequest(socket, data);
            });

            socket.on('close', () => {
                console.log(`🔌 Cliente desconectado: ${socket.remoteAddress}:${socket.remotePort}`);
                this.clients.delete(socket);
            });

            socket.on('error', (err) => {
                console.log(`❌ Error en cliente: ${err.message}`);
                this.clients.delete(socket);
            });
        });

        this.server.listen(this.port, this.host, () => {
            console.log(`🚀 Servidor Modbus TCP iniciado en ${this.host}:${this.port}`);
            console.log('📊 Registros disponibles: 0-99');
            console.log('🔧 Para detener: Ctrl+C');
        });

        // Simular cambios en los registros cada 10 segundos
        this.startSimulation();
    }

    handleModbusRequest(socket, data) {
        try {
            // Parsear cabecera Modbus TCP
            const transactionId = data.readUInt16BE(0);
            const protocolId = data.readUInt16BE(2);
            const length = data.readUInt16BE(4);
            const unitId = data.readUInt8(6);
            const functionCode = data.readUInt8(7);

            console.log(`📨 Función Modbus: ${functionCode}, Unidad: ${unitId}`);

            let response;

            switch (functionCode) {
                case 3: // Read Holding Registers
                    response = this.handleReadHoldingRegisters(data);
                    break;
                case 6: // Write Single Register
                    response = this.handleWriteSingleRegister(data);
                    break;
                case 16: // Write Multiple Registers
                    response = this.handleWriteMultipleRegisters(data);
                    break;
                default:
                    response = this.createErrorResponse(transactionId, unitId, functionCode, 1);
            }

            if (response) {
                socket.write(response);
            }
        } catch (error) {
            console.error('❌ Error procesando solicitud Modbus:', error);
        }
    }

    handleReadHoldingRegisters(data) {
        const transactionId = data.readUInt16BE(0);
        const unitId = data.readUInt8(6);
        const startAddress = data.readUInt16BE(8);
        const quantity = data.readUInt16BE(10);

        console.log(`📖 Lectura registros: ${startAddress}-${startAddress + quantity - 1}`);

        if (startAddress + quantity > this.holdingRegisters.length) {
            return this.createErrorResponse(transactionId, unitId, 3, 2); // Illegal data address
        }

        const response = Buffer.alloc(9 + quantity * 2);
        
        // Cabecera Modbus TCP
        response.writeUInt16BE(transactionId, 0);
        response.writeUInt16BE(0, 2); // Protocol ID
        response.writeUInt16BE(3 + quantity * 2, 4); // Length
        response.writeUInt8(unitId, 6);
        response.writeUInt8(3, 7); // Function code
        response.writeUInt8(quantity * 2, 8); // Byte count

        // Datos de registros
        for (let i = 0; i < quantity; i++) {
            response.writeUInt16BE(this.holdingRegisters[startAddress + i], 9 + i * 2);
        }

        return response;
    }

    handleWriteSingleRegister(data) {
        const transactionId = data.readUInt16BE(0);
        const unitId = data.readUInt8(6);
        const address = data.readUInt16BE(8);
        const value = data.readUInt16BE(10);

        console.log(`✏️ Escritura registro: ${address} = ${value}`);

        if (address >= this.holdingRegisters.length) {
            return this.createErrorResponse(transactionId, unitId, 6, 2); // Illegal data address
        }

        this.holdingRegisters[address] = value;

        // Respuesta de confirmación
        const response = Buffer.alloc(12);
        response.writeUInt16BE(transactionId, 0);
        response.writeUInt16BE(0, 2); // Protocol ID
        response.writeUInt16BE(6, 4); // Length
        response.writeUInt8(unitId, 6);
        response.writeUInt8(6, 7); // Function code
        response.writeUInt16BE(address, 8);
        response.writeUInt16BE(value, 10);

        return response;
    }

    handleWriteMultipleRegisters(data) {
        const transactionId = data.readUInt16BE(0);
        const unitId = data.readUInt8(6);
        const startAddress = data.readUInt16BE(8);
        const quantity = data.readUInt16BE(10);
        const byteCount = data.readUInt8(12);

        console.log(`✏️ Escritura múltiple registros: ${startAddress}-${startAddress + quantity - 1}`);

        if (startAddress + quantity > this.holdingRegisters.length) {
            return this.createErrorResponse(transactionId, unitId, 16, 2); // Illegal data address
        }

        // Leer valores
        for (let i = 0; i < quantity; i++) {
            this.holdingRegisters[startAddress + i] = data.readUInt16BE(13 + i * 2);
        }

        // Respuesta de confirmación
        const response = Buffer.alloc(12);
        response.writeUInt16BE(transactionId, 0);
        response.writeUInt16BE(0, 2); // Protocol ID
        response.writeUInt16BE(6, 4); // Length
        response.writeUInt8(unitId, 6);
        response.writeUInt8(16, 7); // Function code
        response.writeUInt16BE(startAddress, 8);
        response.writeUInt16BE(quantity, 10);

        return response;
    }

    createErrorResponse(transactionId, unitId, functionCode, errorCode) {
        const response = Buffer.alloc(9);
        response.writeUInt16BE(transactionId, 0);
        response.writeUInt16BE(0, 2); // Protocol ID
        response.writeUInt16BE(3, 4); // Length
        response.writeUInt8(unitId, 6);
        response.writeUInt8(functionCode | 0x80, 7); // Function code with error bit
        response.writeUInt8(errorCode, 8);
        return response;
    }

    startSimulation() {
        setInterval(() => {
            // Simular variaciones en las métricas
            this.holdingRegisters[1] = Math.max(600, Math.min(900, this.holdingRegisters[1] + (Math.random() - 0.5) * 100)); // Temperatura
            this.holdingRegisters[2] = Math.max(1500, Math.min(2100, this.holdingRegisters[2] + (Math.random() - 0.5) * 200)); // RPM
            this.holdingRegisters[3] = Math.max(2000, Math.min(3000, this.holdingRegisters[3] + (Math.random() - 0.5) * 200)); // Presión
            this.holdingRegisters[5] = Math.max(100, Math.min(800, this.holdingRegisters[5] + (Math.random() - 0.5) * 100)); // Vibración
            this.holdingRegisters[7] = Math.max(7000, Math.min(9500, this.holdingRegisters[7] + (Math.random() - 0.5) * 500)); // Eficiencia
            
            // Simular errores ocasionales
            if (Math.random() < 0.05) { // 5% de probabilidad
                this.holdingRegisters[0] = 2; // Estado de error
                this.holdingRegisters[9] = Math.floor(Math.random() * 10) + 1; // Código de error
                console.log('⚠️ Error simulado detectado');
            } else {
                this.holdingRegisters[0] = 1; // Estado normal
                this.holdingRegisters[9] = 0; // Sin errores
            }

            console.log(`🔄 Métricas actualizadas: Temp=${this.holdingRegisters[1]/10}°C, RPM=${this.holdingRegisters[2]}, Vib=${this.holdingRegisters[5]/100}mm/s`);
        }, 10000);
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Servidor Modbus detenido');
        }
    }
}

// Manejo de señales para detener el servidor
process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, deteniendo servidor...');
    if (simulator) {
        simulator.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, deteniendo servidor...');
    if (simulator) {
        simulator.stop();
    }
    process.exit(0);
});

// Iniciar simulador
const simulator = new ModbusSimulator('0.0.0.0', 5020);
simulator.start(); 