<script>
  import store from '#app.store.js'
  import { onMount } from 'svelte'

  import iconOffline from './assets/icon-offline.svg'
  import iconOnline from './assets/icon-online.svg'

  $: shouldDisplay = $store.network.offline || $store.network.restored
</script>

<!-- Ensure the offline image is cached but not displayed. -->
<img class='preload' src={ iconOffline } style='display: none;' />

{ #if shouldDisplay }
  <section id='network-status'>
    { #if $store.network.online }
      <img src={ iconOnline } alt='Online Status Icon' />
      <p>You are back online!</p>
    { /if }

    { #if $store.network.offline }
      <img src={ iconOffline } alt='Offline Status Icon' />
      <p>You are offline. Some data may not be saved until you reconnect to the internet.</p>
    { /if }
  </section>
{ /if }

<style lang='stylus'>
  #network-status
    align-items center
    background $gray-light
    display flex
    padding $s2

  img
    padding 0 $s2 0 0

  p
    text sm
</style>
