function CgError(msg, name = 'CgError') { this.message = msg; this.name = name }

async function timedFetch(url, options = {}) {
  const { timeout = 1000, type = 'json' } = options;
  const aborter = new AbortController();
  aborter.name = 'Timeout'
  const timeoutId = setTimeout(() => aborter.abort(), timeout)
  const res = await fetch(url, {...options, signal: aborter.signal });
  let body; if (res.ok && type != 'none') body = await (type == 'blob' ? res.blob() : res.json())
  clearTimeout(timeoutId);
  return body
}

/*
async function cgEncrypt(text) {
console.log('before readKey');
  const publicKey = await readKey({ armoredKey: cgPublicKey });
  console.log('after readKey');
  const crypt = await encrypt({
    message: await createMessage({ text: text }), // input as Message object
    encryptionKeys: publicKey,
  });

//    return btoa(crypt).replace('+', '-').replace('_', '/')
}

function disableBack() {
  window.history.pushState(null, null, window.location.href)
  window.onpopstate = function () {window.history.go(1)}
}

*/

/* for POST auth in HTTP header (any advantage?)
        'authorization': `Bearer ${ $store.myAccount.deviceId }`,
        'Accept': 'application/json',
        'Content-type': 'application/json',
        body: JSON.stringify(tx)
*/

export { CgError, timedFetch }
