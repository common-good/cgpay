<script>
  export let name
  export let options
  export let value
  export let required = null
</script>

{ #each Object.keys(options) as k }
  <label>
    <input type=radio value={k} data-testid={ `${name}-radio-${k}` } bind:group={value} 
      class={ value == k ? 'checked' : '' } name={name} required={required} />{options[k]}
  </label>
{ /each }

<style lang='stylus'>
  input
    display inline-block
    text-align left
    padding $s-2
    width auto
    margin 0 5px 0 $s1

  label
    width 100%
</style>
