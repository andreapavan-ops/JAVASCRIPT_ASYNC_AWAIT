/*

## Esercizio 3 — Sequenziale vs Parallelo (⭐⭐ medio)

Usa questa funzione che simula il caricamento di un utente (impiega 1 secondo):

```jsx
function caricaUtente(id) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id, nome: `Utente_${id}`, caricatoAlle: new Date().toLocaleTimeString() });
        }, 1000);
    });
}
```

**Compiti:**

1. **Sequenziale:** Carica gli utenti 1, 2, 3, 4, 5 uno dopo l'altro con un ciclo `for...of` e `await`. Stampa ogni utente e il tempo totale. Dovrebbe impiegare ~5 secondi.
2. **Parallelo:** Carica gli stessi 5 utenti in parallelo con `Promise.all()`. Stampa tutti gli utenti e il tempo totale. Dovrebbe impiegare ~1 secondo.
3. **Confronto:** Stampa la differenza di tempo tra i due approcci.

**Suggerimenti:**

- Per misurare il tempo: `const inizio = Date.now();` all'inizio e `const fine = Date.now();` alla fine. La differenza `fine - inizio` è in millisecondi
- Per il sequenziale: `for (const id of [1,2,3,4,5]) { const utente = await caricaUtente(id); }`
- Per il parallelo: `const utenti = await Promise.all([1,2,3,4,5].map(id => caricaUtente(id)));`
- Guarda l'orario in `caricatoAlle`: nel sequenziale è diverso per ogni utente, nel parallelo è lo stesso

*/

// =============================================================================
// FUNZIONE HELPER: caricaUtente
// =============================================================================
//
// Questa funzione SIMULA una chiamata asincrona (es. una fetch verso un server).
// In un'app reale potrebbe essere: fetch('/api/utenti/1')
//
// Restituisce una PROMISE: un oggetto che rappresenta un valore
// che NON è ancora disponibile, ma lo sarà in futuro.
//
// La Promise accetta un callback con due parametri:
//   - resolve(valore) → chiamato quando l'operazione ha SUCCESSO
//   - reject(errore)  → chiamato quando l'operazione FALLISCE (qui non usato)
//
// setTimeout simula il ritardo di rete: dopo 1000ms (1 secondo),
// la Promise viene "risolta" con un oggetto utente.
//
// L'oggetto risultante ha tre campi:
//   - id:          il numero passato come argomento (shorthand ES6: { id } = { id: id })
//   - nome:        stringa costruita con template literal (`Utente_${id}`)
//   - caricatoAlle: l'orario ESATTO in cui la Promise si risolve
//                  → ci servirà per confrontare sequenziale vs parallelo!
//
function caricaUtente(id) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ id, nome: `Utente_${id}`, caricatoAlle: new Date().toLocaleTimeString() });
        }, 1000);
    });
}


// =============================================================================
// FUNZIONE 1: testSequenziale
// =============================================================================
//
// La parola chiave "async" trasforma questa funzione in una funzione asincrona.
// Una funzione async:
//   1. Restituisce SEMPRE una Promise (anche se scrivi "return 42")
//   2. Permette di usare "await" al suo interno
//
async function testSequenziale() {
    console.log("=== CARICAMENTO SEQUENZIALE ===");

    // Date.now() restituisce i millisecondi trascorsi dal 1° gennaio 1970.
    // Salvando il valore prima e dopo, possiamo misurare quanto tempo è passato.
    const inizio = Date.now();

    // Array vuoto che riempiremo con gli utenti caricati uno alla volta.
    const utenti = [];

    // for...of itera su ogni elemento di un array (o di qualsiasi iterabile).
    // A differenza di forEach, il for...of funziona correttamente con await:
    // ogni iterazione ASPETTA che la precedente sia finita prima di procedere.
    //
    // SCHEMA DI ESECUZIONE (sequenziale):
    //
    //   t=0s  → avvia caricamento utente 1
    //   t=1s  → utente 1 pronto, AWAIT sblocca → stampa → avvia utente 2
    //   t=2s  → utente 2 pronto, AWAIT sblocca → stampa → avvia utente 3
    //   t=3s  → utente 3 pronto ...
    //   t=4s  → utente 4 pronto ...
    //   t=5s  → utente 5 pronto → fine
    //
    // Totale: 5 secondi (1s × 5 utenti, uno dopo l'altro)
    //
    for (const id of [1, 2, 3, 4, 5]) {

        // "await" mette in PAUSA questa funzione finché la Promise non si risolve.
        // Importante: mette in pausa SOLO questa funzione async, non blocca
        // l'intero programma/browser. Il motore JS può fare altro nel frattempo.
        const utente = await caricaUtente(id);

        // Quando arriviamo qui, la Promise è risolta e "utente" contiene
        // l'oggetto { id, nome, caricatoAlle } restituito da resolve().
        console.log(`Caricato:`, utente);

        // Aggiungiamo l'utente all'array (anche se in questo esercizio
        // l'array non viene usato ulteriormente, è buona pratica raccoglierli).
        utenti.push(utente);
    }

    // Misuriamo il tempo trascorso dall'inizio.
    const fine = Date.now();
    console.log(`Tempo totale sequenziale: ${fine - inizio}ms`);
    // Output atteso: ~5000ms (1000ms × 5 utenti in serie)

    // Restituiamo il tempo impiegato: servirà a "confronto()" per fare il calcolo.
    // Siccome questa è una funzione async, "return fine - inizio" viene
    // automaticamente wrappato in una Promise risolta.
    return fine - inizio;
}


// =============================================================================
// FUNZIONE 2: testParallelo
// =============================================================================
//
async function testParallelo() {
    console.log("\n=== CARICAMENTO PARALLELO ===");
    const inizio = Date.now();

    // Promise.all() è il modo corretto per avviare operazioni asincrone IN PARALLELO.
    //
    // COME FUNZIONA:
    //   1. Riceve un array di Promise
    //   2. Le avvia TUTTE contemporaneamente (non aspetta che una finisca per iniziare la prossima)
    //   3. Restituisce una nuova Promise che si risolve quando TUTTE le Promise dell'array
    //      si sono risolte, con un array dei loro risultati nello stesso ordine.
    //   4. Se UNA sola Promise fallisce (reject), Promise.all fallisce immediatamente.
    //
    // SCHEMA DI ESECUZIONE (parallelo):
    //
    //   t=0s  → avvia caricamento utente 1, 2, 3, 4, 5 TUTTI insieme
    //   t=1s  → tutti e 5 pronti contemporaneamente → fine
    //
    // Totale: ~1 secondo (il tempo del più lento, non la somma dei tempi)
    //
    // [1,2,3,4,5].map(id => caricaUtente(id)) crea un array di 5 Promise:
    //   [ Promise<utente1>, Promise<utente2>, ..., Promise<utente5> ]
    //
    // await aspetta che Promise.all risolva, e "utenti" sarà:
    //   [ {id:1,...}, {id:2,...}, {id:3,...}, {id:4,...}, {id:5,...} ]
    //
    const utenti = await Promise.all(
        [1, 2, 3, 4, 5].map(id => caricaUtente(id))
    );

    // forEach scorre l'array e stampa ogni utente.
    // Nota: se guardi l'orario in "caricatoAlle", sarà lo stesso per tutti!
    // Questo conferma che sono stati caricati contemporaneamente.
    utenti.forEach(utente => console.log(`Caricato:`, utente));

    const fine = Date.now();
    console.log(`Tempo totale parallelo: ${fine - inizio}ms`);
    // Output atteso: ~1000ms (tutti e 5 in parallelo = tempo del più lento = 1s)

    return fine - inizio;
}


// =============================================================================
// FUNZIONE 3: confronto
// =============================================================================
//
// Funzione "orchestratrice": chiama le due funzioni di test in sequenza
// e stampa il confronto finale.
//
// Perché le chiamiamo in SEQUENZA qui (await una alla volta)?
// Perché vogliamo che il test sequenziale finisca PRIMA di avviare quello parallelo,
// così i tempi misurati non si influenzano a vicenda.
//
async function confronto() {

    // Aspettiamo che il test sequenziale finisca completamente (~5s).
    // "tempoSeq" riceve il valore restituito dalla Promise (i millisecondi impiegati).
    const tempoSeq = await testSequenziale();

    // Solo dopo che il sequenziale è finito, avviamo il parallelo (~1s).
    const tempoPar = await testParallelo();

    console.log("\n=== CONFRONTO ===");
    console.log(`Sequenziale: ${tempoSeq}ms`);
    console.log(`Parallelo: ${tempoPar}ms`);

    // Differenza assoluta in millisecondi (~4000ms = 4 secondi di risparmio).
    console.log(`Differenza: ${tempoSeq - tempoPar}ms`);

    // Quante volte è più veloce il parallelo?
    // Es: 5000 / 1000 = 5.0x più veloce
    // toFixed(1) arrotonda a 1 decimale → "5.0" invece di "5.000000002"
    console.log(`Il parallelo è ${(tempoSeq / tempoPar).toFixed(1)}x più veloce`);
}


// =============================================================================
// AVVIO DEL PROGRAMMA
// =============================================================================
//
// Chiamiamo confronto() per avviare tutto.
// Siccome confronto() è async, restituisce una Promise, ma qui non la gestiamo
// (non facciamo .catch o try/catch) perché questo è un esercizio didattico
// senza gestione degli errori.
//
// In un'applicazione reale dovresti sempre gestire eventuali errori:
//   confronto().catch(err => console.error("Errore:", err));
//
confronto();