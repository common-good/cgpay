<script>
  import QrCode from 'svelte-qrcode'

  export let currentRoute
  export let params

  // TODO - get real QR code from API/store
  const myCardCode = 'G6VM0RZzhWMCq0zcBowqw';
</script>

<section>
  <h1>Show QR</h1>
  <QrCode value={myCardCode} />
  <a href="/home">Done</a>
</section>

<style lang="stylus">
  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  h1
    font-weight 600
    text lg

  a
    cgButton()
</style>