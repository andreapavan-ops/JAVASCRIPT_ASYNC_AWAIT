/*
## Esercizio 7 — Catena di fetch dipendenti (⭐⭐⭐ difficile)

Crea un'applicazione che mostra la catena: **Utente → Post → Commenti**.

**Flusso:**

1. Pagina si carica → mostra la lista di 10 utenti (nomi cliccabili)
2. Click su un utente → carica i suoi post → mostra la lista di titoli
3. Click su un post → carica i commenti di quel post → mostra i commenti
4. Un "breadcrumb" in alto mostra il percorso: `Utenti > Mario Rossi > Post "Il mio titolo"` con ogni pezzo cliccabile per tornare indietro

**API:**

- Utenti: `https://jsonplaceholder.typicode.com/users`
- Post di un utente: `https://jsonplaceholder.typicode.com/posts?userId={id}`
- Commenti di un post: `https://jsonplaceholder.typicode.com/comments?postId={id}`

**Requisiti tecnici:**

- Ogni transizione mostra uno stato "Caricamento..."
- Errori gestiti con try/catch e messaggio visivo
- Usa async/await (non .then)

**Suggerimenti:**

- Struttura la UI con 3 "viste" (`<div>`) che mostri/nascondi a seconda del livello corrente
- Tieni variabili per lo stato corrente: `let utenteCorrente = null; let postCorrente = null;`
- Crea funzioni separate: `mostraUtenti()`, `mostraPost(userId)`, `mostraCommenti(postId)`
- Per il breadcrumb: aggiorna il suo innerHTML ad ogni cambio di vista, con `<span>` cliccabili che chiamano la funzione di navigazione appropriata
- Per tornare indietro: i click sul breadcrumb richiamano la funzione del livello precedente
*/

// ─────────────────────────────────────────────────────────────────────────────
// RIFERIMENTI AL DOM
// Prendiamo i nodi HTML una sola volta all'avvio: è più efficiente che cercarli
// ogni volta dentro le funzioni. Usiamo getElementById perché ogni elemento
// ha un id univoco definito nell'HTML.
// ─────────────────────────────────────────────────────────────────────────────
const breadcrumb = document.getElementById("breadcrumb");
const vistaUtenti = document.getElementById("vista-utenti");
const vistaPost = document.getElementById("vista-post");
const vistaCommenti = document.getElementById("vista-commenti");

// ─────────────────────────────────────────────────────────────────────────────
// STATO GLOBALE
// Queste due variabili tengono traccia di "dove siamo" nella navigazione.
// Partono null perché all'avvio non abbiamo ancora selezionato nulla.
// Vengono aggiornate ogni volta che l'utente clicca su un elemento.
// ─────────────────────────────────────────────────────────────────────────────
let utenteCorrente = null; // es. { id: 1, name: "Leanne Graham" }
let postCorrente = null;   // es. { id: 3, title: "ea molestias quasi..." }

// ─────────────────────────────────────────────────────────────────────────────
// mostraVista(vista)
// Nasconde tutte e tre le viste, poi mostra solo quella passata come argomento.
// Questo simula una Single Page Application (SPA) senza ricaricare la pagina.
// La classe CSS "nascosto" solitamente corrisponde a display:none nell'HTML.
// ─────────────────────────────────────────────────────────────────────────────
function mostraVista(vista) {
    vistaUtenti.classList.add("nascosto");
    vistaPost.classList.add("nascosto");
    vistaCommenti.classList.add("nascosto");
    vista.classList.remove("nascosto"); // Rende visibile solo la vista richiesta
}

// ─────────────────────────────────────────────────────────────────────────────
// aggiornaBreadcrumb()
// Costruisce dinamicamente il "percorso di navigazione" (breadcrumb) in base
// allo stato corrente. Ha 3 casi mutuamente esclusivi:
//   - Nessun utente selezionato  →  "📍 Utenti"  (livello radice)
//   - Utente selezionato, nessun post  →  "Utenti > Nome"
//   - Utente E post selezionati  →  "Utenti > Nome > Titolo"
// I segmenti precedenti diventano <span> cliccabili per tornare indietro.
// ─────────────────────────────────────────────────────────────────────────────
function aggiornaBreadcrumb() {
    let html = "";

    if (!utenteCorrente) {
        // Caso 1: siamo alla radice, nessun link necessario
        html = `<span class="attivo">📍 Utenti</span>`;
    } else if (!postCorrente) {
        // Caso 2: stiamo guardando i post di un utente
        // "Utenti" è cliccabile → richiama mostraUtenti() per tornare alla lista
        html = `<span onclick="mostraUtenti()">📍 Utenti</span> &gt; <span class="attivo">${utenteCorrente.name}</span>`;
    } else {
        // Caso 3: stiamo guardando i commenti di un post
        // Sia "Utenti" che il nome dell'utente sono cliccabili per tornare indietro
        // substring(0,30) tronca il titolo lungo per non riempire il breadcrumb
        html = `<span onclick="mostraUtenti()">📍 Utenti</span> &gt; ` +
               `<span onclick="mostraPost(${utenteCorrente.id})">${utenteCorrente.name}</span> &gt; ` +
               `<span class="attivo">"${postCorrente.title.substring(0, 30)}..."</span>`;
    }

    breadcrumb.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSO 1 — mostraUtenti()
// Punto di ingresso dell'applicazione e destinazione del breadcrumb "Utenti".
//
// Sequenza:
//   1. Resetta lo stato globale (nessun utente/post selezionato)
//   2. Porta in primo piano la vista utenti
//   3. Aggiorna il breadcrumb (mostrerà solo "📍 Utenti")
//   4. Mostra un indicatore di caricamento mentre la fetch è in corso
//   5. Chiama l'API → aspetta la risposta → aspetta il parsing JSON
//   6. Costruisce la lista di utenti come HTML e la inietta nel DOM
//   7. Se qualcosa va storto, il catch cattura l'errore e lo mostra all'utente
// ─────────────────────────────────────────────────────────────────────────────
async function mostraUtenti() {
    // Reset dello stato: torniamo al livello "radice"
    utenteCorrente = null;
    postCorrente = null;
    mostraVista(vistaUtenti);
    aggiornaBreadcrumb();

    // Feedback immediato all'utente mentre aspettiamo la rete
    vistaUtenti.innerHTML = `<div class="caricamento">⏳ Caricamento utenti...</div>`;

    try {
        // fetch() è asincrona: await mette in pausa qui finché la risposta non arriva.
        // Nel frattempo il browser rimane reattivo (non si blocca).
        const risposta = await fetch("https://jsonplaceholder.typicode.com/users");

        // risposta.ok è false per codici HTTP 4xx/5xx (es. 404, 500).
        // fetch() di per sé NON lancia errori per questi codici → dobbiamo controllare noi.
        if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);

        // .json() è anch'essa asincrona: fa il parsing del testo JSON e restituisce
        // l'array di oggetti JavaScript. Secondo await necessario.
        const utenti = await risposta.json();

        // Array.map() trasforma ogni oggetto utente in una stringa HTML.
        // L'onclick passa id e nome come argomenti a mostraPost().
        // replace(/'/g, "\\'") evita che apostrofi nel nome rompano la stringa HTML.
        // .join("") concatena tutti gli elementi senza separatori.
        vistaUtenti.innerHTML = utenti.map(u => `
            <div class="lista-item" onclick="mostraPost(${u.id}, '${u.name.replace(/'/g, "\\'")}')">
                <h3>👤 ${u.name}</h3>
                <p>${u.email} — ${u.address.city}</p>
            </div>
        `).join("");
    } catch (err) {
        // Il catch intercetta sia errori di rete (es. nessuna connessione)
        // sia l'errore HTTP che abbiamo lanciato manualmente sopra.
        vistaUtenti.innerHTML = `<div class="errore">❌ Errore: ${err.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSO 2 — mostraPost(userId, nomeUtente)
// Chiamata quando l'utente clicca su un nome nella lista utenti,
// oppure dal breadcrumb (in quel caso nomeUtente non viene passato).
//
// Nota sul parametro opzionale nomeUtente:
//   - Dal click nella lista: riceve entrambi i valori → aggiorna utenteCorrente
//   - Dal breadcrumb (onclick="mostraPost(id)"): nomeUtente è undefined →
//     utenteCorrente.name rimane quello memorizzato in precedenza
// ─────────────────────────────────────────────────────────────────────────────
async function mostraPost(userId, nomeUtente) {
    // Aggiorna lo stato solo se il nome è disponibile (non chiamata da breadcrumb)
    if (nomeUtente) {
        utenteCorrente = { id: userId, name: nomeUtente };
    }
    postCorrente = null; // Reset: nessun post selezionato a questo livello
    mostraVista(vistaPost);
    aggiornaBreadcrumb();

    vistaPost.innerHTML = `<div class="caricamento">⏳ Caricamento post...</div>`;

    try {
        // Query string ?userId=X filtra i post lato server: l'API restituisce
        // solo i post appartenenti all'utente con quell'id. Fetch dipendente!
        const risposta = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`);
        if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
        const post = await risposta.json();

        // JSON.stringify(p.title) gestisce correttamente virgolette e caratteri
        // speciali nel titolo quando viene inserito come argomento inline nell'onclick.
        // substring(0, 100) tronca il corpo del post per un'anteprima compatta.
        vistaPost.innerHTML = post.map(p => `
            <div class="lista-item" onclick='mostraCommenti(${p.id}, ${JSON.stringify(p.title)})'>
                <h3>📝 ${p.title}</h3>
                <p>${p.body.substring(0, 100)}...</p>
            </div>
        `).join("");
    } catch (err) {
        vistaPost.innerHTML = `<div class="errore">❌ Errore: ${err.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSO 3 — mostraCommenti(postId, titoloPost)
// Livello più profondo della navigazione: mostra i commenti di un singolo post.
// Questa è la "catena di fetch dipendenti": prima serve l'utente, poi il post,
// solo allora possiamo caricare i commenti di quel post specifico.
// ─────────────────────────────────────────────────────────────────────────────
async function mostraCommenti(postId, titoloPost) {
    // Salviamo il post selezionato nello stato globale (serve al breadcrumb)
    postCorrente = { id: postId, title: titoloPost };
    mostraVista(vistaCommenti);
    aggiornaBreadcrumb();

    vistaCommenti.innerHTML = `<div class="caricamento">⏳ Caricamento commenti...</div>`;

    try {
        // Terza fetch della catena: ogni livello dipende dal precedente.
        // Senza aver prima scelto un utente e poi un post, non avremmo il postId.
        const risposta = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
        if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
        const commenti = await risposta.json();

        // Ogni commento ha: name (titolo del commento), email (autore), body (testo)
        vistaCommenti.innerHTML = commenti.map(c => `
            <div class="commento">
                <div class="autore">${c.name}</div>
                <div class="email">${c.email}</div>
                <div class="corpo">${c.body}</div>
            </div>
        `).join("");
    } catch (err) {
        vistaCommenti.innerHTML = `<div class="errore">❌ Errore: ${err.message}</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AVVIO
// Chiamata immediata all'avvio: avvia il caricamento della lista utenti non
// appena il browser esegue questo script. È il punto di ingresso dell'app.
// ─────────────────────────────────────────────────────────────────────────────
mostraUtenti();
