<script>
  import store from '#store.js'

  import WifiOff from "svelte-material-icons/WifiOff.svelte"
</script>

{ #if !$store.online}
  <section id='network-status'>
      <WifiOff size={"1rem"} />
      <p>Network is offline.</p>
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
    margin-top: -1rem

  p
    text sm
    margin-left $s-2
</style>
