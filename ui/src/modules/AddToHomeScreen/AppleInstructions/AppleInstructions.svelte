<script>
  import store from '#store.js'
  export let skip
</script>

<div class="content" id='apple-instructions'>
  <div class='top'>
    <!--p>To add CGPay to your home screen, tap the banner below.</p-->
    <p>To add CGPay to your home screen:</p>
    { #if store.isSafari() }
      <ul>
        <li>1. Tap the Share button (a square with an up arrow).</li>
        <li>2. In the menu, scroll down and select "Add to Home Screen".</li>
        <li>3. Then tap "Add".</li>
      </ul>
    { :else }
      <p>Open Safari and browse to cg4.us/app </p>
    { /if }
  </div>
  <button on:click={ skip }>Continue</button>
</div>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'
</style>
