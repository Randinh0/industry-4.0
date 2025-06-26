// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract TraceabilityModule {
    struct TraceRecord {
        uint256 timestamp;
        string operation;
        uint256 quantity;
        string fromLocation;
        string toLocation;
        string processId;
        bytes32 traceHash;
    }
    mapping(uint256 => TraceRecord[]) public traceHistory;
    event TraceRecorded(uint256 indexed tokenId, string operation, uint256 quantity, string fromLocation, string toLocation, string processId);
    function _recordTrace(
        uint256 tokenId,
        string memory operation,
        uint256 quantity,
        string memory fromLocation,
        string memory toLocation,
        string memory processId
    ) internal {
        TraceRecord memory newRecord = TraceRecord({
            timestamp: block.timestamp,
            operation: operation,
            quantity: quantity,
            fromLocation: fromLocation,
            toLocation: toLocation,
            processId: processId,
            traceHash: keccak256(abi.encodePacked(tokenId, block.timestamp, quantity, fromLocation, toLocation))
        });
        traceHistory[tokenId].push(newRecord);
        emit TraceRecorded(tokenId, operation, quantity, fromLocation, toLocation, processId);
    }
    function getTraceHistory(uint256 tokenId) public view returns (TraceRecord[] memory) {
        return traceHistory[tokenId];
    }
} 