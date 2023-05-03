<script>
  export let name
  export let label
  export let options
  export let selected
  export let value
  export let size = 4
</script>

<label for="select-{name}">{label}:</label>
<select id="select-{name}" name="select-{name}" data-testid="select-{name}" size={size} required="required">
  { #each Object.keys(options) as k }
    <option value={k} id={ `${name}-opt-${k}` } data-testid={ `${name}-opt-${k}` } selected={selected}>{ options[k] }</option>
  { /each }
</select>

<style lang="stylus">
  select
    border solid 1px $c-black
    margin-bottom $s0
    height 80%
    display flex
    flex-direction column
    justify-content space-between

  option
    display flex
    align-items center
    padding $s-2
</style>
