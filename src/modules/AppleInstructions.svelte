<script>
  import u from '#utils.js'
  import ShareIcon from "svelte-material-icons/ExportVariant.svelte"
  import AddIcon from "svelte-material-icons/PlusBoxOutline.svelte"
  export let skip
</script>

<div class="content" data-testid='apple-instructions'>
  <div class='top'>
    <h2>Instructions</h2>
    { #if u.isSafari() }
      <ul>
        <li>1. Tap the Share <span class="inline-icon"><ShareIcon class="icon" size={"1.25rem"} /></span> button.</li>
        <li>2. In the menu, scroll down and select "Add to Home Screen <span class="inline-icon"><AddIcon class="icon" size={"1.25rem"} /></span>".</li>
        <li>3. Then tap "Add".</li>
        <li>4. Press "Continue" below, sign in to your personal Common Good account, then follow instructions.</li>
      </ul>
    { :else }
    <ul>
      <li>1. Open Safari and browse to cgpay.commongood.earth.</li>
      <li>2. You will be guided to add CGPay to your home screen.</li>
    </ul>
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
