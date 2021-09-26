// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8;

import "hardhat/console.sol";

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


contract DoublyLinkedNode {
    address private _parent;
    address private _child;
    
    constructor(address parent, address child){
        if (parent != address(0x0)) {
            _parent = parent;
        } else {
            _parent = address(this);
        }

        if (child != address(0x0)) {
            _child = child;
        } else {
            _child = address(this);
        }
    }

    function addChild(address newChild) internal {
        DoublyLinkedNode(_child).changeParent(newChild);
        _child=newChild;
    }

    function changeParent(address parent) public {
        require(msg.sender == _parent,"Only the parent can ask to be changed");
        _parent=parent;
    }

    function delist() internal {
        DoublyLinkedNode(_parent).removeChild();
        DoublyLinkedNode(_child).changeParent(_parent);
        _parent = address(this);
        _child = address(this);        
    }

    function removeChild() public {
        require(msg.sender == _child,"Only the child can ask to be removed");
        _child=DoublyLinkedNode(_child).Child();
    }
    
    function Parent() public view returns(address) {
        return _parent;
    }
    
    function Child() public view returns(address) {
        return _child;
    }
}

//SisyphusGambleVenues is a registry of the Sisyphus gamble venues, it's also the guard of the Circular Doubly Linked List
contract SisyphusGambleVenues is DoublyLinkedNode(address(0x0), address(0x0)) {
    event  NewSisyphusGamble(address indexed sisyphusGamble, IERC20 indexed token, uint256 startingPrize, uint256 minGamble, uint8 weight, uint24 gamblingBlocks);

    function newSisyphusGamble(IERC20 token, uint256 startingPrize, uint256 minGamble, uint8 weight, uint24 gamblingBlocks) public returns(address) {
        require(minGamble <= startingPrize,"Starting prize must be at least as much as a minimum gamble");

        SisyphusGamble l = new SisyphusGamble(token, minGamble, weight, gamblingBlocks, address(this), Child());
        addChild(address(l));

        require(token.transferFrom(msg.sender, address(l), startingPrize), "Unable to transfer the starting fund amount");
        emit NewSisyphusGamble(address(l), token, startingPrize, minGamble, weight, gamblingBlocks);

        return address(l);
    }

    struct sisyphusGamble { 
        address sisyphusGamble;
        uint8   weight;
        uint24  gamblingBlocks;
        IERC20  token;
        uint256 totalPrize;
        address lastGambler;
        uint256 endBlock;
        uint256 minGamble;
    }
    
    //Covert the Doubly Linked List representation to an array
    function getSisyphusGambleVenues() public view returns(sisyphusGamble[] memory){
        uint256 length = 0;
        for (address c=this.Child(); c != address(this); c=DoublyLinkedNode(c).Child()) {
            length++;
        }
        
        uint256 i = 0;
        sisyphusGamble[] memory ll = new sisyphusGamble[](length);
        for (address c=this.Child(); c != address(this); c=DoublyLinkedNode(c).Child()) {
            SisyphusGamble l = SisyphusGamble(c);
            ll[i] = sisyphusGamble(c,l.weight(),l.gamblingBlocks(),l.token(),l.totalPrize(),l.lastGambler(),l.endBlock(),l.minGamble());
            i++;
        }
    
        return ll;
    }
}


contract SisyphusGamble is DoublyLinkedNode {
    address public  lastGambler;
    uint256 public  endBlock;
    uint256 public  minGamble;
    
    //Constant after initialization
    IERC20  public  token;
    uint8   public  weight;
    uint24  public  gamblingBlocks;

    event           Gamble(address indexed gambler, uint256 totalPrize, uint256 endBlock, uint256 newMinGamble);
    event           ClaimPrize(address indexed winner, uint256 totalPrize);
    
    constructor(IERC20 token_, uint256 minGamble_, uint8 weight_, uint24 gamblingBlocks_, address parent_, address child_)
    DoublyLinkedNode(parent_, child_) {
        require(minGamble_ > 0,"Minimum gamble must be a non zero amount");
        require(gamblingBlocks_ > 0,"Gambling blocks must be a non zero quantity");

        token=token_;
        minGamble=minGamble_;
        weight=weight_;
        gamblingBlocks=gamblingBlocks_;
        endBlock=type(uint256).max;
    }
    
    function gamble(uint256 amount) public returns(uint256) {
        require(amount >= minGamble,"Gamble more to partecipate");
        console.log("block.number", block.number);
        console.log("endBlock", endBlock);
        require(block.number < endBlock,"This gambling session has already closed");
        
        lastGambler=msg.sender;
        endBlock=block.number+gamblingBlocks;

        //This is an exponential moving average (a*minGamble  + (1-a)*amount) where a = (2**weight - 1)/2**weight
        //weight=255: minGamble is constant, unless amount - minGamble >= 2^255, but even then the change is +1.
        //weight=1: minGamble equal to the last amount. 
        //amount - minGamble >= 0 so it's never decreasing.
        minGamble += (amount - minGamble) >> weight;
        
        require(token.transferFrom(msg.sender, address(this), amount), "Unable to transfer the gambled amount");
        emit Gamble(msg.sender, totalPrize(), endBlock, minGamble);

        return endBlock;
    }
    
    function claimPrize() public {
        console.log("block.number", block.number);
        console.log("endBlock", endBlock);
        
        require(msg.sender == lastGambler,"You're not the last gambler");
        require(block.number >= endBlock,"Not enough blocks have passed since the last gamble");

        uint256 amount = totalPrize();
        require(token.transfer(msg.sender, amount));
        emit ClaimPrize(msg.sender, amount);
        
        super.delist();
        selfdestruct(payable(msg.sender));
    }

    function totalPrize() public view returns(uint256) {
        return token.balanceOf(address(this));
    }
}