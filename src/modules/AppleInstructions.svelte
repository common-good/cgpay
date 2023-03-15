<script>
  import store from '#store.js'
  import ShareIcon from "svelte-material-icons/ExportVariant.svelte"
  import AddIcon from "svelte-material-icons/PlusBoxOutline.svelte"
  export let skip
</script>

<div class="content" data-testid='apple'>
  <div class='top'>
    <!--p>To add CGPay to your home screen, tap the banner below.</p-->
    <p>To add CGPay to your home screen:</p>
    { #if store.isSafari() }
      <ul>
        <li>1. Tap the Share <span class="inline-icon"><ShareIcon class="icon" size={"1.25rem"} /></span> button.</li>
        <li>2. In the menu, scroll down and select "Add to Home Screen <span class="inline-icon"><AddIcon class="icon" size={"1.25rem"} /></span>".</li>
        <li>3. Then tap "Add".</li>
      </ul>
    { :else }
      <p>Open Safari and browse to cg4.us/app </p>
    { /if }
  </div>
  <button data-testid="continue-button" on:click={ skip }>Continue</button>
</div>

<style lang='stylus'>
  @import '../styles/AddToHomeScreen.styl'
  .inline-icon
    display inline-block
    transform translateY(-2px)
</style>
