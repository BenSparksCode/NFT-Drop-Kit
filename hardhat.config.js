require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");

require("dotenv").config();

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  mocha: {
    timeout: 300000, //300 seconds
  },
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  loggingEnabled: true,
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: true,
  },
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    hardhat: {
      forking: {
        url:
          "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_API,
        blockNumber: 19872200,
      },
      accounts: {
        accountsBalance: "1000000000000000000000000", //1 million ETH to signers
      },
      gasPrice: 0,
    },
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/" + process.env.ALCHEMY_API,
      accounts: [`${process.env.RINKEBY_DEPLOYER_PRIV_KEY}`],
      chainId: 4,
    },
    mainnet: {
      url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API,
      accounts: [`${process.env.MAINNET_DEPLOYER_PRIV_KEY}`],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
