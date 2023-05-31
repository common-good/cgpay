<script>
  import st from'#store.js'
  import u from '#utils.js'

  export let intent
  const accts = u.ray('A:KDCA12345a, B:KDCB12345b, CA:LDCC098765a, CG:LDCC198765b, GF:LDCG098765f, Worse:')

  function fake(code) {
    code = code ? 'HTTP://6VM.RC4.ME/' + code : 'garbage'
    st.setQr(code); st.setIntent(intent); u.go('tx')
  }

</script>

<div class="fakes">
  {#each accts as acct}
    <button on:click={ () => fake(acct.split(':')[1]) }>{acct.split(':')[0]}</button>
  {/each}
</div>

<style lang="stylus">
  .fakes
    display flex
    justify-content space-between
    margin-top $s0

  button
    cgButton()
    width 100%

  .fakes button
    cgButtonSecondary()
    padding 5px
    margin-bottom $s0
    flex-grow 1
    margin-right $s-2
    visibility visible
</style>
