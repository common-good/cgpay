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
      </div>
      <div class="row">
        <div class="lft">
          {u.fmtDate(tx.created)}
          <span class="name">{tx.name}</span>
          {#if tx.pending}<span data-testid="tx-pending">(pending)</span>{/if}
        </div>
        <div class="rgt amt { +tx.amount < 0 ? 'neg' : 'pos' }">$<span data-testid="amt">{u.withCommas(tx.amount)}</span></div>
      </div>
      <div class="row">
        <div class="desc" data-testid="description">{tx.description}</div>
        {#if +tx.extra != 0}
          <div class="rgt extra" data-testid="extra">{ +tx.extra < 0 ? '' : '+' }{u.withCommas(tx.extra)}</div>
        {/if}
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

  .for
    font-weight 600
    margin-right $s-3

  .name
    font-weight 500

  .row
    width 100%
    display flex
    justify-content space-between
    &:first-of-type
      text(sm)

  .lft
    text-align left

  .rgt
    text-align right

  .amt
    font-weight 500

  .extra
    font-size 85%
    color silver

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