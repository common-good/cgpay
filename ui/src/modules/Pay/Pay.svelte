<script>
  import store from '#store.js'
  const myQr = $store.myAccount?.qr
</script>

<section id="pay">
  <h1>Pay</h1>
  { #if myQr }
    <div class='top'>
      <h2>Show code:</h2>
      <img class="qr" src="{ myQr }" alt="my QR code" />
    </div>
  { :else }
    <div class='top business'>
      <h2>Ready to charge people.</h2>
      <div class='watermark'>
        <img class='logo' src= { $store.testing ? cgLogoDemo : cgLogo } alt='Common Good Logo' />
        <p>CGPay v{ version() }</p>
      </div>
    </div>
  {/if}
  <form>
    <h2>Search member:</h2>
    <input />
    <button type='submit'>Search</button>
  </form>
</section>

<style lang='stylus'>
  button
    cgButton()

  h1
    margin-bottom $s-1
    text-align center

  h2
    text lg
    font-weight 400
    margin-bottom: $s-2

  section
    height 100%
    display flex
    flex-direction column
    justify-content space-between

  .qr
    align-self center
    max-width 300px

  .top
    width 100%
    height 100%
    display flex
    flex-direction column
    margin-bottom $s0
</style>


