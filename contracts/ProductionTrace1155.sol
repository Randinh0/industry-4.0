// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProductionBatch1155.sol";
import "./TraceabilityModule.sol";
import "./QualityModule.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract ProductionTrace1155 is ProductionBatch1155, TraceabilityModule, QualityModule, EIP712 {
    using ECDSA for bytes32;

    // Roles del sistema
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant QUALITY_ROLE = keccak256("QUALITY_ROLE");
    
    // EIP-712 Domain Separator
    bytes32 public constant TRACE_RECORD_TYPEHASH = keccak256(
        "TraceRecord(uint256 tokenId,string operation,uint256 quantity,string fromLocation,string toLocation,string processId,uint256 nonce)"
    );
    
    // Nonces para prevenir replay attacks
    mapping(address => uint256) public nonces;
    
    // Eventos adicionales
    event BatchTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 quantity);
    event BatchConsumed(uint256 indexed tokenId, uint256 quantity, string processId);
    event BatchSplit(uint256 indexed originalTokenId, uint256 indexed newTokenId, uint256 quantity);
    event BatchMerged(uint256 indexed tokenId1, uint256 indexed tokenId2, uint256 totalQuantity);
    event CalibrationPerformed(uint256 indexed tokenId, uint256 timestamp, bool success);
    
    constructor() EIP712("ProductionTrace1155", "1.0") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(SUPPLIER_ROLE, msg.sender);
        _grantRole(PRODUCER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        _grantRole(QUALITY_ROLE, msg.sender);
    }
    
    /**
     * @dev Crea un nuevo lote de materia prima
     */
    function createBatch(
        address to,
        string memory batchId,
        string memory materialType,
        string memory supplier,
        uint256 quantity,
        string memory unit,
        string memory qualityGrade,
        uint256 expiryDate
    ) public onlyRole(SUPPLIER_ROLE) returns (uint256) {
        uint256 newTokenId = _createBatch(
            to, batchId, materialType, supplier, quantity, unit, qualityGrade, expiryDate
        );
        _updateQualityData(newTokenId, 20, 50, 1013, "excelente");
        return newTokenId;
    }
    
    /**
     * @dev Registra entrada de material (recordInput)
     */
    function recordInput(
        uint256 tokenId,
        uint256 quantity,
        string memory fromLocation,
        string memory toLocation,
        string memory processId
    ) public onlyRole(OPERATOR_ROLE) {
        require(batchMetadata[tokenId].quantity > 0, "noBatch");
        require(quantity > 0, "qty");
        require(balanceOf(msg.sender, tokenId) >= quantity, "bal");
        _recordTrace(tokenId, "input", quantity, fromLocation, toLocation, processId);
        batchMetadata[tokenId].quantity -= quantity;
    }
    
    /**
     * @dev Registra salida de material (recordOutput)
     */
    function recordOutput(
        uint256 tokenId,
        uint256 quantity,
        string memory fromLocation,
        string memory toLocation,
        string memory processId
    ) public onlyRole(OPERATOR_ROLE) {
        require(batchMetadata[tokenId].quantity > 0, "noBatch");
        require(quantity > 0, "qty");
        require(balanceOf(msg.sender, tokenId) >= quantity, "bal");
        _recordTrace(tokenId, "output", quantity, fromLocation, toLocation, processId);
        batchMetadata[tokenId].quantity -= quantity;
        if (batchMetadata[tokenId].quantity == 0) {
            emit BatchConsumed(tokenId, quantity, processId);
        }
    }
    
    /**
     * @dev Registra trazabilidad con firma EIP-712
     */
    function recordTraceWithSignature(
        uint256 tokenId,
        string memory operation,
        uint256 quantity,
        string memory fromLocation,
        string memory toLocation,
        string memory processId,
        bytes memory signature
    ) public {
        require(batchMetadata[tokenId].quantity > 0, "noBatch");
        require(quantity > 0, "qty");
        address signer = _verifyTraceSignature(
            tokenId, operation, quantity, fromLocation, toLocation, processId, signature
        );
        require(hasRole(OPERATOR_ROLE, signer), "signer");
        _recordTrace(tokenId, operation, quantity, fromLocation, toLocation, processId);
    }
    
    /**
     * @dev Actualiza datos de calidad
     */
    function updateQualityData(
        uint256 tokenId,
        uint256 temperature,
        uint256 humidity,
        uint256 pressure,
        string memory qualityStatus
    ) public onlyRole(QUALITY_ROLE) {
        require(batchMetadata[tokenId].quantity > 0, "noBatch");
        _updateQualityData(tokenId, temperature, humidity, pressure, qualityStatus);
    }
    
    /**
     * @dev Verifica firma EIP-712 para registros de trazabilidad
     */
    function _verifyTraceSignature(
        uint256 tokenId,
        string memory operation,
        uint256 quantity,
        string memory fromLocation,
        string memory toLocation,
        string memory processId,
        bytes memory signature
    ) internal returns (address) {
        uint256 nonce = nonces[msg.sender]++;
        bytes32 structHash = keccak256(abi.encode(
            TRACE_RECORD_TYPEHASH,
            tokenId,
            keccak256(bytes(operation)),
            quantity,
            keccak256(bytes(fromLocation)),
            keccak256(bytes(toLocation)),
            keccak256(bytes(processId)),
            nonce
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer != address(0), "sig");
        return signer;
    }
    
    /**
     * @dev Convierte address a string
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        return string(abi.encodePacked(addr));
    }
    
    /**
     * @dev Override de uri para metadatos dinámicos
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked("ipfs://", batchMetadata[tokenId].batchId));
    }
} 