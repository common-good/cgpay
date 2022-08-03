<script>
  export let skip

  import appleStepTwo from './assets/apple-step-2.png'
</script>

<section id='apple-instructions'>
  <h1>Apple</h1>
  <img src={ appleStepTwo } alt='Instructions Step 2' />
  <button on:click={ skip }>Skip</button>
</section>

<style lang='stylus'>
  img
    margin 0 auto
    width 200px
</style>
