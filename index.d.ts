declare class AsdMining {
  license: string;
  isMining: boolean;
  apiUrl: string;
  pingIntervalId: number | null;

  /**
   * Creates an instance of AsdMining.
   * @param {string} license - The license key for mining
   * @param {string} apiUrl - The API URL for the mining pool
   */
  constructor(license: string, apiUrl: string);

  /**
   * Starts the mining process
   * @param {(message: string) => void} onEvent - Callback function for mining events
   * @returns {Promise<void>}
   */
  start(onEvent: (message: string) => void): Promise<void>;

  /**
   * Pings the server to keep the device active
   * @returns {Promise<void>}
   */
  ping(): Promise<void>;

  /**
   * Mines a block with the specified difficulty
   * @param {number} [difficulty=4] - The mining difficulty (number of leading zeros)
   * @param {(message: string) => void} onEvent - Callback function for mining events
   * @returns {Promise<number|undefined>} - The nonce value if mining is successful
   */
  mine(difficulty?: number, onEvent?: (message: string) => void): Promise<number|undefined>;

  /**
   * Stops the mining process
   */
  stop(): void;

  /**
   * Benchmarks the device's hash rate
   * @param {number} interval - The benchmark duration in milliseconds
   * @returns {Promise<number>} - The hash rate in hashes per second
   */
  calculateHashRate(interval: number): Promise<number>;
}

export default AsdMining;