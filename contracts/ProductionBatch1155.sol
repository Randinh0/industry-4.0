// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract ProductionBatch1155 is ERC1155, AccessControl {
    struct BatchMetadata {
        string batchId;
        string materialType;
        string supplier;
        uint256 productionDate;
        uint256 expiryDate;
        uint256 quantity;
        string unit;
        string qualityGrade;
    }
    mapping(uint256 => BatchMetadata) public batchMetadata;
    mapping(string => uint256) public batchIdToTokenId;
    mapping(uint256 => uint256) public totalSupply;
    uint256 internal _tokenIds;
    event BatchCreated(uint256 indexed tokenId, string batchId, string materialType, uint256 quantity, string supplier);
    constructor() ERC1155("") {}
    
    /**
     * @dev Override de supportsInterface para resolver conflicto entre ERC1155 y AccessControl
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _createBatch(
        address to,
        string memory batchId,
        string memory materialType,
        string memory supplier,
        uint256 quantity,
        string memory unit,
        string memory qualityGrade,
        uint256 expiryDate
    ) internal returns (uint256) {
        require(bytes(batchId).length > 0, "id");
        require(batchIdToTokenId[batchId] == 0, "dup");
        require(quantity > 0, "qty");
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(to, newTokenId, quantity, "");
        batchMetadata[newTokenId] = BatchMetadata({
            batchId: batchId,
            materialType: materialType,
            supplier: supplier,
            productionDate: block.timestamp,
            expiryDate: expiryDate,
            quantity: quantity,
            unit: unit,
            qualityGrade: qualityGrade
        });
        batchIdToTokenId[batchId] = newTokenId;
        totalSupply[newTokenId] = quantity;
        emit BatchCreated(newTokenId, batchId, materialType, quantity, supplier);
        return newTokenId;
    }
    function getBatchMetadata(uint256 tokenId) public view returns (BatchMetadata memory) {
        return batchMetadata[tokenId];
    }
    function getTokenIdByBatchId(string memory batchId) public view returns (uint256) {
        return batchIdToTokenId[batchId];
    }
} 