<script>
  let balance = '100.00'
</script>

<section id="balance">
  <div>Available Balance: </div>
  <div><span class="currency-symbol">$</span>{ balance }</div>
</section>

<style lang='stylus'>
  section
    display flex
    justify-content space-between
    width 100%
    border-bottom solid 1px $c-gray
    padding 0 $s-2 $s-2

  .currency-symbol
    margin-right $s-4
</style>