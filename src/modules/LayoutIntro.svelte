<script>
  import { Route } from 'svelte-router-spa'
  import { onMount } from 'svelte'
  import Modal from '#modules/Modal.svelte'

  export let currentRoute
  let viewHeight

  function setViewportHeight() { viewHeight = window.visualViewport.height }

  onMount(() => document.documentElement.classList.add('green'))
</script>

<svelte:window on:load={setViewportHeight}/>

<div class='layout-intro' style="height: {viewHeight}px">
  <div class='container'>
    <Modal/>
    <Route { currentRoute } />
  </div>
</div>

<style lang='stylus'>
  .layout-intro
    height 100%
    background $c-green
    
  .container
    constrainWidth($tablet)
    height 100%
    padding $s-2
    margin 0 auto  
</style>
