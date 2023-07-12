<script>
  import st from'#store.js'
  import u from'#utils.js'
  import { onMount } from 'svelte'

  onMount(() => st.setLeft('back'))
</script>

<section id="txs">
  <h1 class="page-title">Transaction History</h1>
  <p>View your complete history at <a class="link" target="_blank" href="https://new.commongood.earth/history">commongood.earth</a>.</p>
  <p class="tx-amt">{$st.recentTxs.length} Recent Transactions</p>
  <ul>
    {#each $st.recentTxs as tx}
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
  {/each}
  </ul>
</section>

<style lang='stylus'>
  li
    border-top solid 1px
    margin-bottom $s0
    padding-top $s-1
    &:first-of-type
      border-top none

  p
    margin-bottom $s0

  section
    padding-bottom $s0
    text-align center

  ul
    margin-bottom $s2

  .row
    width 100%
    display flex
    justify-content space-between
    &:first-of-type
      margin-bottom $s-4

  .amt
    font-weight 500

  .pos
    color $c-green-dark

  .neg
    color $c-red

  .tx-amt
    font-weight 500
    text-align left
    margin-bottom 0
</style>