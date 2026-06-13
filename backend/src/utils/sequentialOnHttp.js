const { getAdapterMode } = require('../config/db');

const isHttpMode = () => getAdapterMode() === 'http';

/** Run tasks in parallel on TCP pool; sequential on Neon HTTP to avoid connection spikes. */
const sequentialOnHttp = async (tasks) => {
  if (isHttpMode()) {
    const results = [];
    for (const task of tasks) {
      results.push(await task());
    }
    return results;
  }
  return Promise.all(tasks.map((task) => task()));
};

module.exports = { sequentialOnHttp, isHttpMode };
