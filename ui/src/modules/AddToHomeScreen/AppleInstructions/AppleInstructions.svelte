<script>
  export let skip
</script>

<div class="content" id='apple-instructions'>
  <div class='top'>
    <p>To add CGPay to your home screen, tap the banner below.</p>
    <!--p>To add CGPay to your home screen:</p>
    <ul>
      <li>1. Tap the Share button (a square with an up arrow).</li>
      <li>2. In the menu, scroll down and select "Add to Home Screen".</li>
      <li>3. Then tap "Add".</li>
    </ul-->
  </div>
  <button on:click={ skip }>Skip For Now</button>
</div>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'
</style>
