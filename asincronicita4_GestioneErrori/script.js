/*

## Esercizio 4 — Gestione errori robusta (⭐⭐ medio)

Crea una funzione `fetchSicuro(url)` che:

1. Fa la richiesta con `fetch`
2. Controlla `response.ok` e lancia un errore con lo status se non è ok
3. Parsa il JSON
4. Ha un **timeout** di 5 secondi (se la risposta non arriva in tempo, lancia un errore "Timeout")
5. Fa fino a **3 tentativi** in caso di errore, aspettando 1 secondo tra un tentativo e l'altro
6. Restituisce i dati se riesce, oppure lancia l'errore dopo 3 tentativi falliti

Testala con:

```jsx
// Deve funzionare
const utente = await fetchSicuro("https://jsonplaceholder.typicode.com/users/1");
console.log(utente);

// Deve fallire dopo 3 tentativi
const fallito = await fetchSicuro("https://jsonplaceholder.typicode.com/utenti/999");
```

**Suggerimenti:**

- Per il timeout: usa `Promise.race()` tra il fetch e un `new Promise((_, reject) => setTimeout(...))`
- Per i tentativi: usa un ciclo `for` da 0 a `maxTentativi` con `try/catch` dentro. Se il catch cattura un errore e non è l'ultimo tentativo, aspetta 1 secondo con `await new Promise(r => setTimeout(r, 1000))`
- Se l'ultimo tentativo fallisce, rilancia l'errore con `throw errore`
- Logga ogni tentativo: `console.log(\`Tentativo ${i + 1}/${maxTentativi}...`)`
*/

// ─────────────────────────────────────────────────────────────────────────────
// FUNZIONE PRINCIPALE
//
// fetchSicuro è una versione "blindata" del normale fetch.
// Accetta tre parametri:
//   - url         → l'indirizzo da cui vuoi scaricare i dati
//   - maxTentativi → quante volte riprovare prima di arrendersi (default: 3)
//   - timeoutMs   → quanti millisecondi aspettare prima di considerare
//                   la richiesta "troppo lenta" (default: 5000 = 5 secondi)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchSicuro(url, maxTentativi = 3, timeoutMs = 5000) {

    // Il ciclo for gestisce i tentativi: i va da 0 a maxTentativi - 1.
    // Ad ogni giro proviamo la richiesta; se va male, riproviamo.
    for (let i = 0; i < maxTentativi; i++) {
        console.log(`Tentativo ${i + 1}/${maxTentativi}...`);

        // try/catch racchiude il codice "rischioso":
        //   - nel blocco try  → quello che vogliamo fare
        //   - nel blocco catch → cosa fare se qualcosa va storto
        try {

            // ── TIMEOUT ──────────────────────────────────────────────────────
            // Il problema di fetch() è che può restare in attesa all'infinito.
            // Per evitarlo usiamo Promise.race(): questa funzione accetta un
            // array di Promise e "vince" la prima che si risolve (o che lancia
            // un errore). In pratica mettiamo in gara:
            //   1. la richiesta reale (fetch)
            //   2. un timer che, dopo timeoutMs millisecondi, lancia un errore
            // Se il server risponde prima del timer → vince fetch.
            // Se il timer scatta prima    → vince il timeout → errore.
            const risposta = await Promise.race([
                fetch(url),                             // corsia 1: richiesta reale
                new Promise((_, reject) =>              // corsia 2: timer di timeout
                    setTimeout(
                        () => reject(new Error("Timeout: la richiesta ha impiegato troppo")),
                        timeoutMs
                    )
                )
            ]);

            // ── CONTROLLO HTTP ────────────────────────────────────────────────
            // fetch() non lancia un errore automaticamente per risposte come
            // 404 (non trovato) o 500 (errore del server): considera "successo"
            // qualsiasi risposta arrivata. Dobbiamo controllare noi.
            // risposta.ok è true solo se lo status HTTP è tra 200 e 299.
            if (!risposta.ok) {
                // Lanciamo manualmente un errore con il codice HTTP ricevuto.
                // Questo errore verrà catturato dal catch qui sotto.
                throw new Error(`HTTP ${risposta.status}: ${risposta.statusText}`);
            }

            // ── PARSING JSON ──────────────────────────────────────────────────
            // La risposta HTTP arriva come testo grezzo. risposta.json()
            // lo converte in un oggetto JavaScript utilizzabile.
            // È async perché deve leggere lo "stream" di dati dal network.
            const dati = await risposta.json();

            console.log(`Successo al tentativo ${i + 1}!`);

            // Tutto è andato bene: restituiamo i dati e usciamo dalla funzione.
            // Il ciclo for si interrompe qui grazie a return.
            return dati;

        } catch (errore) {

            // ── GESTIONE DELL'ERRORE ──────────────────────────────────────────
            // Arriviamo qui se:
            //   - il timeout è scattato
            //   - la risposta non era ok (404, 500…)
            //   - la rete era assente
            //   - il JSON era malformato
            console.warn(`Tentativo ${i + 1} fallito: ${errore.message}`);

            // Controlliamo se è l'ULTIMO tentativo confrontando l'indice
            // del ciclo (i) con maxTentativi - 1.
            // Es. con maxTentativi = 3: l'ultimo giro è i = 2 → 2 === 3-1 ✓
            if (i === maxTentativi - 1) {
                // Abbiamo esaurito i tentativi: lanciamo un errore finale
                // che riassume quanti tentativi abbiamo fatto e qual era
                // l'ultimo messaggio di errore ricevuto.
                throw new Error(`Fallito dopo ${maxTentativi} tentativi. Ultimo errore: ${errore.message}`);
            }

            // ── PAUSA TRA UN TENTATIVO E L'ALTRO ─────────────────────────────
            // Non riproviamo subito: aspettiamo 1 secondo per non
            // sovraccaricare il server e dare il tempo alla rete di riprendersi.
            // setTimeout da solo non è "awaitable", quindi lo avvolgiamo in una
            // Promise: resolve viene chiamato dopo 1000ms → await si sblocca.
            console.log("Riprovo tra 1 secondo...");
            await new Promise(resolve => setTimeout(resolve, 1000));

            // A questo punto il ciclo for riparte con i + 1 → prossimo tentativo.
        }
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// TEST
// ─────────────────────────────────────────────────────────────────────────────
async function test() {

    // Test 1: URL VALIDO
    // jsonplaceholder.typicode.com è un'API pubblica di test.
    // /users/1 restituisce un oggetto utente con name, email, ecc.
    // Ci aspettiamo: successo al primo tentativo.
    try {
        console.log("--- Test URL valido ---");
        const utente = await fetchSicuro("https://jsonplaceholder.typicode.com/users/1");
        console.log("Utente:", utente.name, utente.email);
    } catch (err) {
        console.error("Errore:", err.message);
    }

    // Test 2: URL NON VALIDO
    // "/utenti/999" non esiste su jsonplaceholder (il path corretto sarebbe /users).
    // Il server risponderà con HTTP 404 → !risposta.ok → errore ad ogni tentativo.
    // Ci aspettiamo: 3 tentativi falliti, poi errore finale.
    try {
        console.log("\n--- Test URL non valido ---");
        const fallito = await fetchSicuro("https://jsonplaceholder.typicode.com/utenti/999");
        console.log("Questo non verrà stampato");
    } catch (err) {
        console.error("Errore finale:", err.message);
    }
}

test();
