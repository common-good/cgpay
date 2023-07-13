<script>
  import st from '#store.js'
  import Switch from './Switch.svelte'

  export let k
  export let op
  export let label

  let yesno = $st[k]
  function click() { op(yesno) }
</script>
  
<Switch bind:value={yesno} on:click={click} label={label} design="slider" />
