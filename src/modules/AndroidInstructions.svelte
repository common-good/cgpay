<script>
  import u from '#utils.js'
  export let skip
</script>

<section class="content" data-testid='android-instructions'>
  <div class='top'>
    <h2>Instructions</h2>
    { #if u.isChrome() }
      <ul>
        <li>1. Tap the banner below (it may take a few seconds to appear).</li>
        <li class="nested">
          If you do not see a banner:
          <ul>
            <li>Tap the three-dot icon in the top right corner of your screen.</li>
            <li>In the menu, scroll down and select "Add to Home screen".</li>
          </ul>
        </li>
        <li>2. Wait for installation to complete.</li>
        <li>3. Choose "Open CGPay" on the system menu.</li> 
      </ul>    
    { :else }
      <ul>
        <li>1. Open Chrome and browse to cgpay.commongood.earth.</li>
        <li>2. You will be guided to add CGPay to your home screen.</li>
      </ul>
    { /if }
  </div>
  <button data-testid="continue-button" on:click={ skip }>Continue</button>
</section>

<style lang='stylus'>
  @import '../styles/AddToHomeScreen.styl'
</style>
