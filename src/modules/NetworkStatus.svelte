<script>
  import st from'#store.js'
  import WifiOff from "svelte-material-icons/WifiOff.svelte"

  let txsWaiting
$: txsWaiting = $st.txs.length ? (' (' + $st.txs.length + ' transactions to upload)') : ''
</script>

{ #if !$st.online }
  <section id='network-status'>
    <span><WifiOff size={"1rem"} /></span><p data-testid="network-offline">Network OFFLINE{txsWaiting}</p>
  </section>
{ /if }

<style lang='stylus'>
  section
    width 100%
    display flex
    align-items center
    justify-content center
    background $c-warning
    border-bottom solid 1px $c-warning-dark
    padding $s-3 $s-1 $s-4

  p
    text sm
    width 100%
    justify-content center
    display flex
    margin-left 10px

  scan
    margin-top 1px
</style>
