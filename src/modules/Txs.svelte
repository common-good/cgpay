<script>
  import st from'#store.js'
  import TxList from './TxList.svelte';
  import { onMount } from 'svelte'

  onMount(() => st.setLeft('back'))
</script>

<section id="txs">
  <h1 class="page-title">Transaction History</h1>
  <p>View your complete history at <a class="link" target="_blank" href="https://new.commongood.earth/history">commongood.earth</a>.</p>
  <p class="tx-amt">{$st.recentTxs.length} Recent Transactions</p>
  <TxList />
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