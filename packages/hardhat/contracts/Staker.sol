pragma solidity >=0.6.0 <0.7.0;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract Staker {

ExampleExternalContract public exampleExternalContract;
    
    mapping ( address => uint256 ) public balances;
    uint256 public constant threshold = 0.05 ether;
    uint256 public deadline = block.timestamp + 45 seconds;
    
    modifier notCompleted {
        require(
            exampleExternalContract.completed() == false,
            "Not completed."
        );
        _;
    }

    event Stake(address,uint256);
    event Withdraw(address,uint256);
    event Execute(address,uint256);
    
    constructor(address exampleExternalContractAddress) public {
        exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
    }

  // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
  //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )
    function stake() payable public notCompleted {
        require(block.timestamp < deadline);
        emit Stake(msg.sender, msg.value);
        balances[msg.sender] += msg.value;
    }

  // After some `deadline` allow anyone to call an `execute()` function
  //  It should either call `exampleExternalContract.complete{value: address(this).balance}()` to send all the value

  function execute() public {
      require(block.timestamp < deadline);
      require(address(this).balance >= threshold); 
      emit Execute(msg.sender, block.timestamp);
      exampleExternalContract.complete{value: address(this).balance}();
  }

  // if the `threshold` was not met, allow everyone to call a `withdraw()` function

  function withdraw() public notCompleted {
      require(block.timestamp > deadline);
      uint amount = balances[msg.sender];
      emit Withdraw(msg.sender, amount);
      balances[msg.sender] = 0;
      msg.sender.transfer(amount);
  }
  
  function timeLeft() public view returns(uint256) {
      if (deadline  > block.timestamp) { 
      return deadline - block.timestamp;
      } else {
      return 0;
      }
  }
  
  function totalBalance() public view returns (uint256) {
      return address(this).balance;
  }
}
