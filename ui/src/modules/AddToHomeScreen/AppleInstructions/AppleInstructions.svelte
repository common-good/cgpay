<script>
  import appleStepOne from './assets/apple-step-1.png?webp'
  import appleStepTwo from './assets/apple-step-2.png?webp'
  import appleStepThree from './assets/apple-step-3.png?webp'
  import appleStepFour from './assets/apple-step-4.png?webp'

  // --------------------------------------------

  export let skip
</script>

<section id='apple-instructions'>
  <p>CG Pay is easy to use when you add it to your device home screen.</p>
  <button on:click={ skip }>Skip for now</button>

  <h2>Steps to save:</h2>

  <ul>
    <li>
      <p>1. Tap the Share icon from iOS banner at the bottom of your screen.</p>
      <img src={ appleStepOne } alt='Instructions Step 1' />
    </li>

    <li>
      <p>2. Scroll down and select “Add To Home Screen” from menu items.</p>
      <img src={ appleStepTwo } alt='Instructions Step 2' />
    </li>

    <li>
      <p>3. Tap “Add” to save CG Pay to your home screen.</p>
      <img src={ appleStepThree } alt='Instructions Step 3' />
    </li>

    <li>
      <p>4. The CG Pay icon will be saved to your home screen. Tap it to open CG Pay and continue.</p>
      <img src={ appleStepFour } alt='Instructions Step 4' />
    </li>
  </ul>
</section>

<style lang='stylus'>
  @import '../AddToHomeScreen.styl'

  button
    addToHomeScreenLink()
    margin $s2 0

  h2
    font-weight 600
    margin 0 0 $s1

  img
    margin 0 auto
    padding 0 $s1

  li
    margin 0 0 $s2

    p
      margin 0 0 $s2
</style>
