<script>
  export let name
  export let label
  export let options
  export let value
  export let size = 4
</script>

<label for="select-{name}">{label}:</label>
<select name="select-{name}" data-testid="select-{name}" size={size} bind:value={value} required="required">
  { #each Object.keys(options) as k }
  <option value={k} id={ `${name}-opt-${k}` } data-testid={ `${name}-opt-${k}` } class={ k==value ? 'selected' : '' }>{ options[k] }</option>
  { /each }
</select>

<style lang="stylus">
  select
    border solid 1px $c-black
    margin-bottom $s0
    display flex
    flex-direction column
    justify-content space-between

  .selected
    background-color $c-blue-bright

  option
    display flex
    align-items center
    padding $s-2
</style>
