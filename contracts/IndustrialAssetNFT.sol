// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title IndustrialAssetNFT
 * @dev Contrato para la tokenización de activos industriales basado en ERC-721
 * Incluye funcionalidades EIP-712, metadatos extendidos y roles mejorados
 */
contract IndustrialAssetNFT is ERC721URIStorage, AccessControl, EIP712 {
    using ECDSA for bytes32;

    // Roles mejorados
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant TECHNICIAN_ROLE = keccak256("TECHNICIAN_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant FINANCE_ROLE = keccak256("FINANCE_ROLE");
    
    // Contador para IDs únicos de tokens
    uint256 private _tokenIds;
    
    // Estructura para datos operativos extendidos
    struct OperationalData {
        uint256 temperature;
        uint256 rpm;
        uint256 lastMaintenance;
        uint256 totalOperatingHours;
        uint256 powerConsumption; // Nuevo: consumo de energía en kWh
        uint256 efficiency; // Nuevo: eficiencia en porcentaje (0-100)
        uint256 vibration; // Nuevo: nivel de vibración
        uint256 pressure; // Nuevo: presión del sistema
        string status; // "Operativo", "Mantenimiento", "Inactivo", "Error"
        string location; // Nuevo: ubicación del activo
        uint256 lastCalibration; // Nuevo: última calibración
        bool isCalibrated; // Nuevo: estado de calibración
    }
    
    // Estructura para datos financieros
    struct FinancialData {
        uint256 acquisitionCost; // Costo de adquisición
        uint256 currentValue; // Valor actual
        uint256 depreciationRate; // Tasa de depreciación anual (%)
        uint256 lastValuation; // Última valuación
        uint256 maintenanceBudget; // Presupuesto de mantenimiento
        uint256 totalMaintenanceCost; // Costo total de mantenimiento
        string currency; // Moneda (USD, EUR, etc.)
    }
    
    // Estructura para datos de compliance
    struct ComplianceData {
        bool iso9001; // Certificación ISO 9001
        bool iso14001; // Certificación ISO 14001
        bool oshaCompliant; // Cumplimiento OSHA
        uint256 lastAudit; // Última auditoría
        string auditReport; // Reporte de auditoría
        bool safetyCertified; // Certificación de seguridad
        uint256 nextAuditDue; // Próxima auditoría programada
    }
    
    // Mapeos para datos extendidos
    mapping(uint256 => OperationalData) public operationalData;
    mapping(uint256 => FinancialData) public financialData;
    mapping(uint256 => ComplianceData) public complianceData;
    mapping(uint256 => string[]) public maintenanceHistory;
    mapping(uint256 => string[]) public auditHistory;
    
    // EIP-712 Domain Separator
    bytes32 public constant OPERATIONAL_DATA_TYPEHASH = keccak256(
        "OperationalDataUpdate(uint256 tokenId,uint256 temperature,uint256 rpm,uint256 powerConsumption,uint256 efficiency,uint256 vibration,uint256 pressure,string status,string location,uint256 nonce)"
    );
    
    bytes32 public constant MAINTENANCE_TYPEHASH = keccak256(
        "MaintenanceRecord(uint256 tokenId,string maintenanceNote,uint256 timestamp,uint256 cost,uint256 nonce)"
    );
    
    // Nonces para prevenir replay attacks
    mapping(address => uint256) public nonces;
    
    // Eventos extendidos
    event AssetMinted(uint256 indexed tokenId, address indexed owner, string assetName, uint256 acquisitionCost);
    event OperationalDataUpdated(uint256 indexed tokenId, uint256 temperature, uint256 rpm, uint256 powerConsumption, uint256 efficiency, string status);
    event FinancialDataUpdated(uint256 indexed tokenId, uint256 currentValue, uint256 maintenanceCost);
    event ComplianceDataUpdated(uint256 indexed tokenId, bool iso9001, bool iso14001, bool oshaCompliant);
    event MaintenanceRecorded(uint256 indexed tokenId, string maintenanceNote, uint256 timestamp, uint256 cost);
    event AuditRecorded(uint256 indexed tokenId, string auditReport, uint256 timestamp);
    event RoleAssigned(uint256 indexed tokenId, address indexed user, bytes32 role);
    event AssetBurned(uint256 indexed tokenId, address indexed owner);
    event CalibrationPerformed(uint256 indexed tokenId, uint256 timestamp, bool success);
    
    constructor() ERC721("Industrial Asset NFT", "IANT") EIP712("IndustrialAssetNFT", "2.0") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        _grantRole(FINANCE_ROLE, msg.sender);
    }
    
    /**
     * @dev Verifica si un token existe
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Acuña un nuevo token para un activo industrial con datos extendidos
     */
    function mintAsset(
        address to,
        string memory tokenURI,
        string memory assetName,
        uint256 initialTemp,
        uint256 initialRpm,
        uint256 acquisitionCost,
        string memory location
    ) public onlyRole(OWNER_ROLE) returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Inicializar datos operativos extendidos
        operationalData[newTokenId] = OperationalData({
            temperature: initialTemp,
            rpm: initialRpm,
            lastMaintenance: block.timestamp,
            totalOperatingHours: 0,
            powerConsumption: 0,
            efficiency: 100,
            vibration: 0,
            pressure: 0,
            status: "Operativo",
            location: location,
            lastCalibration: block.timestamp,
            isCalibrated: true
        });
        
        // Inicializar datos financieros
        financialData[newTokenId] = FinancialData({
            acquisitionCost: acquisitionCost,
            currentValue: acquisitionCost,
            depreciationRate: 10, // 10% anual por defecto
            lastValuation: block.timestamp,
            maintenanceBudget: acquisitionCost / 10, // 10% del costo de adquisición
            totalMaintenanceCost: 0,
            currency: "USD"
        });
        
        // Inicializar datos de compliance
        complianceData[newTokenId] = ComplianceData({
            iso9001: false,
            iso14001: false,
            oshaCompliant: true,
            lastAudit: block.timestamp,
            auditReport: "",
            safetyCertified: true,
            nextAuditDue: block.timestamp + 365 days
        });
        
        emit AssetMinted(newTokenId, to, assetName, acquisitionCost);
        return newTokenId;
    }
    
    /**
     * @dev Actualiza datos operativos con firma EIP-712
     */
    function updateOperationalDataWithSignature(
        uint256 tokenId,
        uint256 temperature,
        uint256 rpm,
        uint256 powerConsumption,
        uint256 efficiency,
        uint256 vibration,
        uint256 pressure,
        string memory status,
        string memory location,
        bytes memory signature
    ) public {
        require(_exists(tokenId), "Token does not exist");
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not an operator");
        
        address signer = _verifyOperationalDataSignature(
            tokenId,
            temperature,
            rpm,
            powerConsumption,
            efficiency,
            vibration,
            pressure,
            status,
            location,
            signature
        );
        
        require(hasRole(OPERATOR_ROLE, signer), "Invalid signer");
        
        operationalData[tokenId].temperature = temperature;
        operationalData[tokenId].rpm = rpm;
        operationalData[tokenId].powerConsumption = powerConsumption;
        operationalData[tokenId].efficiency = efficiency;
        operationalData[tokenId].vibration = vibration;
        operationalData[tokenId].pressure = pressure;
        operationalData[tokenId].status = status;
        operationalData[tokenId].location = location;
        
        emit OperationalDataUpdated(tokenId, temperature, rpm, powerConsumption, efficiency, status);
    }
    
    /**
     * @dev Actualiza datos operativos sin firma (para operadores autorizados)
     */
    function updateOperationalData(
        uint256 tokenId,
        uint256 temperature,
        uint256 rpm,
        uint256 powerConsumption,
        uint256 efficiency,
        uint256 vibration,
        uint256 pressure,
        string memory status,
        string memory location
    ) public onlyRole(OPERATOR_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        operationalData[tokenId].temperature = temperature;
        operationalData[tokenId].rpm = rpm;
        operationalData[tokenId].powerConsumption = powerConsumption;
        operationalData[tokenId].efficiency = efficiency;
        operationalData[tokenId].vibration = vibration;
        operationalData[tokenId].pressure = pressure;
        operationalData[tokenId].status = status;
        operationalData[tokenId].location = location;
        
        emit OperationalDataUpdated(tokenId, temperature, rpm, powerConsumption, efficiency, status);
    }
    
    /**
     * @dev Actualiza datos financieros
     */
    function updateFinancialData(
        uint256 tokenId,
        uint256 currentValue,
        uint256 maintenanceCost,
        uint256 depreciationRate,
        string memory currency
    ) public onlyRole(FINANCE_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        financialData[tokenId].currentValue = currentValue;
        financialData[tokenId].totalMaintenanceCost += maintenanceCost;
        financialData[tokenId].depreciationRate = depreciationRate;
        financialData[tokenId].currency = currency;
        financialData[tokenId].lastValuation = block.timestamp;
        
        emit FinancialDataUpdated(tokenId, currentValue, maintenanceCost);
    }
    
    /**
     * @dev Actualiza datos de compliance
     */
    function updateComplianceData(
        uint256 tokenId,
        bool iso9001,
        bool iso14001,
        bool oshaCompliant,
        bool safetyCertified,
        string memory auditReport
    ) public onlyRole(AUDITOR_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        complianceData[tokenId].iso9001 = iso9001;
        complianceData[tokenId].iso14001 = iso14001;
        complianceData[tokenId].oshaCompliant = oshaCompliant;
        complianceData[tokenId].safetyCertified = safetyCertified;
        complianceData[tokenId].auditReport = auditReport;
        complianceData[tokenId].lastAudit = block.timestamp;
        complianceData[tokenId].nextAuditDue = block.timestamp + 365 days;
        
        auditHistory[tokenId].push(auditReport);
        
        emit ComplianceDataUpdated(tokenId, iso9001, iso14001, oshaCompliant);
        emit AuditRecorded(tokenId, auditReport, block.timestamp);
    }
    
    /**
     * @dev Registra mantenimiento con firma EIP-712
     */
    function recordMaintenanceWithSignature(
        uint256 tokenId,
        string memory maintenanceNote,
        uint256 cost,
        bytes memory signature
    ) public {
        require(_exists(tokenId), "Token does not exist");
        require(hasRole(TECHNICIAN_ROLE, msg.sender), "Caller is not a technician");
        
        address signer = _verifyMaintenanceSignature(
            tokenId,
            maintenanceNote,
            block.timestamp,
            cost,
            signature
        );
        
        require(hasRole(TECHNICIAN_ROLE, signer), "Invalid signer");
        
        maintenanceHistory[tokenId].push(maintenanceNote);
        operationalData[tokenId].lastMaintenance = block.timestamp;
        financialData[tokenId].totalMaintenanceCost += cost;
        
        emit MaintenanceRecorded(tokenId, maintenanceNote, block.timestamp, cost);
    }
    
    /**
     * @dev Registra mantenimiento sin firma
     */
    function recordMaintenance(
        uint256 tokenId,
        string memory maintenanceNote,
        uint256 cost
    ) public onlyRole(TECHNICIAN_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        maintenanceHistory[tokenId].push(maintenanceNote);
        operationalData[tokenId].lastMaintenance = block.timestamp;
        financialData[tokenId].totalMaintenanceCost += cost;
        
        emit MaintenanceRecorded(tokenId, maintenanceNote, block.timestamp, cost);
    }
    
    /**
     * @dev Realiza calibración del activo
     */
    function performCalibration(uint256 tokenId, bool success) public onlyRole(TECHNICIAN_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        operationalData[tokenId].lastCalibration = block.timestamp;
        operationalData[tokenId].isCalibrated = success;
        
        emit CalibrationPerformed(tokenId, block.timestamp, success);
    }
    
    /**
     * @dev Sincroniza datos operativos desde sistema externo
     */
    function syncOperationalData(
        uint256 tokenId,
        uint256 temperature,
        uint256 rpm,
        uint256 powerConsumption,
        uint256 efficiency,
        uint256 vibration,
        uint256 pressure,
        string memory status
    ) public onlyRole(OPERATOR_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        operationalData[tokenId].temperature = temperature;
        operationalData[tokenId].rpm = rpm;
        operationalData[tokenId].powerConsumption = powerConsumption;
        operationalData[tokenId].efficiency = efficiency;
        operationalData[tokenId].vibration = vibration;
        operationalData[tokenId].pressure = pressure;
        operationalData[tokenId].status = status;
        
        emit OperationalDataUpdated(tokenId, temperature, rpm, powerConsumption, efficiency, status);
    }
    
    /**
     * @dev Verifica firma EIP-712 para datos operativos
     */
    function _verifyOperationalDataSignature(
        uint256 tokenId,
        uint256 temperature,
        uint256 rpm,
        uint256 powerConsumption,
        uint256 efficiency,
        uint256 vibration,
        uint256 pressure,
        string memory status,
        string memory location,
        bytes memory signature
    ) internal returns (address) {
        bytes32 structHash = keccak256(abi.encode(
            OPERATIONAL_DATA_TYPEHASH,
            tokenId,
            temperature,
            rpm,
            powerConsumption,
            efficiency,
            vibration,
            pressure,
            keccak256(bytes(status)),
            keccak256(bytes(location)),
            nonces[msg.sender]++
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        return signer;
    }
    
    /**
     * @dev Verifica firma EIP-712 para mantenimiento
     */
    function _verifyMaintenanceSignature(
        uint256 tokenId,
        string memory maintenanceNote,
        uint256 timestamp,
        uint256 cost,
        bytes memory signature
    ) internal returns (address) {
        bytes32 structHash = keccak256(abi.encode(
            MAINTENANCE_TYPEHASH,
            tokenId,
            keccak256(bytes(maintenanceNote)),
            timestamp,
            cost,
            nonces[msg.sender]++
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        return signer;
    }
    
    /**
     * @dev Obtiene todos los datos de un token
     */
    function getAssetData(uint256 tokenId) 
        public 
        view 
        returns (
            OperationalData memory operational,
            FinancialData memory financial,
            ComplianceData memory compliance,
            string[] memory maintenance,
            string[] memory audits
        ) 
    {
        require(_exists(tokenId), "Token does not exist");
        return (
            operationalData[tokenId],
            financialData[tokenId],
            complianceData[tokenId],
            maintenanceHistory[tokenId],
            auditHistory[tokenId]
        );
    }
    
    /**
     * @dev Obtiene datos operativos de un token
     */
    function getOperationalData(uint256 tokenId) 
        public 
        view 
        returns (OperationalData memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return operationalData[tokenId];
    }
    
    /**
     * @dev Obtiene datos financieros de un token
     */
    function getFinancialData(uint256 tokenId) 
        public 
        view 
        returns (FinancialData memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return financialData[tokenId];
    }
    
    /**
     * @dev Obtiene datos de compliance de un token
     */
    function getComplianceData(uint256 tokenId) 
        public 
        view 
        returns (ComplianceData memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return complianceData[tokenId];
    }
    
    /**
     * @dev Obtiene el historial de mantenimiento de un token
     */
    function getMaintenanceHistory(uint256 tokenId) 
        public 
        view 
        returns (string[] memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return maintenanceHistory[tokenId];
    }
    
    /**
     * @dev Obtiene el historial de auditorías de un token
     */
    function getAuditHistory(uint256 tokenId) 
        public 
        view 
        returns (string[] memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        return auditHistory[tokenId];
    }
    
    /**
     * @dev Obtiene el número total de tokens acuñados
     */
    function getTotalTokens() public view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Verifica si una dirección tiene un rol específico
     */
    function hasRoleForAsset(address user, bytes32 role) public view returns (bool) {
        return hasRole(role, user);
    }
    
    /**
     * @dev Asigna un rol a una dirección
     */
    function assignRole(
        address user,
        bytes32 role
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            role == OPERATOR_ROLE || 
            role == TECHNICIAN_ROLE || 
            role == OWNER_ROLE ||
            role == AUDITOR_ROLE ||
            role == FINANCE_ROLE,
            "Invalid role"
        );
        
        _grantRole(role, user);
        emit RoleAssigned(0, user, role); // 0 indica asignación global
    }
    
    /**
     * @dev Quema un token y limpia sus datos asociados
     */
    function burn(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        require(
            msg.sender == ownerOf(tokenId) || hasRole(OWNER_ROLE, msg.sender),
            "Not authorized to burn token"
        );
        
        address tokenOwner = ownerOf(tokenId);
        
        // Limpiar todos los datos
        delete operationalData[tokenId];
        delete financialData[tokenId];
        delete complianceData[tokenId];
        delete maintenanceHistory[tokenId];
        delete auditHistory[tokenId];
        
        // Quemar el token
        _burn(tokenId);
        
        emit AssetBurned(tokenId, tokenOwner);
    }
    
    /**
     * @dev Obtiene el nonce actual de una dirección
     */
    function getNonce(address user) public view returns (uint256) {
        return nonces[user];
    }
    
    // Override de supportsInterface para AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 