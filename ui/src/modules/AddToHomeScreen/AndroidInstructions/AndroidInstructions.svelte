<script>
  import store from '#store.js'
  export let skip
</script>

<section class="content" id='android-instructions'>
  <div class='top'>
    { #if store.isChrome() }
      <p>To add CGPay to your home screen:</p>
        <li>Tap the banner below (it may take a few seconds to appear).</li>
        <li>Wait for installation to complete.</li>
        <li>Choose "Open CGPay" on the system menu.</li>
    { :else }
      <p>To add CGPay to your home screen, open Chrome and browse to cg4.us/app</p>
    { /if }
  </div>
  <button on:click={ skip }>Continue</button>
</section>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'
</style>
