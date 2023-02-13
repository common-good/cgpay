<script>
  import store from '#store.js'
  import { onMount } from 'svelte'

  import iconOffline from './assets/icon-offline.svg'
  import iconOnline from './assets/icon-online.svg'
</script>

{ #if !$store.network.online || $store.network.restored }
  <section id='network-status'>
    <div id='network-status-content'>
      { #if $store.network.online }
        <img src={ iconOnline } alt='Online Status Icon' />
        <p>You are back online!</p>
      { /if }

      { #if $store.network.offline }
        <img src={ iconOffline } alt='Offline Status Icon' />
        <p>You are offline. Some data may not be saved until you reconnect to the internet.</p>
      { /if }
    </div>
  </section>
{ /if }

<style lang='stylus'>
  #network-status
    background $c-gray-light
    padding $s2

  #network-status-content
    display flex
    align-items center
    constrainWidth($tablet)

  img
    padding 0 $s2 0 0

  p
    text sm
</style>
