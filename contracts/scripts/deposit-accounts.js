const { ethers } = require("hardhat");

async function main() {
  const MIN_BALANCE = ethers.parseEther("100");
  // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const provider = ethers.provider;
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const addresses = [
    { address: "0x966b30e576a4d6731996748b48dd67c94ef29067", amount: ethers.parseEther("50000") },
    { address: "0x4fef21f1d42e0d23d72100aefe84d555781c31bb", amount: ethers.parseEther("1000") },
    { address: "0x0c1efcca2bcb65a532274f3ef24c044ef4ab6d73", amount: ethers.parseEther("1000") },
    { address: "0x8ab0CF264DF99D83525e9E11c7e4db01558AE1b1", amount: ethers.parseEther("1000") },
    { address: "0xf386573563c3a75dbbd269fce9782620826ddac2", amount: ethers.parseEther("1000") }
  ];

  const gasPrice = (await provider.getFeeData()).gasPrice;

  for (let { address, amount } of addresses) {
    try {
      const balance = await provider.getBalance(address);
      if (balance < MIN_BALANCE) {
        const transactionResponse = await wallet.sendTransaction({
          to: address,
          value: amount,
          gasPrice: gasPrice,
          gasLimit: 46000,
        });
        await transactionResponse.wait();
        const newBalance = await provider.getBalance(address);
        console.log(`${address} has ${ethers.formatEther(newBalance)} after transfer, transaction hash: ${transactionResponse.hash}`);
      } else {
        console.log(`${address} has sufficient balance, current balance: ${ethers.formatEther(balance)}`);
      }
    } catch (error) {
      console.error(`Failed to send transaction to ${address}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
