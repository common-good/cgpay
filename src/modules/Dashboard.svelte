<script>
  import st from'#store.js'
  import u from'#utils.js'
  import c from '#constants.js'
  import { onMount } from 'svelte'

  let pending = $st.recentTxs.reduce((total, tx) => tx.pending ? total + 1 : total + 0, 0)

  onMount(async () => {
    if (!$st.gotInfo) u.getInfo()
  })

</script>
<section id="dashboard">
  <div class="balance">Balance: <span>${u.withCommas($st.balance)}</span></div>
  <div class="txs">
    <h2>Recent Transactions {#if !$st.recentTxs.length}(none){/if}</h2>
    {#if pending}
      <a class="link pending" href="/pending">{pending} pending</a>
    {:else}
      <div class="pending">Zero pending</div>
    {/if}
    {#if u.empty($st.recentTxs)}
      <p>No transactions yet.</p>
    {:else}
      <ul>
      {#key $st.recentTxs}{#each $st.recentTxs.slice(0, c.recentTxMin) as tx}
        <li>
          <div class="row">
            <div class><span>{tx.pending ? 'Pending' : u.fmtDate(1000 * tx.created)}</div>
            <div class="rgt amt { tx.amount.startsWith('-') ? 'neg' : 'pos'}">${u.withCommas(tx.amount)}</div>
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

  .amt
    font-weight 500

  .pos
    color $c-green-dark

  .neg
    color $c-red
</style>