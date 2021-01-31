pragma solidity >=0.6.0 <0.7.0;

contract ExampleExternalContract {

  bool public completed;

  function complete() public payable {
    completed = true;
  }
  
  function totalBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function flush() public {
    msg.sender.transfer(address(this).balance);
  }
  
}
