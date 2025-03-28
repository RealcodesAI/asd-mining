import AsdMining from './index.js';

// Initialize the miner
const miner = AsdMining.getInstance('demo-license', 'https://be.asdscan.ai');

// First, benchmark the device
console.log('Benchmarking your device...');
miner.calculateHashRate(1000).then(hashRate => {
  console.log(`Your device can mine at approximately ${hashRate} hashes per second`);

  // Start mining if hash rate is sufficient
  if (hashRate > 1000) {
    console.log('Starting mining process...');
    miner.start((progress,log) => {
      console.log(progress);
      if(log) {
        console.log(log);
      }
    });

    // Stop after 2 minutes for this demo
    setTimeout(() => {
      miner.stop();
      console.log('Mining stopped after 2 minutes');
    }, 50_000);
  } else {
    console.log('Hash rate too low for efficient mining');
  }
});