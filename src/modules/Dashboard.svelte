<script>
  import st from'#store.js'
  import u from'#utils.js'
  import c from '#constants.js'
  import { onMount } from 'svelte'

  // let pending = $st.recentTxs.reduce((total, tx) => tx.pending ? total + 1 : total + 0, 0)
  let txs = $st.recentTxs.slice(0, c.recentTxMin)

  onMount(async () => {
    if (!$st.gotInfo) u.getInfo()
  })
</script>
<section id="dashboard">
  <div class="balance">Balance: <span>${u.withCommas($st.balance)}</span></div>
  <div class="txs">
    <h2>Recent Transactions</h2>
    <!-- Pending disabled until Type-To-Charge and Charge Confirm are released -->
    <!-- {#if pending}
      <a class="link pending" href="/pending">{pending} pending</a>
    {:else}
      <div class="pending">Zero pending</div>
    {/if} -->
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
    <a class="link" href="/txs">View More</a>
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
    &:first-of-type
      border-top none
      padding-top $s-2

  section
    width 100%
    display: flex
    flex-direction: column
    align-items: center
    width: 100%

  ul
    margin-bottom $s1

  .balance
    margin-bottom $s1
    span
      text(2xl)
      font-weight 500
      margin-left $s-3

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

  .txs
    width 100%
    max-width 600px

  @media screen and (max-width $xs-screen)
    .balance
      margin-bottom 0

    h2
      margin-bottom 0
</style>