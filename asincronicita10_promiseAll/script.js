/*

## Esercizio 10 — Promise.allSettled: stato dei servizi (⭐⭐⭐ difficile)

Crea una pagina "Status" che controlla la salute di più endpoint API contemporaneamente, come una dashboard di monitoraggio servizi.

**Servizi da controllare** (alcuni falliranno apposta):

```jsx
const servizi = [
    { nome: "Utenti API", url: "https://jsonplaceholder.typicode.com/users" },
    { nome: "Post API", url: "https://jsonplaceholder.typicode.com/posts?_limit=1" },
    { nome: "Commenti API", url: "https://jsonplaceholder.typicode.com/comments?_limit=1" },
    { nome: "Todo API", url: "https://jsonplaceholder.typicode.com/todos?_limit=1" },
    { nome: "Servizio Rotto", url: "https://jsonplaceholder.typicode.com/inesistente" },
    { nome: "Server Errore", url: "https://httpstat.us/500" }
];
```

**Funzionalità:**

1. Bottone "Controlla tutti" che lancia tutte le verifiche in parallelo
2. Ogni servizio mostra: nome, stato (🟢 OK / 🔴 Errore / 🟡 Lento / ⏳ In verifica), tempo di risposta in ms
3. Usa `Promise.allSettled()` per non bloccarsi al primo errore
4. Timeout di 3 secondi per ogni servizio (se non risponde entro 3s → 🟡 Timeout)
5. Riepilogo: "4/6 servizi online"
6. Bottone "Refresh automatico" che controlla ogni 30 secondi

**Suggerimenti:**

- Per ogni servizio, crea una Promise con `Promise.race()` tra il fetch e un timeout di 3 secondi
- Misura il tempo con `Date.now()` prima e dopo il fetch
- Usa `Promise.allSettled()` per avere i risultati di tutti, anche quelli falliti
- Per il timer di aggiornamento: `setInterval(controllaTutti, 30000)` con un bottone per attivare/disattivare
- Stato "Lento": se il tempo di risposta è > 1000ms ma non ha fatto timeout
- Aggiorna ogni card individualmente man mano che le risposte arrivano (non aspettare che finiscano tutte)

*/

// ─────────────────────────────────────────────
// PASSO 1: Recuperiamo i riferimenti all'HTML
// document.getElementById() trova un elemento
// nella pagina tramite il suo attributo id="..."
// ─────────────────────────────────────────────
const griglia = document.getElementById("griglia");         // il contenitore delle card servizi
const riepilogo = document.getElementById("riepilogo");     // la riga di testo riepilogativa
const btnControlla = document.getElementById("btnControlla");       // bottone "Controlla tutti"
const btnAutoRefresh = document.getElementById("btnAutoRefresh");   // bottone "Auto-refresh"

// ─────────────────────────────────────────────
// PASSO 2: Definiamo i servizi da controllare
// È un array di oggetti: ogni oggetto ha
//   nome  → etichetta visiva nella card
//   url   → indirizzo da contattare via fetch
// Alcuni URL sono volutamente rotti per
// simulare servizi non funzionanti.
// ─────────────────────────────────────────────
const servizi = [
    { nome: "Utenti API", url: "https://jsonplaceholder.typicode.com/users" },
    { nome: "Post API", url: "https://jsonplaceholder.typicode.com/posts?_limit=1" },
    { nome: "Commenti API", url: "https://jsonplaceholder.typicode.com/comments?_limit=1" },
    { nome: "Todo API", url: "https://jsonplaceholder.typicode.com/todos?_limit=1" },
    { nome: "Servizio Rotto", url: "https://jsonplaceholder.typicode.com/inesistente" },  // risponde 404
    { nome: "Server Errore", url: "https://httpstat.us/500" }                              // risponde 500
];

// ─────────────────────────────────────────────
// PASSO 3: Variabile per gestire il timer
// null significa "nessun refresh attivo".
// Quando attiviamo l'auto-refresh, qui
// salviamo l'ID restituito da setInterval()
// così possiamo fermarlo con clearInterval().
// ─────────────────────────────────────────────
let intervalloRefresh = null;

// ─────────────────────────────────────────────
// PASSO 4: Funzione che controlla UN servizio
//
// È async perché usa await al suo interno.
// Riceve un oggetto { nome, url } e restituisce
// un oggetto con lo stato del servizio.
//
// CONCETTO CHIAVE — Promise.race():
//   Riceve un array di Promise e "vince" la
//   prima che si risolve (o rigetta).
//   Qui mettiamo in gara:
//     • il fetch reale del servizio
//     • una Promise che si rigetta dopo 3s
//   Se il server è troppo lento, vince il
//   timeout e otteniamo un errore "Timeout".
// ─────────────────────────────────────────────
async function controllaServizio(servizio) {
    // Salviamo il momento di inizio in millisecondi
    // Date.now() restituisce un numero tipo 1710000000000
    const inizio = Date.now();

    try {
        // Promise.race: lancia fetch e timeout insieme,
        // prende il risultato di chi finisce prima
        const risposta = await Promise.race([
            fetch(servizio.url),                       // chiamata HTTP reale

            new Promise((_, reject) =>                 // _ = resolve non usato
                setTimeout(                            // dopo 3000ms...
                    () => reject(new Error("Timeout")),// ...rigetta con errore "Timeout"
                    3000
                )
            )
        ]);

        // Se arriviamo qui il fetch ha risposto prima del timeout.
        // Calcoliamo quanto tempo ha impiegato.
        const tempo = Date.now() - inizio; // es. 1710000000800 - 1710000000000 = 800ms

        // risposta.ok è false se il server risponde con
        // un codice di errore HTTP (es. 404, 500, ecc.)
        if (!risposta.ok) {
            return { nome: servizio.nome, stato: "errore", icona: "🔴", messaggio: `HTTP ${risposta.status}`, tempo };
        }

        // Se il server ha risposto ma ci ha messo più di 1 secondo
        // lo consideriamo "lento" (risposta valida ma degradata)
        if (tempo > 1000) {
            return { nome: servizio.nome, stato: "lento", icona: "🟡", messaggio: "Lento", tempo };
        }

        // Tutto ok: risposta ricevuta e veloce
        return { nome: servizio.nome, stato: "ok", icona: "🟢", messaggio: "OK", tempo };

    } catch (err) {
        // Arriviamo qui se:
        //   1. Il timeout di 3s ha vinto la Promise.race
        //   2. C'è un errore di rete (es. nessuna connessione)
        const tempo = Date.now() - inizio;

        // Distinguiamo il timeout da un generico errore di rete
        if (err.message === "Timeout") {
            return { nome: servizio.nome, stato: "lento", icona: "🟡", messaggio: "Timeout (>3s)", tempo };
        }
        return { nome: servizio.nome, stato: "errore", icona: "🔴", messaggio: err.message, tempo };
    }
}

// ─────────────────────────────────────────────
// PASSO 5: Mostra tutte le card "in verifica"
//
// Prima di avviare i controlli, riempiamo la
// griglia con card grigie/blu che mostrano
// "⏳ In verifica..." per ogni servizio.
// Così l'utente vede subito qualcosa e capisce
// che il lavoro è iniziato.
//
// .map() trasforma ogni servizio in una stringa
// HTML, poi .join("") le unisce in una sola.
// ─────────────────────────────────────────────
function mostraInVerifica() {
    griglia.innerHTML = servizi.map(s => `
        <div class="servizio-card verifica">
            <div class="nome">${s.nome}</div>
            <div class="stato">⏳ In verifica...</div>
            <div class="tempo">—</div>
        </div>
    `).join("");
}

// ─────────────────────────────────────────────
// PASSO 6: Aggiorna la card di UN servizio
//
// Quando una singola risposta arriva (anche
// prima che le altre finiscano), aggiorniamo
// solo quella card specifica nella griglia.
//
// index → posizione nell'array servizi (0,1,2…)
// risultato → l'oggetto restituito da controllaServizio()
// ─────────────────────────────────────────────
function aggiornaCard(risultato, index) {
    // querySelectorAll restituisce una NodeList
    // (simile a un array) di tutte le card presenti
    const cards = griglia.querySelectorAll(".servizio-card");

    if (cards[index]) {
        // Cambiamo la classe CSS → cambia il colore del bordo sinistro
        // "servizio-card ok" → bordo verde
        // "servizio-card errore" → bordo rosso
        // "servizio-card lento" → bordo giallo
        cards[index].className = `servizio-card ${risultato.stato}`;

        // Sostituiamo l'HTML interno della card con i dati reali
        cards[index].innerHTML = `
            <div class="nome">${risultato.nome}</div>
            <div class="stato">${risultato.icona} ${risultato.messaggio}</div>
            <div class="tempo">${risultato.tempo}ms</div>
        `;
    }
}

// ─────────────────────────────────────────────
// PASSO 7: Funzione principale — controlla TUTTI
//
// CONCETTO CHIAVE — Promise.allSettled():
//   Come Promise.all() lancia più Promise in
//   parallelo, ma NON si ferma se una fallisce.
//   Aspetta che TUTTE finiscano (risolte o no)
//   e restituisce un array di oggetti:
//     { status: "fulfilled", value: ... }
//     { status: "rejected",  reason: ... }
//
//   Perfetto per dashboard: vogliamo vedere
//   tutti i risultati, anche quelli in errore.
// ─────────────────────────────────────────────
async function controllaTutti() {
    // Disabilitiamo il bottone per evitare doppi click
    btnControlla.disabled = true;

    // Mostriamo subito tutte le card "in verifica"
    mostraInVerifica();
    riepilogo.textContent = "⏳ Verifica in corso...";

    // PASSO 7a: Creiamo una Promise per ogni servizio.
    // .map() restituisce un array di Promise.
    // Per ognuna, quando il risultato è pronto,
    // aggiorniamo subito la card (non aspettiamo le altre).
    const promesse = servizi.map((servizio, index) =>
        controllaServizio(servizio).then(risultato => {
            // .then() viene eseguito appena QUESTO servizio risponde,
            // anche se gli altri sono ancora in attesa → aggiornamento in tempo reale!
            aggiornaCard(risultato, index);
            return risultato; // passiamo il risultato a Promise.allSettled
        })
    );

    // PASSO 7b: Aspettiamo che TUTTE le Promise finiscano.
    // Promise.allSettled non rigetta mai: ci dà sempre tutti i risultati.
    const risultati = await Promise.allSettled(promesse);

    // PASSO 7c: Contiamo i servizi online e quelli lenti
    // per comporre il testo del riepilogo.
    // r.status === "fulfilled" → la Promise si è risolta (controllaServizio non ha lanciato)
    // r.value.stato === "ok"   → il servizio ha risposto correttamente e velocemente
    const online = risultati.filter(r =>
        r.status === "fulfilled" && r.value.stato === "ok"
    ).length;

    const lenti = risultati.filter(r =>
        r.status === "fulfilled" && r.value.stato === "lento"
    ).length;

    // Aggiorniamo il testo di riepilogo con i conteggi e l'ora attuale
    riepilogo.textContent = `${online}/${servizi.length} servizi online` +
        (lenti > 0 ? ` · ${lenti} lenti` : "") +
        ` — Ultimo check: ${new Date().toLocaleTimeString()}`;

    // Riabilitiamo il bottone
    btnControlla.disabled = false;
}

// ─────────────────────────────────────────────
// PASSO 8: Gestione Auto-refresh
//
// CONCETTO CHIAVE — setInterval / clearInterval:
//   setInterval(funzione, ms) → esegue la funzione
//   ogni "ms" millisecondi e restituisce un ID.
//   clearInterval(id) → ferma il timer con quell'ID.
//
// Ogni click sul bottone alterna tra ON e OFF:
//   • Se intervalloRefresh è null → refresh inattivo → lo attiviamo
//   • Se intervalloRefresh ha un ID → refresh attivo → lo fermiamo
// ─────────────────────────────────────────────
btnAutoRefresh.addEventListener("click", () => {
    if (intervalloRefresh) {
        // Il refresh è attivo → lo fermiamo
        clearInterval(intervalloRefresh);   // ferma il timer
        intervalloRefresh = null;           // resettiamo la variabile a null
        btnAutoRefresh.textContent = "🔄 Auto-refresh OFF";
        btnAutoRefresh.classList.remove("attivo"); // torna al colore blu
    } else {
        // Il refresh è inattivo → lo avviamo
        // controllaTutti verrà chiamata ogni 30 secondi (30000ms)
        intervalloRefresh = setInterval(controllaTutti, 30000);
        btnAutoRefresh.textContent = "🔄 Auto-refresh ON (30s)";
        btnAutoRefresh.classList.add("attivo"); // diventa rosso (classe CSS .attivo)
        controllaTutti(); // eseguiamo subito il primo controllo senza aspettare 30s
    }
});

// ─────────────────────────────────────────────
// PASSO 9: Ascoltiamo il click sul bottone principale
//
// Ogni click chiama controllaTutti() che:
//   1. Disabilita il bottone
//   2. Mostra card "in verifica"
//   3. Lancia tutti i fetch in parallelo
//   4. Aggiorna le card man mano che arrivano
//   5. Mostra il riepilogo finale
//   6. Riabilita il bottone
// ─────────────────────────────────────────────
btnControlla.addEventListener("click", controllaTutti);
