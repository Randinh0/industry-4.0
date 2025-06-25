#!/usr/bin/env node

/**
 * Simulador Modbus TCP para Industry 4.0
 * Simula un PLC industrial con registros de holding
 */

const ModbusServer = require('modbus-server');
const net = require('net');

class ModbusSimulator {
    constructor(host = '0.0.0.0', port = 502) {
        this.host = host;
        this.port = port;
        this.server = null;
        this.holdingRegisters = new Array(100).fill(0);
        this.initialized = false;
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

        this.server = new ModbusServer({
            host: this.host,
            port: this.port,
            debug: true
        });

        // Configurar manejadores de eventos
        this.server.on('connection', (client) => {
            console.log(`🔌 Cliente conectado: ${client.remoteAddress}:${client.remotePort}`);
        });

        this.server.on('disconnection', (client) => {
            console.log(`🔌 Cliente desconectado: ${client.remoteAddress}:${client.remotePort}`);
        });

        // Manejador para lectura de registros holding
        this.server.on('readHoldingRegisters', (request, response) => {
            const { start, count } = request;
            const values = this.holdingRegisters.slice(start, start + count);
            
            console.log(`📖 Lectura registros: ${start}-${start + count - 1} = [${values.join(', ')}]`);
            
            response.send(values);
        });

        // Manejador para escritura de registros holding
        this.server.on('writeHoldingRegisters', (request, response) => {
            const { start, values } = request;
            
            for (let i = 0; i < values.length; i++) {
                this.holdingRegisters[start + i] = values[i];
            }
            
            console.log(`✏️ Escritura registros: ${start}-${start + values.length - 1} = [${values.join(', ')}]`);
            
            response.send();
        });

        // Iniciar servidor
        this.server.start((err) => {
            if (err) {
                console.error('❌ Error iniciando servidor Modbus:', err);
                process.exit(1);
            }
            
            console.log(`🚀 Servidor Modbus TCP iniciado en ${this.host}:${this.port}`);
            console.log('📊 Registros disponibles: 0-99');
            console.log('🔧 Para detener: Ctrl+C');
        });

        // Simular cambios en los registros cada 10 segundos
        this.startSimulation();
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
            this.server.stop();
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
const simulator = new ModbusSimulator('0.0.0.0', 502);
simulator.start(); 