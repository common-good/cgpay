<script>
  import st from'#store.js'
  console.log($st.myAccount)
</script>
<section id="dashboard">
  <p>Account: {$st.myAccount?.accountId}</p>
  <p>Balance: ${balance}</p>
  <h2>Recent Transactions: {#if !recents.length}(none){/if}</h2>
  {#each recents as tx}
    <p>{tx.created}: {tx.who}${tx.amount} (#{tx.id})</p>
  {/each}
</section>