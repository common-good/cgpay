<script>
  import st from'#store.js'
  import u from'#utils.js'
  import { onMount } from 'svelte'
  console.log($st.myAccount)

  let info = {}
  let txs = []
  const me = $st.myAccount

  onMount(async () => {
    try {
      const params = {deviceId:me.deviceId, actorId:me.accountId, lastTx:me.lastTx || -1 }
      info = await u.postRequest('info', params)
      console.log('info', info)
//      balance, surtxs: {}, txs: [{xid, amount, accountId, name, description, created}, …]}
//  where surtxs: {amount, portion, crumbs, roundup}

    } catch (er) { if (!u.isTimeout(er)) console.log('info er', er) }
  })

</script>
<section id="dashboard">
  <p>Account: {$st.myAccount?.accountId}</p>
  <p>Balance: ${info.balance}</p>
  <h2>Recent Transactions: {#if !txs.length}(none){/if}</h2>
  {#each txs as tx}
    <p>{u.fmtDate(tx.created)}: {tx.who}${tx.amount} (#{tx.id})</p>
  {/each}
</section>