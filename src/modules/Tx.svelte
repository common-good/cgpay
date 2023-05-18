<script>
  import st from'#store.js'
  

  const intent = $st.intent
  const qr = intent === 'pay' ? $st.myAccount?.qr : null
  const qrAction = `Show this code to ${intent === 'pay' ? intent : 'be paid'}`
</script>

<section class="page" id="tx">
  <div class="top">
    <h1>{intent}</h1>
    <p>{qrAction}</p>
    <img src="{qr}" data-testid="qr" alt={qrAction} />
  </div>
  <div class="bottom">
    <button>Scan to {intent}</button>
  </div>
</section>

<style lang='stylus'>
  button
    cgButton()
    text-transform capitalize

  h1 
    text-transform capitalize

  img
    min-height 300px

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .top
    width 100%
    height 100%
    display flex
    flex-direction column
    align-items center

  .bottom
    width 100%
    text-align center
</style>