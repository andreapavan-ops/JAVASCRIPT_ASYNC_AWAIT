// ============================================
// VERSIONE 1: CALLBACK (come si faceva prima)
// ============================================

/**
 * Funzione che fa una richiesta HTTP usando il vecchio XMLHttpRequest.
 * Segue il pattern "error-first callback" di Node.js:
 * callback(errore, dati)
 */
function fetchConCallback(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      const dati = JSON.parse(xhr.responseText);
      callback(null, dati);
    } else {
      callback(new Error("HTTP " + xhr.status), null);
    }
  };

  xhr.onerror = function () {
    callback(new Error("Errore di rete"), null);
  };

  xhr.send();
}

function versioneCallback() {
  const output = document.getElementById("output");
  const BASE = "https://jsonplaceholder.typicode.com";
  const inizio = Date.now();

  output.innerHTML = '<span class="step">⏳ [CALLBACK] Inizio caricamento...</span>\n';

  // STEP 1: Carica l'utente
  fetchConCallback(BASE + "/users/01", function (errUtente, utente) {
    if (errUtente) {
      output.innerHTML += '<span class="error">❌ Errore utente: ' + errUtente.message + '</span>\n';
      return;
    }

    output.innerHTML += '<span class="data">👤 Utente: ' + utente.name + ' (' + utente.email + ')</span>\n';

    // STEP 2: Carica i post dell'utente
    fetchConCallback(BASE + "/posts?userId=" + utente.id, function (errPost, posts) {
      if (errPost) {
        output.innerHTML += '<span class="error">❌ Errore post: ' + errPost.message + '</span>\n';
        return;
      }
      var primoPost = posts[0];
      output.innerHTML += '<span class="data">📝 Primo post: "' + primoPost.title.substring(0, 50) + '..."</span>\n';
      output.innerHTML += '<span class="data">   (' + posts.length + ' post totali)</span>\n';

      // STEP 3: Carica i commenti del primo post
      fetchConCallback(BASE + "/comments?postId=" + primoPost.id, function (errComm, commenti) {
        if (errComm) {
          output.innerHTML += '<span class="error">❌ Errore commenti: ' + errComm.message + '</span>\n';
          return;
        }
        output.innerHTML += '<span class="data">💬 Commenti al post: ' + commenti.length + '</span>\n';

        commenti.forEach(function (c) {
          output.innerHTML += '<span class="data">   • ' + c.name.substring(0, 40) + '...</span>\n';
        });

        var tempo = Date.now() - inizio;
        output.innerHTML += '\n<span class="done">✅ [CALLBACK] Completato in ' + tempo + 'ms</span>\n';
      });
    });
  });
}


// ============================================
// VERSIONE 2: PROMISE con .then()
// ============================================

function versionePromise() {
  const output = document.getElementById("output");
  const BASE = "https://jsonplaceholder.typicode.com";
  const inizio = Date.now();

  output.innerHTML = '<span class="step">⏳ [PROMISE] Inizio caricamento...</span>\n';

  let utenteSalvato;

  // STEP 1: Carica l'utente
  fetch(BASE + "/users/1")
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);

      return response.json();
    })
    .then(function (utente) {
      utenteSalvato = utente;
      output.innerHTML += '<span class="data">👤 Utente: ' + utente.name + ' (' + utente.email + ')</span>\n';

      // STEP 2: Carica i post
      return fetch(BASE + "/posts?userId=" + utente.id);
    })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);

      return response.json();
    })
    .then(function (posts) {
      var primoPost = posts[0];
      output.innerHTML += '<span class="data">📝 Primo post: "' + primoPost.title.substring(0, 50) + '..."</span>\n';
      output.innerHTML += '<span class="data">   (' + posts.length + ' post totali)</span>\n';

      // STEP 3: Carica i commenti
      return fetch(BASE + "/comments?postId=" + primoPost.id);
    })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);

      return response.json();
    })
    .then(function (commenti) {
      output.innerHTML += '<span class="data">💬 Commenti al post: ' + commenti.length + '</span>\n';

      commenti.forEach(function (c) {
        output.innerHTML += '<span class="data">   • ' + c.name.substring(0, 40) + '...</span>\n';
      });

      var tempo = Date.now() - inizio;
      output.innerHTML += '\n<span class="done">✅ [PROMISE] Completato in ' + tempo + 'ms</span>\n';
    })
    .catch(function (errore) {
      output.innerHTML += '<span class="error">❌ Errore: ' + errore.message + '</span>\n';
    });


}


// ============================================
// VERSIONE 3: ASYNC/AWAIT (moderna)
// ============================================

async function versioneAsync() {
  const output = document.getElementById("output");
  const BASE = "https://jsonplaceholder.typicode.com";
  const inizio = Date.now();

  output.innerHTML = '<span class="step">⏳ [ASYNC/AWAIT] Inizio caricamento...</span>\n';

  try {
    // STEP 1: Carica l'utente
    const respUtente = await fetch(BASE + "/users/1");
    if (!respUtente.ok) throw new Error("HTTP " + respUtente.status);
    const utente = await respUtente.json();
    output.innerHTML += '<span class="data">👤 Utente: ' + utente.name + ' (' + utente.email + ')</span>\n';
    console.log("Utente caricato");

    // STEP 2: Carica i post dell'utente
    const respPosts = await fetch(BASE + "/posts?userId=" + utente.id);
    if (!respPosts.ok) throw new Error("HTTP " + respPosts.status);
    const posts = await respPosts.json();
    const primoPost = posts[0];
    output.innerHTML += '<span class="data">📝 Primo post: "' + primoPost.title.substring(0, 50) + '..."</span>\n';
    output.innerHTML += '<span class="data">   (' + posts.length + ' post totali)</span>\n';
    console.log("Post caricati");

    // STEP 3: Carica i commenti del primo post
    const respCommenti = await fetch(BASE + "/comments?postId=" + primoPost.id);
    if (!respCommenti.ok) throw new Error("HTTP " + respCommenti.status);
    const commenti = await respCommenti.json();
    output.innerHTML += '<span class="data">💬 Commenti al post: ' + commenti.length + '</span>\n';

    commenti.forEach(function (c) {
      output.innerHTML += '<span class="data">   • ' + c.name.substring(0, 40) + '...</span>\n';
    });
    console.log("commenti caricati");
    const tempo = Date.now() - inizio;
    output.innerHTML += '\n<span class="done">✅ [ASYNC/AWAIT] Completato in ' + tempo + 'ms</span>\n';

  } catch (errore) {
    output.innerHTML += '<span class="error">❌ Errore: ' + errore.message + '</span>\n';
  }
}


// ============================================
// BONUS: ASYNC/AWAIT + PROMISE.ALL (parallelo)
// ============================================

async function versioneParallelo() {
  const output = document.getElementById("output");
  const BASE = "https://jsonplaceholder.typicode.com";
  const inizio = Date.now();

  output.innerHTML = '<span class="step">⏳ [PARALLELO] Inizio caricamento...</span>\n';

  try {
    // STEP 1: Carica l'utente (sequenziale — ci serve l'id)
    const respUtente = await fetch(BASE + "/users/1");
    const utente = await respUtente.json();
    output.innerHTML += '<span class="data">👤 Utente: ' + utente.name + '</span>\n';

    // STEP 2: Post e Todo IN PARALLELO (non dipendono l'uno dall'altro!)
    output.innerHTML += '<span class="step">⏳ Caricamento post e todo in parallelo...</span>\n';

    const [respPosts, respTodos] = await Promise.all([
      fetch(BASE + "/posts?userId=" + utente.id),
      fetch(BASE + "/todos?userId=" + utente.id)
    ]);

    const [posts, todos] = await Promise.all([
      respPosts.json(),
      respTodos.json()
    ]);

    output.innerHTML += '<span class="data">📝 Post: ' + posts.length + '</span>\n';
    const completati = todos.filter(function (t) { return t.completed; }).length;
    output.innerHTML += '<span class="data">✅ Todo: ' + completati + '/' + todos.length + ' completati</span>\n';

    // STEP 3: Commenti del primo post (dipende dai post → sequenziale)
    const primoPost = posts[0];
    const respCommenti = await fetch(BASE + "/comments?postId=" + primoPost.id);
    const commenti = await respCommenti.json();
    output.innerHTML += '<span class="data">💬 Commenti al primo post: ' + commenti.length + '</span>\n';

    const tempo = Date.now() - inizio;
    output.innerHTML += '\n<span class="done">✅ [PARALLELO] Completato in ' + tempo + 'ms</span>\n';
    output.innerHTML += '<span class="time">⚡ Confronta questo tempo con le versioni sequenziali!</span>\n';

  } catch (errore) {
    output.innerHTML += '<span class="error">❌ Errore: ' + errore.message + '</span>\n';
  }
}
