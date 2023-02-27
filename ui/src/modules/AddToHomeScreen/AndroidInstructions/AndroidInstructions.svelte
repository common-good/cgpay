<script>
  import store from '#store.js'
  export let skip
</script>

<section class="content" id='android-instructions'>
  <div class='top'>
    { #if store.isChrome() }
      <p>To add CGPay to your home screen, tap the banner below.</p>
    { :else }
      <p>To add CGPay to your home screen, open Chrome and browse to cg4.us/app</p>
    { /if }
  </div>
  <button on:click={ skip }>Continue</button>
</section>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'
</style>
