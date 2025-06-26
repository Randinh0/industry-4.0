// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract QualityModule {
    struct QualityData {
        uint256 temperature;
        uint256 humidity;
        uint256 pressure;
        string qualityStatus;
        uint256 lastInspection;
    }
    mapping(uint256 => QualityData) public qualityData;
    event QualityDataUpdated(uint256 indexed tokenId, string qualityStatus);
    function _updateQualityData(
        uint256 tokenId,
        uint256 temperature,
        uint256 humidity,
        uint256 pressure,
        string memory qualityStatus
    ) internal {
        qualityData[tokenId] = QualityData({
            temperature: temperature,
            humidity: humidity,
            pressure: pressure,
            qualityStatus: qualityStatus,
            lastInspection: block.timestamp
        });
        emit QualityDataUpdated(tokenId, qualityStatus);
    }
    function getQualityData(uint256 tokenId) public view returns (QualityData memory) {
        return qualityData[tokenId];
    }
} 