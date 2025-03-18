class AsdMining {
  license
  isMining = false
  apiUrl
  pingIntervalId = null
  miningIntervalId = null

  static instance = null

  static getInstance(license, apiUrl) {
    if (!AsdMining.instance) {
      AsdMining.instance = new AsdMining(license, apiUrl)
    }
    return AsdMining.instance
  }

  constructor(license, apiUrl) {
    this.license = license
    this.apiUrl = apiUrl
  }

  createHash(input, seed = 0) {
    // Convert input to string if it's not already
    const str = String(input);

    // FNV-1a parameters
    const PRIME = 16777619;
    const OFFSET_BASIS = 2166136261;

    // Initialize hash with seed
    let hash = OFFSET_BASIS ^ seed;

    // Process each character in the input string
    for (let i = 0; i < str.length; i++) {
      // Get the character code
      const char = str.charCodeAt(i);

      // FNV-1a algorithm
      hash ^= char;
      hash = Math.imul(hash, PRIME) | 0; // Use Math.imul for 32-bit multiplication
    }

    // Convert to unsigned 32-bit integer
    hash = hash >>> 0;

    // Convert to hexadecimal string
    return hash.toString(16).padStart(8, '0');
  }

  advancedHash(input, length = 32) {
    let result = '';

    // Use different seeds to generate hash segments until we reach desired length
    for (let i = 0; result.length < length; i++) {
      result += this.createHash(input + i, i);
    }

    // Trim to exact length
    return result.substring(0, length);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }


  async start(onEvent) {
    onEvent(0, `[${new Date().toISOString()}]: Starting mining`)
    onEvent(0, `[${new Date().toISOString()}]: License check...`)
    await this.sleep(1000)
    onEvent(0, `[${new Date().toISOString()}]: Miner license: ${this.license}`)
    onEvent(0, `-------------------------------------------------------------`)
    this.isMining = true

    // Set up ping interval
    this.pingIntervalId = setInterval(this.ping.bind(this), 1000 * 5)
    this.miningIntervalId = setInterval(this.mine.bind(this, onEvent), 4000)
  }


  async ping() {
    try {
      const resp = await fetch('https://miner.asdscan.ai/ping/' + this.license)
      if (!resp.ok) {
        throw new Error('Error pinging')
      }
    } catch (err) {
      console.log(err)
    }
  }

  getPendingTransactions() {
    // Number of random transactions to generate
    const count = Math.floor(Math.random() * 10) + 5; // 5-15 transactions
    const pendingTransactions = [];

    // Common EVM token addresses
    const tokenAddresses = [
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'  // WETH
    ];

    // Generate random transactions
    for (let i = 0; i < count; i++) {
      // Generate random wallet addresses
      const fromAddress = '0x' + Array.from({length: 40}, () =>
        Math.floor(Math.random() * 16).toString(16)).join('');

      const toAddress = '0x' + Array.from({length: 40}, () =>
        Math.floor(Math.random() * 16).toString(16)).join('');

      // Random gas values (in wei)
      const gasPrice = Math.floor(Math.random() * 200 + 10) * 1e9; // 10-210 gwei
      const gasLimit = Math.floor(Math.random() * 100000) + 21000; // 21000-121000

      // Random transaction value and nonce
      const value = Math.random() < 0.5 ?
        '0x0' : // 50% chance of 0 (for token transfers)
        '0x' + (Math.floor(Math.random() * 1000 * 1e18)).toString(16); // 0-1000 ETH

      const nonce = Math.floor(Math.random() * 1000);

      // Transaction type (0 = legacy, 1 = EIP-2930, 2 = EIP-1559)
      const txType = Math.floor(Math.random() * 3);

      let transaction = {
        hash: '0x' + Array.from({length: 64}, () =>
          Math.floor(Math.random() * 16).toString(16)).join(''),
        from: fromAddress,
        to: toAddress,
        value,
        nonce: '0x' + nonce.toString(16),
        gas: '0x' + gasLimit.toString(16),
        type: txType,
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 300), // Within last 5 minutes
        status: 'pending'
      };

      // Add type-specific fields
      if (txType === 0) {
        // Legacy transaction
        transaction.gasPrice = '0x' + gasPrice.toString(16);
      } else if (txType === 1 || txType === 2) {
        // EIP-1559 transaction
        const maxPriorityFeePerGas = Math.floor(gasPrice * 0.2);
        transaction.maxFeePerGas = '0x' + gasPrice.toString(16);
        transaction.maxPriorityFeePerGas = '0x' + maxPriorityFeePerGas.toString(16);
      }

      // Random chance for token transfer (ERC-20)
      if (Math.random() < 0.6) {
        const randomTokenIdx = Math.floor(Math.random() * tokenAddresses.length);
        transaction.to = tokenAddresses[randomTokenIdx]; // Token contract

        // Add input data for token transfer function
        // Format: transfer(address,uint256)
        const methodId = '0xa9059cbb'; // transfer method ID
        const paddedAddress = toAddress.slice(2).padStart(64, '0');
        const randomAmount = Math.floor(Math.random() * 1000000 * 1e6); // 0-1M tokens with 6 decimals
        const paddedAmount = randomAmount.toString(16).padStart(64, '0');

        transaction.input = methodId + paddedAddress + paddedAmount;
      } else {
        transaction.input = '0x';
      }

      pendingTransactions.push(transaction);
    }

    return pendingTransactions;
  }

  async mine(onEvent) {
    onEvent(0, `[${new Date().toISOString()}]: Fetching pending transactions...`)
    await this.sleep(500)
    onEvent(10, `[${new Date().toISOString()}]: Mining block with data: ${JSON.stringify(this.getPendingTransactions()).slice(0, 100)}...`)
    await this.sleep(500)
    onEvent(20, '[${new Date().toISOString()}]: Hashing in progress... Current nonce: 0')
    await this.sleep(200)
    onEvent(30, null)
    await this.sleep(200)
    onEvent(40, null)
    await this.sleep(200)
    onEvent(50, null)
    await this.sleep(200)
    onEvent(60, null)
    await this.sleep(200)
    onEvent(70, null)
    await this.sleep(200)
    const nonce = Math.floor(Math.random() * 1000000)
    const hash = this.advancedHash('data' + nonce, 64)
    onEvent(80, `[${new Date().toISOString()}]: Block found with nonce: ${nonce} and hash: ${hash}`)
    await this.sleep(500)
    onEvent(90, `[${new Date().toISOString()}]: Submitting block...`)
    await this.sleep(500)
    onEvent(100, `[${new Date().toISOString()}]: Block submitted reward claimed !!!`)
  }


  stop() {
    this.isMining = false
    clearInterval(this.pingIntervalId)
    clearInterval(this.miningIntervalId)
  }

  async calculateHashRate(interval) {
    return new Promise(async (resolve) => {
      // Benchmark hash rate
      let start = Date.now();
      let nonce = 0;
      let hashCount = 0;
      const batchSize = 1000;

      const processBatch = () => {
        const now = Date.now();
        if (now - start >= interval) {
          resolve(Math.floor(hashCount / interval * 1000)); // Convert to hashes per second
          return;
        }

        for (let i = 0; i < batchSize; i++) {
          this.advancedHash(nonce, 64);
          hashCount++;
          nonce++;
        }

        // Use setTimeout to yield to the main thread
        setTimeout(processBatch, 0);
      };

      processBatch();
    });
  }
}

export default AsdMining