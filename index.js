class AsdMining {
  license
  isMining = false
  apiUrl
  pingIntervalId = null
  miningTimeoutId = null
  batchSize = 10000 // Number of hashes to try per batch

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

  async start(difficulty, onEvent) {
    onEvent(`[${new Date().toISOString()}]: Starting mining`)
    onEvent(`[${new Date().toISOString()}]: License check...`)
    onEvent(`[${new Date().toISOString()}]: Miner license: ${this.license}`)
    this.isMining = true

    // Set up ping interval
    this.pingIntervalId = setInterval(this.ping.bind(this), 1000 * 5)

    // Start mining process
    this.startMiningCycle(difficulty, onEvent)
  }

  async startMiningCycle(difficulty, onEvent) {
    if (!this.isMining) {
      onEvent(`[${new Date().toISOString()}]: Mining stopped`)
      onEvent(`[${new Date().toISOString()}]: Sync with server...`)
      onEvent(`[${new Date().toISOString()}]: Cleaning up...`)
      onEvent(`[${new Date().toISOString()}]: Miner stopped successfully`)
      return
    }

    try {
      await this.mine(difficulty, onEvent)
      // Schedule next mining cycle
      this.miningTimeoutId = setTimeout(() => {
        this.startMiningCycle(difficulty, onEvent)
      }, 0)
    } catch (error) {
      console.error('Mining error:', error)
      onEvent(`[${new Date().toISOString()}]: Mining error: ${error.message}`)

      // If there's an error, wait a bit before retrying
      this.miningTimeoutId = setTimeout(() => {
        this.startMiningCycle(difficulty, onEvent)
      }, 5000)
    }
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

  async mine(difficulty = 4, onEvent) {
    try {
      onEvent(`[${new Date().toISOString()}]: Fetching pending transactions...`)
      const response = await fetch(this.apiUrl + '/api/system/pending-txs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Error fetching pending transactions')
      }

      const data = await response.text()
      onEvent(`[${new Date().toISOString()}]: Mining block with data: ${data.slice(0, 100)}...`)

      // Use non-blocking mining approach
      const result = await this.nonBlockingMining(data, difficulty, onEvent)

      if (!this.isMining) {
        return null // Mining was stopped during the process
      }

      const { nonce, hash } = result

      onEvent(`[${new Date().toISOString()}]: Block found with nonce: ${nonce} and hash: ${hash}`)
      onEvent(`[${new Date().toISOString()}]: Submitting block...`)

      // Submit nonce
      const submitResponse = await fetch(this.apiUrl + '/api/system/submit-nounce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nounce: nonce // Keeping your original variable name in the API call
        })
      })

      if (!submitResponse.ok) {
        throw new Error('Error submitting block')
      }

      onEvent(`[${new Date().toISOString()}]: Block submitted reward claimed !!!`)

      return nonce
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Non-blocking mining implementation using promises and setTimeout
  nonBlockingMining(data, difficulty, onEvent) {
    return new Promise((resolve) => {
      let nonce = 0

      const processBatch = () => {
        if (!this.isMining) {
          resolve(null)
          return
        }

        const batchEndNonce = nonce + this.batchSize
        let hash = ''

        // Process a batch of nonces
        for (; nonce < batchEndNonce; nonce++) {
          hash = this.advancedHash(data + nonce, 64)
          if (hash.startsWith('0'.repeat(difficulty))) {
            resolve({ nonce, hash })
            return
          }
        }

        // Report progress periodically
        if (nonce % 100000 === 0) {
          onEvent(`[${new Date().toISOString()}]: Mining in progress... Current nonce: ${nonce}`)
        }

        // Schedule next batch with setTimeout to allow UI updates
        setTimeout(processBatch, 0)
      }

      // Start the first batch
      processBatch()
    })
  }

  stop() {
    this.isMining = false
    clearInterval(this.pingIntervalId)
    if (this.miningTimeoutId) {
      clearTimeout(this.miningTimeoutId)
      this.miningTimeoutId = null
    }
  }

  /*
   * Benchmark hash rate
   * @param {number} interval - interval time to calculate hash rate in ms
   * @return {number} hash rate
   */
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