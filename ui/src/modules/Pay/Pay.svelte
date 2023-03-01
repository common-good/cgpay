<script>
  import store from '#store.js'
  import cgLogo from '#modules/Root/assets/cg-logo-300.png?webp'
  import cgLogoDemo from '#modules/Root/assets/cg-logo-300-demo.png?webp'
  import SearchIcon from "svelte-material-icons/Magnify.svelte"
  import SubmitPay from './SubmitPay/SubmitPay.svelte';

  const myQr = $store.myAccount?.qr
  let searchTerm
  let searchResults = null
  let payee = {
    'name': 'Susan Shopper'
  };

  const searchMember = () => {
    // Send request
      // return payee
  }
</script>

<section id="pay">
  <h1>Pay</h1>
  <!-- {#if payee }
    <SubmitPay />
  { :else } -->
    <div class='top'>
      <form on:submit|preventDefault={ searchMember }>
        <label for='search' class="visuallyhidden">Search</label>
        <span class="absolute-icon">
          <SearchIcon class="icon" height="40px" width="40px" />
        </span>
        <input id="search" type='text' name='search' placeholder='Name, id, email, or phone' bind:value={searchTerm} />
      </form>
      <div class="results">
        <!-- Add searchResults here -->
      </div>
      { #if myQr }
        <div class="qr-wrapper">
          <h2>Show code:</h2>
          <img class="qr" src="{ myQr }" alt="my QR code" />
        </div>
      { :else }
        <div class='watermark'>
          <img class='logo' src= { $store.testing ? cgLogoDemo : cgLogo } alt='Common Good Logo' />
        </div>
      {/if}
    </div>
    
  <!-- {/if} -->
</section>

<style lang='stylus'>
  form
    margin-bottom $s0
    
  h1
    margin-bottom $s0

  h2
    text lg
    font-weight 400
    margin-bottom: $s-2

  input
    padding-left 50px

  section
    height 100%
    display flex
    flex-direction column
    justify-content space-between
    align-items center
  
  .absolute-icon
    position absolute
    display flex
    align-items center
    height: $s4
    transform translateY(1px)
    padding-left: $s-3

  .qr-wrapper
    contentCentered column

  .top
    width 100%
    height 100%
    display flex
    flex-direction column

  .results
    border solid 1px $c-black
    background $c-white
    position absolute
    width calc(100% - 24px)
    transform translateY(49px)
    visibility hidden
    height 0

  .watermark
    opacity 0.5
    text-align center
    margin auto
    font-size $s-1

    img
      margin-bottom $s0
</style>


