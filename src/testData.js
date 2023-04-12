const td = {
  flushOk: false, // wait until a test sets this to true before uploading txs and comments
  counters: { enQ:0, deQ:0, post:0 }, // track how many times crucial functions or actions have been called
}

export default td
