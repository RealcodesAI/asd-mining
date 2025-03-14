# ASD Mining

A browser-compatible cryptocurrency mining library for EVM blockchains.

## Installation

```bash
npm install asd-mining
```

## Usage

```javascript
import AsdMining from 'asd-mining';

// Initialize the miner with your license key and API URL
const miner = AsdMining.getInstance('your-license-key', 'https://api.example.com');

// Calculate hash rate
miner.calculateHashRate(5000).then(hashRate => {
  console.log(`Your device can mine at approximately ${hashRate} hashes per second`);
});

// Start mining
miner.start(event => {
  console.log(event); // Log mining events
});

// Stop mining
setTimeout(() => {
  miner.stop();
  console.log('Mining stopped after 1 minute');
}, 60000);
```

## API Reference

### Constructor

```javascript
new AsdMining(license, apiUrl)
```

- `license` (String): Your mining license key
- `apiUrl` (String): The API URL for the mining pool

### Methods

#### start(onEvent)

Starts the mining process.

- `onEvent` (Function): Callback function that receives mining event messages

#### stop()

Stops the mining process.

#### calculateHashRate(interval)

Benchmarks the device's mining performance.

- `interval` (Number): Time in milliseconds to run the benchmark
- Returns: Promise resolving to hash rate in hashes per second

## License

ISC