<script>
  import { onMount } from 'svelte'
  import store from '#store.js'
  import { dlg } from '#utils.js'
  import Modal from '../Modal.svelte'; let m0, m1, m2

  export let currentRoute // else Svelte complains (I don't know why yet)
  export let params // else Svelte complains (I don't know why yet)
  const myQr = store.myAccount.qr
//  const myQr = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAYDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5dtVj8L+EdJn0S5urPWpEAuJrWMrPsZQxWQ8jBbBHfj25KKK+RhiJxR+q/wBi4aolJtr0t/kf/9k='

  function er(msg) { 
    ({ m0, m1 } = dlg('Alert', msg, 'OK', () => m0 = false)); m0=m0; m1=m1
    store.erMsg.set(null)
  }

  onMount(async () => {
    store.qr.set(null) // no going back to previous customer
    const erMsg = await store.erMsg.get()
    if (erMsg) er(erMsg)
  })
</script>

<Modal m0={m0} on:m1={m1} on:m2={m2} />

<svelte:head>
  <title>CG Pay</title>
</svelte:head>

<section id='home'>
  { #if  myQr }
    <div class="my-qr">
      <p>Show this to pay:</p>
      <p><img src="data:image/jpeg;base64,{ myQr }" alt="my QR code" /></p>
      <p>NEWABC</p>
    </div>
  { :else }
    <p>Ready to charge customers.</p>
  { /if }
  <div class="actions">
    <a href='/scan'>Scan to Charge</a>
  </div>
</section>

<style lang='stylus'>
  h1
    font-weight 600
    text lg

  section
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content space-between

  .my-qr p, img
    text-align center

  .actions
    width 100%

  a
    cgButton()
    margin-bottom $ss
    &.secondary
      cgButtonSecondary()
</style>
