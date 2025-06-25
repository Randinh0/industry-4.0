module.exports = {
    // Configuración del servidor HTTP
    uiPort: process.env.PORT || 1880,
    
    // Configuración de seguridad
    httpNodeAuth: {
        user: process.env.NODE_RED_USER || "admin",
        pass: process.env.NODE_RED_PASS || "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN."
    },
    
    // Configuración de credenciales
    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "industry4.0-secret-key",
    
    // Configuración de logging
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },
    
    // Configuración de editor
    editorTheme: {
        projects: {
            enabled: false
        }
    },
    
    // Configuración de función global
    functionGlobalContext: {
        // Variables globales para el proyecto
        projectName: "Industry 4.0",
        version: "1.0.0",
        mqttBroker: process.env.MQTT_BROKER || "localhost",
        mqttPort: process.env.MQTT_PORT || 1883,
        ethereumNetwork: process.env.ETHEREUM_NETWORK || "localhost",
        ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || "http://localhost:8545"
    },
    
    // Configuración de persistencia
    storageModule: require("./node_modules/node-red/storage/localfilesystem"),
    
    // Configuración de directorios
    userDir: "./node-red/data",
    flowFile: "flows.json",
    
    // Configuración de módulos personalizados
    nodesDir: "./node-red/nodes",
    
    // Configuración de middleware
    httpMiddleware: {
        auth: {
            enabled: true
        }
    }
}; 