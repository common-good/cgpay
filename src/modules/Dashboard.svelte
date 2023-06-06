<script>
  import st from'#store.js'
  import u from'#utils.js'
  import c from '#constants.js'
  import { onMount } from 'svelte'

  const me = $st.myAccount
  let info = {}
  let txs = $st.recentTxs
  let minTxs = $st.recentTxs.slice(0, c.recentTxMin)
  let balance = $st.balance
  let pending = txs.reduce((total, tx) => tx.pending ? total + 1 : total + 0, 0)

  async function getInfo() {
    try {
      const params = {deviceId:me.deviceId, actorId:me.accountId, count:c.recentTxMax }
      info = await u.postRequest('info', params)
      st.setBalance(balance = info.balance)
      st.setRecentTxs(txs = info.txs)
      st.setGotInfo(true)
      //      balance, surtxs: {}, txs: [{xid, amount, accountId, name, description, created}, …]}
      //  where surtxs: {amount, portion, crumbs, roundup}
    } catch (er) { console.log('info er', er) }
  }

  onMount(async () => {
    if (!$st.gotInfo) getInfo()
  })

</script>
<section id="dashboard">
  <div class="balance">Balance: <span>${balance}</span></div>
  <div class="txs">
    <h2>Recent Transactions</h2>
    {#if pending}
      <a class="link pending" href="/pending">{pending} pending</a>
    {:else}
      <div class="pending">Zero pending</div>
    {/if}
    {#if !txs.length}
    <p>No transactions yet.</p>
    {:else}
    <ul>
      {#key $st.recentTxs}{#each minTxs as tx}
        <li>
          <div class="row">
            <div class><span>{tx.pending ? 'Pending' : u.fmtDate(1000 * tx.created)}</div>
            <div class="rgt">${u.withCommas(tx.amount)}</div>
          </div>
          <div class="row">
            <div class>{tx.name}</div>
            <div class="rgt">{tx.description}</div>
          </div>
        </li>
      {/each}{/key}
    </ul>
    <a class="link" href="/txs">View More Transactions</a>
    {/if}
  </div>
</section>

<style lang='stylus'>
  .pending
    display block
    margin-bottom $s0

  h2
    text-align center
    margin-bottom $s0

  li
    border-top solid 1px
    margin-bottom $s0
    padding-top $s-1

  section
    width 100%

  ul
    margin-bottom $s1

  .balance
    margin-bottom $s1

  .row
    width 100%
    display flex
    justify-content space-between
    &:first-of-type
      margin-bottom $s-4

  .rgt
    text-align right
</style>