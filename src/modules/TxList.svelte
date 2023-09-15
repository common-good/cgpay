<script>
  import st from'#store.js'
  import c from '#constants.js'
  import u from'#utils.js'

  export let useMin;
</script>
<ul>
  {#key $st.recentTxs}{#each useMin ? $st.recentTxs.slice(0, c.recentTxMin) : $st.recentTxs as tx}
    <li>
      <div class="row">
        <div><span>{tx.pending ? 'Pending' : u.fmtDate(1000 * tx.created)}</span></div>
      </div>
      <div class="row">
        <div class="name">{tx.name}</div>
        <div class="rgt amt { tx.amount.startsWith('-') ? 'neg' : 'pos'}">${u.withCommas(tx.amount)}</div>
      </div>
      <div class="row">
        <div class="rgt desc">{tx.description}</div>
      </div>
    </li>
  {/each}{/key}
</ul>

<style lang='stylus'>
  li
    border-top solid 1px
    margin-bottom $s-1
    padding-top $s-1
    &:first-of-type
      border-top none

  ul
    margin-bottom $s-1

  .balance
    margin-bottom $s0
    span
      text(2xl)
      font-weight 500
      margin-left $s-3

  .for
    font-weight: 600
    margin-right: $s-3

  .name
    font-weight: 500

  .row
    width 100%
    display flex
    justify-content space-between
    &:first-of-type
      text(sm)
    &:last-of-type 
      justify-content: unset

  .rgt
    text-align right

  .amt
    font-weight 500

  .pos
    color $c-green-dark

  .neg
    color $c-red

  @media screen and (max-width $xs-screen)
    ul
      text(sm)

    li
      margin-bottom $s-2
      padding-top $s-2
</style>