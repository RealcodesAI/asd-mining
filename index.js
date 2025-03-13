class AsdMining {
  license
  isMining = false
  apiUrl
  pingIntervalId = null

  constructor(license, apiUrl) {
    this.license = license
    this.apiUrl = apiUrl
  }

  async start(onEvent) {
    onEvent(`[${new Date().toISOString()}]: Starting mining`)
    onEvent(`[${new Date().toISOString()}]: License check...`)
    onEvent(`[${new Date().toISOString()}]: Miner license: ${this.license}`)
    this.isMining = true
    //ping to make device active
    this.pingIntervalId = setInterval(this.ping.bind(this), 1000 * 5)
    //start mining
    while (true) {
      if (!this.isMining) {
        onEvent(`[${new Date().toISOString()}]: Mining stopped`)
        onEvent(`[${new Date().toISOString()}]: Sync with server...`)
        onEvent(`[${new Date().toISOString()}]: Cleaning up...`)
        onEvent(`[${new Date().toISOString()}]: Miner stopped successfully`)
        break
      }
      await this.mine(4, onEvent)
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

  async mine(dificulty = 4, onEvent) {
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
      let nounce = 0
      let hash = ''
      while (true) {
        const msgBuffer = new TextEncoder().encode(data + nounce)
        hash = await crypto.subtle.digest('SHA-256', msgBuffer)
        //convert hash to hex string
        hash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')

        if (hash.startsWith('0'.repeat(dificulty))) {
          break
        }
        nounce++
      }
      onEvent(`[${new Date().toISOString()}]: Block found with nonce: ${nounce} and hash: ${hash}`)
      onEvent(`[${new Date().toISOString()}]: Submitting block...`)
      //submit nonce
      await fetch(this.apiUrl + '/api/system/submit-nounce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nounce
        })
      })
      onEvent(`[${new Date().toISOString()}]: Block submitted reward claimed !!!`)

      return nounce
    } catch (err) {
      console.log(err)
    }
  }

  stop() {
    this.isMining = false
    clearInterval(this.pingIntervalId)
  }

  /*
 * Benchmark hash rate
 * @param {number} interval - interval time to calculate hash rate in ms
 * @return {number} hash rate
 * */
  async calculateHashRate(interval) {
    return new Promise(async (resolve) => {
      //benchmark hash rate
      let start = Date.now();
      let nonce = 0;
      let hashCount = 0;

      while (true) {
        // Convert nonce to buffer
        const msgBuffer = new TextEncoder().encode(nonce.toString());

        // Use the Web Crypto API for hashing
        await crypto.subtle.digest('SHA-256', msgBuffer);

        hashCount++;
        nonce++;
        const now = Date.now();
        if (now - start >= interval) {
          break;
        }
      }

      resolve(Math.floor(hashCount / interval * 1000)); // Convert to hashes per second
    });
  }

}

export default AsdMining