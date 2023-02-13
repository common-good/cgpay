<script>
  export let skip
</script>

<div class="content" id='apple-instructions'>
  <p>To add CGPay to your home screen:</p>
  <ol>
    <li>Tap the Share button (a square with an up arrow).</li>
    <li>In the menu, scroll down and select "Add to Home Screen".</li>
    <li>Then tap "Add".</li>
  </ol>
  <button on:click={ skip }>Continue</button>
</div>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'
</style>
