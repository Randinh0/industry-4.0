#!/usr/bin/env node

/**
 * Script de prueba para la integración Industry 4.0
 * Verifica: Modbus-TCP, MQTT, Node-RED
 */

const mqtt = require('mqtt');
const ModbusRTU = require('modbus-serial');

class IntegrationTester {
    constructor() {
        this.mqttClient = null;
        this.modbusClient = null;
        this.testResults = {
            modbus: false,
            mqtt: false,
            nodered: false,
            integration: false
        };
    }

    async runTests() {
        console.log('🧪 Iniciando pruebas de integración Industry 4.0...\n');

        try {
            await this.testModbusConnection();
            await this.testMqttConnection();
            await this.testNodeRedConnection();
            await this.testFullIntegration();
            
            this.printResults();
        } catch (error) {
            console.error('❌ Error en las pruebas:', error.message);
        } finally {
            this.cleanup();
        }
    }

    async testModbusConnection() {
        console.log('🔌 Probando conexión Modbus-TCP...');
        
        try {
            this.modbusClient = new ModbusRTU();
            
            // Intentar conectar al simulador
            await this.modbusClient.connectTCP('localhost', { port: 502 });
            await this.modbusClient.setID(1);
            
            // Leer registros de prueba
            const data = await this.modbusClient.readHoldingRegisters(0, 5);
            
            if (data && data.data && data.data.length > 0) {
                console.log('✅ Conexión Modbus-TCP exitosa');
                console.log(`   Registros leídos: [${data.data.join(', ')}]`);
                this.testResults.modbus = true;
            } else {
                throw new Error('No se pudieron leer registros');
            }
        } catch (error) {
            console.log('❌ Error en conexión Modbus-TCP:', error.message);
            this.testResults.modbus = false;
        }
    }

    async testMqttConnection() {
        console.log('\n📡 Probando conexión MQTT...');
        
        try {
            this.mqttClient = mqtt.connect('mqtt://localhost:1883', {
                clientId: 'integration-tester',
                clean: true,
                connectTimeout: 5000
            });

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout en conexión MQTT'));
                }, 10000);

                this.mqttClient.on('connect', () => {
                    clearTimeout(timeout);
                    console.log('✅ Conexión MQTT exitosa');
                    this.testResults.mqtt = true;
                    resolve();
                });

                this.mqttClient.on('error', (error) => {
                    clearTimeout(timeout);
                    console.log('❌ Error en conexión MQTT:', error.message);
                    this.testResults.mqtt = false;
                    reject(error);
                });
            });
        } catch (error) {
            console.log('❌ Error en conexión MQTT:', error.message);
            this.testResults.mqtt = false;
        }
    }

    async testNodeRedConnection() {
        console.log('\n🌐 Probando conexión Node-RED...');
        
        try {
            const http = require('http');
            
            return new Promise((resolve, reject) => {
                const req = http.get('http://localhost:1880', (res) => {
                    if (res.statusCode === 200 || res.statusCode === 401) {
                        console.log('✅ Node-RED está ejecutándose');
                        this.testResults.nodered = true;
                        resolve();
                    } else {
                        console.log(`❌ Node-RED respondió con código: ${res.statusCode}`);
                        this.testResults.nodered = false;
                        reject(new Error(`Status code: ${res.statusCode}`));
                    }
                });

                req.on('error', (error) => {
                    console.log('❌ Node-RED no está disponible:', error.message);
                    this.testResults.nodered = false;
                    reject(error);
                });

                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error('Timeout en conexión Node-RED'));
                });
            });
        } catch (error) {
            console.log('❌ Error en conexión Node-RED:', error.message);
            this.testResults.nodered = false;
        }
    }

    async testFullIntegration() {
        console.log('\n🔄 Probando integración completa...');
        
        if (!this.testResults.modbus || !this.testResults.mqtt) {
            console.log('⚠️ No se puede probar integración completa - dependencias no disponibles');
            return;
        }

        try {
            // Suscribirse a tópicos MQTT
            this.mqttClient.subscribe('industry4.0/plc/+/metrics');
            this.mqttClient.subscribe('industry4.0/plc/+/errors');

            let messagesReceived = 0;
            const expectedMessages = 2;

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (messagesReceived >= expectedMessages) {
                        console.log('✅ Integración completa exitosa');
                        this.testResults.integration = true;
                        resolve();
                    } else {
                        console.log('⚠️ Integración parcial - algunos mensajes no recibidos');
                        this.testResults.integration = false;
                        resolve();
                    }
                }, 15000);

                this.mqttClient.on('message', (topic, message) => {
                    messagesReceived++;
                    console.log(`📨 Mensaje recibido en ${topic}:`, message.toString().substring(0, 100) + '...');
                    
                    if (messagesReceived >= expectedMessages) {
                        clearTimeout(timeout);
                        console.log('✅ Integración completa exitosa');
                        this.testResults.integration = true;
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.log('❌ Error en integración completa:', error.message);
            this.testResults.integration = false;
        }
    }

    printResults() {
        console.log('\n📊 RESULTADOS DE LAS PRUEBAS');
        console.log('============================');
        console.log(`🔌 Modbus-TCP:     ${this.testResults.modbus ? '✅ PASÓ' : '❌ FALLÓ'}`);
        console.log(`📡 MQTT:           ${this.testResults.mqtt ? '✅ PASÓ' : '❌ FALLÓ'}`);
        console.log(`🌐 Node-RED:       ${this.testResults.nodered ? '✅ PASÓ' : '❌ FALLÓ'}`);
        console.log(`🔄 Integración:    ${this.testResults.integration ? '✅ PASÓ' : '❌ FALLÓ'}`);
        
        const passedTests = Object.values(this.testResults).filter(Boolean).length;
        const totalTests = Object.keys(this.testResults).length;
        
        console.log(`\n📈 Resumen: ${passedTests}/${totalTests} pruebas pasaron`);
        
        if (passedTests === totalTests) {
            console.log('🎉 ¡Todas las pruebas pasaron! La integración está funcionando correctamente.');
        } else {
            console.log('⚠️ Algunas pruebas fallaron. Revisa la configuración.');
        }
    }

    cleanup() {
        if (this.modbusClient) {
            this.modbusClient.close();
        }
        if (this.mqttClient) {
            this.mqttClient.end();
        }
    }
}

// Ejecutar pruebas
const tester = new IntegrationTester();
tester.runTests().catch(console.error); 