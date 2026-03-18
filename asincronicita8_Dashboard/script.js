/*

## Esercizio 8 — Dashboard con fetch multipli (⭐⭐⭐ difficile · 25)

Crea una dashboard che carica dati da **più endpoint contemporaneamente** e mostra statistiche aggregate.

**Al caricamento:**

1. Lancia in parallelo 4 fetch: utenti, post, commenti (limit 100), todo
2. Mostra una **barra di progresso** che si aggiorna man mano che ogni fetch completa
3. Quando tutti sono completati, mostra le statistiche

**Statistiche da calcolare:**

- Numero totale di utenti, post, commenti, todo
- Utente più attivo (chi ha più post)
- Post più commentato (quale post ha più commenti)
- Percentuale media di todo completati per utente
- Top 3 utenti per todo completati

**Suggerimenti:**

- Per la barra di progresso con aggiornamento incrementale, usa un contatore:
    
    ```jsx
    let completati = 0;const totale = 4;function aggiornaProgresso() {    completati++;    progressBar.style.width = `${(completati / totale) * 100}%`;    progressBar.textContent = `${completati}/${totale}`;}const fetchUtenti = fetch(urlUtenti).then(r => r.json()).then(dati => { aggiornaProgresso(); return dati; });// ... idem per gli altriconst [utenti, post, commenti, todo] = await Promise.all([fetchUtenti, fetchPost, fetchCommenti, fetchTodo]);
    ```
    
- Per l'utente più attivo: raggruppa i post per `userId` con `.reduce()`, poi trova il max
- Per il post più commentato: raggruppa i commenti per `postId` con `.reduce()`, poi trova il max
- Per i todo completati per utente: raggruppa per `userId`, poi per ogni gruppo calcola `completati / totale * 100`

*/

// --- STEP 1: Prendo i riferimenti agli elementi HTML ---
// Questi tre elementi esistono nella pagina e li useremo per:
// - progressoBarra: la striscia colorata che cresce man mano che i fetch completano
// - progressoContainer: il contenitore della barra (da nascondere quando tutto è caricato)
// - dashboard: il div dove mostrare le statistiche finali
const progressoBarra = document.getElementById("progressoBarra");
const progressoContainer = document.getElementById("progressoContainer");
const dashboard = document.getElementById("dashboard");

// --- STEP 2: Variabili per tracciare il progresso ---
// "completati" conta quanti fetch hanno già finito (parte da 0)
// "totale" è fisso a 4 perché lanceremo esattamente 4 fetch
let completati = 0;
const totale = 4;

// --- STEP 3: Funzione per aggiornare la barra di progresso ---
// Ogni volta che un fetch finisce, chiamiamo questa funzione.
// Incrementa il contatore e aggiorna la larghezza della barra in percentuale.
// Esempio: se completati=2 e totale=4 → larghezza = 50%
function aggiornaProgresso() {
    completati++;
    const percentuale = (completati / totale) * 100;
    progressoBarra.style.width = `${percentuale}%`;      // allarga la barra
    progressoBarra.textContent = `${completati}/${totale}`; // testo "2/4" ecc.
}

// --- STEP 4: Funzione principale async ---
// È async perché useremo "await" per aspettare i fetch
async function caricaDashboard() {
    const BASE = "https://jsonplaceholder.typicode.com";

    // --- STEP 5: Lancia 4 fetch IN PARALLELO ---
    // NON usiamo await qui: creiamo le Promise ma non aspettiamo subito.
    // In questo modo i 4 fetch partono tutti insieme (parallelo = più veloce).
    // Ogni .then() in coda fa due cose:
    //   1. converte la risposta in JSON
    //   2. aggiorna la barra di progresso non appena quel singolo fetch finisce
    const fetchUtenti   = fetch(`${BASE}/users`).then(r => r.json()).then(d => { aggiornaProgresso(); return d; });
    const fetchPost     = fetch(`${BASE}/posts`).then(r => r.json()).then(d => { aggiornaProgresso(); return d; });
    const fetchCommenti = fetch(`${BASE}/comments?_limit=100`).then(r => r.json()).then(d => { aggiornaProgresso(); return d; });
    const fetchTodo     = fetch(`${BASE}/todos`).then(r => r.json()).then(d => { aggiornaProgresso(); return d; });

    // --- STEP 6: Aspetta che TUTTI e 4 i fetch siano completati ---
    // Promise.all() riceve un array di Promise e aspetta che finiscano tutte.
    // Restituisce un array con i risultati nello stesso ordine.
    // La destrutturazione [ utenti, post, ... ] assegna ogni risultato alla sua variabile.
    const [utenti, post, commenti, todo] = await Promise.all([fetchUtenti, fetchPost, fetchCommenti, fetchTodo]);

    // --- STEP 7: Statistiche base (semplici conteggi) ---
    const totaleUtenti   = utenti.length;
    const totalePost     = post.length;
    const totaleCommenti = commenti.length;
    const totaleTodo     = todo.length;

    // --- STEP 8: Trova l'utente più attivo (chi ha pubblicato più post) ---
    // .reduce() scorre tutti i post e costruisce un oggetto { userId: conteggio }
    // Esempio risultato: { "1": 10, "2": 8, "3": 12, ... }
    const postPerUtente = post.reduce((acc, p) => {
        acc[p.userId] = (acc[p.userId] || 0) + 1; // se non esiste ancora, parte da 0
        return acc;
    }, {});

    // Object.entries() trasforma l'oggetto in array di coppie [userId, conteggio]
    // .sort() ordina dal più alto al più basso, [0] prende il primo (il massimo)
    // Risultato: idPiuAttivo = ["3", 12]  (userId come stringa, numero di post)
    const idPiuAttivo = Object.entries(postPerUtente)
        .sort((a, b) => b[1] - a[1])[0];

    // .find() cerca nell'array utenti quello con l'id corrispondente
    // Number() converte la stringa "3" nel numero 3 per il confronto
    const utentePiuAttivo = utenti.find(u => u.id === Number(idPiuAttivo[0]));

    // --- STEP 9: Trova il post più commentato ---
    // Stessa logica di prima, ma stavolta contiamo i commenti per ogni postId
    const commentiPerPost = commenti.reduce((acc, c) => {
        acc[c.postId] = (acc[c.postId] || 0) + 1;
        return acc;
    }, {});

    const idPostCommentato = Object.entries(commentiPerPost)
        .sort((a, b) => b[1] - a[1])[0]; // ["postId", numeroCommenti]

    const postPiuCommentato = post.find(p => p.id === Number(idPostCommentato[0]));

    // --- STEP 10: Calcola la percentuale media di todo completati per utente ---
    // Prima costruiamo un oggetto con, per ogni utente, quanti todo ha in totale e quanti ha completati
    // Esempio: { "1": { totale: 20, completati: 11 }, "2": { totale: 20, completati: 8 }, ... }
    const todoPerUtente = todo.reduce((acc, t) => {
        if (!acc[t.userId]) acc[t.userId] = { totale: 0, completati: 0 }; // inizializza se non esiste
        acc[t.userId].totale++;
        if (t.completed) acc[t.userId].completati++; // incrementa solo se il todo è completato
        return acc;
    }, {});

    // Per ogni utente calcoliamo la sua percentuale, poi facciamo la media di tutte
    const percentualiPerUtente = Object.values(todoPerUtente)
        .map(u => (u.completati / u.totale) * 100); // es. [55, 40, 70, ...]

    const mediaPercentuale = (
        percentualiPerUtente.reduce((s, v) => s + v, 0) / percentualiPerUtente.length
    ).toFixed(1); // .toFixed(1) arrotonda a 1 decimale, es. "54.3"

    // --- STEP 11: Top 3 utenti per numero di todo completati ---
    // .map() costruisce oggetti più comodi con nome utente e statistiche
    // .sort() ordina per numero di todo completati (dal più alto)
    // .slice(0, 3) prende solo i primi 3
    const top3 = Object.entries(todoPerUtente)
        .map(([userId, stats]) => ({
            utente: utenti.find(u => u.id === Number(userId)),
            completati: stats.completati,
            totale: stats.totale
        }))
        .sort((a, b) => b.completati - a.completati)
        .slice(0, 3);

    // --- STEP 12: Mostra la dashboard, nascondi la barra di progresso ---
    // Aggiunge/rimuove classi CSS per far apparire/scomparire gli elementi
    progressoContainer.classList.add("nascosto");
    dashboard.classList.remove("nascosto");

    // --- STEP 13: Genera l'HTML della dashboard con i dati calcolati ---
    // Template literal con ${} per inserire i valori dinamici nelle card
    dashboard.innerHTML = `
        <div class="stat-card">
            <h3>👥 Utenti totali</h3>
            <div class="valore">${totaleUtenti}</div>
        </div>
        <div class="stat-card">
            <h3>📝 Post totali</h3>
            <div class="valore">${totalePost}</div>
        </div>
        <div class="stat-card">
            <h3>💬 Commenti caricati</h3>
            <div class="valore">${totaleCommenti}</div>
        </div>
        <div class="stat-card">
            <h3>📋 Todo totali</h3>
            <div class="valore">${totaleTodo}</div>
        </div>
        <div class="stat-card">
            <h3>🏆 Utente più attivo</h3>
            <div class="valore">${utentePiuAttivo.name}</div>
            <div class="dettaglio">${idPiuAttivo[1]} post pubblicati</div>
        </div>
        <div class="stat-card">
            <h3>🔥 Post più commentato</h3>
            <div class="valore">${idPostCommentato[1]} commenti</div>
            <div class="dettaglio">"${postPiuCommentato.title.substring(0, 40)}..."</div>
        </div>
        <div class="stat-card">
            <h3>📈 Media todo completati</h3>
            <div class="valore">${mediaPercentuale}%</div>
            <div class="dettaglio">Media per utente</div>
        </div>
        <div class="stat-card">
            <h3>🥇 Top 3 per todo completati</h3>
            <div class="dettaglio">
                ${top3.map((t, i) => `${["🥇","🥈","🥉"][i]} ${t.utente.name}: ${t.completati}/${t.totale}`).join("<br>")}
            </div>
        </div>
    `;
}

// --- STEP 14: Avvia tutto al caricamento della pagina ---
caricaDashboard();