<script>
  import { isChrome } from '#utils.js'
  export let skip
</script>

<section class="content" data-testid='android-instructions'>
  <div class='top'>
    { #if isChrome() }
      <p>To add CGPay to your home screen:</p>
        <li>Tap the banner below (it may take a few seconds to appear).</li>
        <li>Wait for installation to complete.</li>
        <li>Choose "Open CGPay" on the system menu.</li>
    { :else }
      <p>To add CGPay to your home screen, open Chrome and browse to cg4.us/app</p>
    { /if }
  </div>
  <button data-testid="continue-button" on:click={ skip }>Continue</button>
</section>

<style lang='stylus'>
  @import '../styles/AddToHomeScreen.styl'
</style>
