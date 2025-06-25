// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IndustrialAssetNFT
 * @dev Contrato para la tokenización de activos industriales basado en ERC-721
 * Permite el registro y actualización de metadatos operativos on-chain
 */
contract IndustrialAssetNFT is ERC721URIStorage, AccessControl {
    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant TECHNICIAN_ROLE = keccak256("TECHNICIAN_ROLE");
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    
    // Contador para IDs únicos de tokens
    uint256 private _tokenIds;
    
    // Estructura para datos operativos
    struct OperationalData {
        uint256 temperature;
        uint256 rpm;
        uint256 lastMaintenance;
        uint256 totalOperatingHours;
        string status; // "Operativo", "Mantenimiento", "Inactivo"
    }
    
    // Mapeo de token ID a datos operativos
    mapping(uint256 => OperationalData) public operationalData;
    
    // Mapeo de token ID a historial de mantenimiento
    mapping(uint256 => string[]) public maintenanceHistory;
    
    // Eventos
    event AssetMinted(uint256 indexed tokenId, address indexed owner, string assetName);
    event OperationalDataUpdated(uint256 indexed tokenId, uint256 temperature, uint256 rpm, string status);
    event MaintenanceRecorded(uint256 indexed tokenId, string maintenanceNote, uint256 timestamp);
    event RoleAssigned(uint256 indexed tokenId, address indexed user, bytes32 role);
    event AssetBurned(uint256 indexed tokenId, address indexed owner);
    
    constructor() ERC721("Industrial Asset NFT", "IANT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
    }
    
    /**
     * @dev Verifica si un token existe
     * @param tokenId ID del token
     * @return true si existe, false en caso contrario
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Acuña un nuevo token para un activo industrial
     * @param to Dirección del propietario del token
     * @param tokenURI URI de los metadatos del token
     * @param assetName Nombre del activo industrial
     * @param initialTemp Temperatura inicial
     * @param initialRpm RPM inicial
     */
    function mintAsset(
        address to,
        string memory tokenURI,
        string memory assetName,
        uint256 initialTemp,
        uint256 initialRpm
    ) public onlyRole(OWNER_ROLE) returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Inicializar datos operativos
        operationalData[newTokenId] = OperationalData({
            temperature: initialTemp,
            rpm: initialRpm,
            lastMaintenance: block.timestamp,
            totalOperatingHours: 0,
            status: "Operativo"
        });
        
        emit AssetMinted(newTokenId, to, assetName);
        return newTokenId;
    }
    
    /**
     * @dev Actualiza los datos operativos de un activo
     * @param tokenId ID del token
     * @param temperature Nueva temperatura
     * @param rpm Nuevo RPM
     * @param status Nuevo estado
     */
    function updateOperationalData(
        uint256 tokenId,
        uint256 temperature,
        uint256 rpm,
        string memory status
    ) public onlyRole(OPERATOR_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        operationalData[tokenId].temperature = temperature;
        operationalData[tokenId].rpm = rpm;
        operationalData[tokenId].status = status;
        
        emit OperationalDataUpdated(tokenId, temperature, rpm, status);
    }
    
    /**
     * @dev Registra una entrada en el historial de mantenimiento
     * @param tokenId ID del token
     * @param maintenanceNote Nota de mantenimiento
     */
    function recordMaintenance(
        uint256 tokenId,
        string memory maintenanceNote
    ) public onlyRole(TECHNICIAN_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        maintenanceHistory[tokenId].push(maintenanceNote);
        operationalData[tokenId].lastMaintenance = block.timestamp;
        
        emit MaintenanceRecorded(tokenId, maintenanceNote, block.timestamp);
    }
    
    /**
     * @dev Actualiza las horas totales de operación
     * @param tokenId ID del token
     * @param additionalHours Horas adicionales a sumar
     */
    function updateOperatingHours(
        uint256 tokenId,
        uint256 additionalHours
    ) public onlyRole(OPERATOR_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        
        operationalData[tokenId].totalOperatingHours += additionalHours;
    }
    
    /**
     * @dev Asigna un rol a una dirección para un token específico
     * @param tokenId ID del token
     * @param user Dirección del usuario
     * @param role Rol a asignar
     */
    function assignRoleToToken(
        uint256 tokenId,
        address user,
        bytes32 role
    ) public onlyRole(OWNER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        require(
            role == OPERATOR_ROLE || 
            role == TECHNICIAN_ROLE || 
            role == OWNER_ROLE,
            "Invalid role"
        );
        
        _grantRole(role, user);
        emit RoleAssigned(tokenId, user, role);
    }
    
    /**
     * @dev Obtiene los datos operativos de un token
     * @param tokenId ID del token
     * @return Datos operativos del token
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
     * @dev Obtiene el historial de mantenimiento de un token
     * @param tokenId ID del token
     * @return Array con el historial de mantenimiento
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
     * @dev Obtiene el número total de tokens acuñados
     * @return Total de tokens
     */
    function getTotalTokens() public view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @dev Verifica si una dirección tiene un rol específico
     * @param user Dirección del usuario
     * @param role Rol a verificar
     * @return true si tiene el rol, false en caso contrario
     */
    function hasRoleForAsset(address user, bytes32 role) public view returns (bool) {
        return hasRole(role, user);
    }
    
    /**
     * @dev Quema un token y limpia sus datos asociados
     * @param tokenId ID del token a quemar
     */
    function burn(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        require(
            msg.sender == ownerOf(tokenId) || hasRole(OWNER_ROLE, msg.sender),
            "Not authorized to burn token"
        );
        
        address tokenOwner = ownerOf(tokenId);
        
        // Limpiar datos operativos y historial
        delete operationalData[tokenId];
        delete maintenanceHistory[tokenId];
        
        // Quemar el token
        _burn(tokenId);
        
        emit AssetBurned(tokenId, tokenOwner);
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