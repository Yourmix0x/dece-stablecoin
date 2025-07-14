// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    string public name;
    string public symbol;
    uint8 public immutable decimal;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimal) {
        name = _name;
        symbol = _symbol;
        decimal = _decimal;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        return _transfer(msg.sender, to, value);
    }

    function _mint(address to, uint256 value) internal {
        balanceOf[to] += value;
        totalSupply += value;
    }

    function _burn(address from, uint256 value) internal {
        balanceOf[from] -= value;
        totalSupply -= value;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        require(
            allowance[from][msg.sender] >= value,
            "ERC20: Insufficient allwoance"
        );

        allowance[from][msg.sender] -= value;

        emit Approval(from, msg.sender, allowance[from][msg.sender]);

        bool success = _transfer(from, to, value);
        return success;
    }
    function _transfer(
        address from,
        address to,
        uint256 value
    ) private returns (bool) {
        require(balanceOf[from] >= value, "ERC20: Insufficient sender balance");

        emit Transfer(from, to, value);

        balanceOf[from] -= value;

        balanceOf[to] += value;

        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] += value;

        emit Approval(msg.sender, spender, value);

        return true;
    }
}
