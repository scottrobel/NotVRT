require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");

const privateKey =
  "f552d2e4d84292dae6c2af7f8a1e9c0edd37ed61a93b551311b30ecce9582f91";
const privateKey2 =
  "77da7124a6a198d0c81e39dc4c2185b950246b3b50f7b0cd37b584e89b224655";
const apiKeyForEtherscan = "MTT524YDNDERGUUCYMPSHA5F8QF847RNND";
const optimizerEnabled = !process.env.OPTIMIZER_DISABLED;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  abiExporter: {
    path: "./abis",
    clear: true,
    flat: true,
  },
  etherscan: {
    apiKey: apiKeyForEtherscan,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
  },
  mocha: {
    timeout: 30000,
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // chainId: 4 //rinkeby
      // chainId: 97, //bsctestnet
      chainId: 1337, //hardhat localhost
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    bsctestnet: {
      url: `https://data-seed-prebsc-1-s2.binance.org:8545`,
      accounts: [privateKey, privateKey2],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 1,
          },
          evmVersion: "berlin",
        },
      },
    ],
  },
};
