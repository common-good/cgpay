<script>
  import st from'#store.js'
  import u from'#utils.js'
  import c from'#constants.js'
  import TxList from './TxList.svelte';
  import { onMount } from 'svelte'

// let pending = $st.recentTxs.reduce((total, tx) => tx.pending ? total + 1 : total + 0, 0)

  onMount(async () => {
    if (u.empty($st.txs)) u.getInfo()
  })
</script>

<section id="dashboard">
  <div class="balance">Balance: <span data-testid="balance">
    {#if u.empty($st.balance)}Connect wifi to see balance.{:else}${u.withCommas($st.balance)}{/if}
  </span></div>
  <div class="txs">
    <h2>Recent Transactions</h2>
    {#if u.empty($st.recentTxs)}
      <p data-testid="none">No transactions yet.</p>
    {:else}
      <TxList useMin={true} />
      {#if $st.recentTxs.length > c.recentTxMin}
        <a class="more link" data-testid="more" href="/txs">View More</a>
      {/if}
    {/if}
  </div>
</section>

<style lang='stylus'>
  .pending
    display block
    margin-bottom $s0

  h2
    text-align center
    margin-bottom $s-3

  p
    text-align center

  section
    width 100%
    display: flex
    flex-direction: column
    align-items: center
    width: 100%

  .balance
    margin-bottom $s-1
    span
      text(2xl)
      font-weight 500
      margin-left $s-3

  .txs
    width 100%
    max-width 600px

  .more
    display block
    text-align center

  @media screen and (max-width $xs-screen)
    .balance
      margin-bottom 0

    h2
      text(lg)
      margin-bottom 0
</style>