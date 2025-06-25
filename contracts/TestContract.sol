// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestContract
 * @dev Contrato de prueba para verificar la configuración de Hardhat
 */
contract TestContract is Ownable {
    string public name;
    uint256 public value;
    
    event ValueUpdated(uint256 oldValue, uint256 newValue);
    
    constructor(string memory _name, uint256 _initialValue) Ownable(msg.sender) {
        name = _name;
        value = _initialValue;
    }
    
    function updateValue(uint256 _newValue) public onlyOwner {
        uint256 oldValue = value;
        value = _newValue;
        emit ValueUpdated(oldValue, _newValue);
    }
    
    function getInfo() public view returns (string memory, uint256) {
        return (name, value);
    }
} 