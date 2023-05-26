<script>
  import st from'#store.js'
  import u from'#utils.js'
  import { onMount } from 'svelte'

  let info = {}
  let txs = [
    {
      name: 'Maria Manager',
      descripton: 'burrito',
      amount: '-10.00',
      pending: true,
      created: '5/25/23',
      id: 1234
    },
    {
      name: 'Susan Shopper',
      descripton: 'rent',
      amount: '1000.00',
      pending: false,
      created: '5/25/23',
      id: 1234
    },
    {
      name: 'Corner Store',
      descripton: 'groceries',
      amount: '-100.00',
      pending: false,
      created: '5/25/23',
      id: 1234
    }
  ]
  let pending = txs.reduce((total, tx) => tx.pending ? total + 1 : total + 0
  , 0);
  const me = $st.myAccount

  onMount(async () => {
    try {
      const params = {deviceId:me.deviceId, actorId:me.accountId, lastTx:me.lastTx || -1 }
      info = await u.postRequest('info', params)
      console.log('info', info)
//      balance, surtxs: {}, txs: [{xid, amount, accountId, name, description, created}, …]}
//  where surtxs: {amount, portion, crumbs, roundup}

    } catch (er) { if (!u.isTimeout(er)) console.log('info er', er) }
  })

</script>
<section id="dashboard">
  <p class="acct">Account: {$st.myAccount?.accountId}</p>
  <div class="balance">
    <p>Balance: <span>${info.balance}</span></p>
  </div>
  <a class="link pending" href="/pending">You have {pending} Pending Transaction{pending == 1 ? '' : 's'}</a>
  <div class="txs">
    <h2>Recent Transactions {#if !txs.length}(none){/if}</h2>
    <ul>
      {#each txs as tx}
        <li>
          <div class="row">
            <div class><span>{tx.pending ? 'Pending' : u.fmtDate(tx.created)}</div>
            <div class="rgt">${tx.amount}</div>
          </div>
          <div class="row">
            <div class>{tx.name}</div>
            <div class="rgt">{tx.descripton}</div>
          </div>
      {/each}
    </ul>
    <a class="link" href="/txs">View Full Transaction History</a>
  </div>
</section>

<style lang='stylus'>
  .pending
    display block
    margin-bottom $s2

  h2
    text-align center
    margin-bottom $s0

  li
    border-top solid 1px
    margin-bottom $s0
    padding-top $s-1

  section
    width 100%

  ul
    margin-bottom $s1
    
  .acct
    text-align center
    margin-bottom $s0

  .balance
    margin-bottom $s-1
    span
      text(3xl)
      font-weight 500

  .row
    width 100%
    display flex
    justify-content space-between
    &:first-of-type
      margin-bottom $s-4

  .rgt
    text-align right
</style>