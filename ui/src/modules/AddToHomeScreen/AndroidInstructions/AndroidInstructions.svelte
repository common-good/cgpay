<script>
  export let skip
</script>

<section id='android-instructions'>
  <p>CG Pay is easy to use when you add it to your device home screen.</p>
  <p>Click the banner below to add CG Pay to your home screen.</p>
  <button on:click={ skip }>Skip for now</button>
</section>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'

  button
    addToHomeScreenLink()
    text sm

  p
    margin 0 0 $s2
</style>
