/*

## Esercizio 9 — Galleria foto con lazy loading (⭐⭐⭐ difficile)

Crea una galleria di foto dagli album di JSONPlaceholder con caricamento **a pagine** (infinite scroll o bottone "Carica altri").

**Funzionalità:**

1. All'avvio, carica le prime 20 foto: `https://jsonplaceholder.typicode.com/photos?_limit=20&_page=1`
2. Mostra le foto come griglia di thumbnail (`thumbnailUrl`)
3. Un bottone "Carica altre 20" (o scroll infinito) carica la pagina successiva e le **aggiunge** (non sostituisce)
4. Click su una foto → mostra l'immagine grande (`url`) in un modal/overlay
5. Un select per filtrare per album (1-10)
6. Mostra "Caricamento..." durante ogni fetch e "Non ci sono altre foto" quando le pagine sono finite

**Suggerimenti:**

- Tieni variabili di stato: `let paginaCorrente = 1; let albumCorrente = null; let finitePagine = false;`
- L'API restituisce un array vuoto `[]` quando non ci sono più dati → usa questo per sapere che le pagine sono finite
- Per il filtro album: resetta `paginaCorrente = 1`, svuota la galleria, e usa `&albumId={id}` nella URL
- Per lo scroll infinito (opzionale): ascolta `scroll` su `window` e controlla se sei vicino al fondo:

    ```jsx
    window.scrollY + window.innerHeight >= document.body.scrollHeight - 200
    ```

- Per il modal: crea un overlay a schermo intero con l'immagine grande, chiudi con click sull'overlay o Escape
*/

// ─── STEP 1: Prendi i riferimenti agli elementi HTML ─────────────────────────
// Queste variabili puntano agli elementi della pagina che useremo nel codice.
const griglia = document.getElementById("griglia");       // il div dove appaiono le foto
const stato = document.getElementById("stato");           // il div per i messaggi (caricamento, errori)
const btnCarica = document.getElementById("btnCarica");   // il bottone "Carica altre 20"
const albumSelect = document.getElementById("albumSelect"); // il menu a tendina per gli album

// ─── STEP 2: Variabili di stato ───────────────────────────────────────────────
// Queste variabili tengono traccia di "dove siamo" nella navigazione.
// Le aggiorniamo man mano che l'utente interagisce con la pagina.
let paginaCorrente = 1;    // partiamo dalla prima pagina
let albumCorrente = "";    // nessun album selezionato (vuoto = tutti)
let finitePagine = false;  // diventa true quando l'API non restituisce più foto
let staCaricando = false;  // evita di fare due fetch contemporaneamente

// ─── STEP 3: Popola il menu album ─────────────────────────────────────────────
// Creiamo dinamicamente le opzioni del <select> con un ciclo for.
// Per ogni numero da 1 a 10, creiamo una <option> e la aggiungiamo al select.
for (let i = 1; i <= 10; i++) {
    const option = document.createElement("option"); // crea <option>
    option.value = i;                                 // il valore che verrà inviato all'API
    option.textContent = `Album ${i}`;               // il testo visibile all'utente
    albumSelect.appendChild(option);                 // aggiunge al menu
}

// ─── STEP 4: Funzione principale — caricaFoto() ───────────────────────────────
// Questa funzione async si occupa di:
//   1. Controllare se possiamo procedere (niente doppi click, niente pagine finite)
//   2. Costruire l'URL con i parametri giusti (pagina, album)
//   3. Fare la fetch e gestire la risposta
//   4. Creare i div delle foto e aggiungerli alla griglia
async function caricaFoto() {

    // Guardia: se le pagine sono finite o stiamo già caricando, usciamo subito.
    // Questo impedisce richieste doppie (es. bottone + scroll nello stesso momento).
    if (finitePagine || staCaricando) return;

    // Blocchiamo tutto mentre aspettiamo la risposta dell'API
    staCaricando = true;
    btnCarica.disabled = true;
    stato.textContent = "⏳ Caricamento...";

    try {
        // ── Costruzione URL ──────────────────────────────────────────────────
        // Partiamo con l'URL base: chiediamo 20 foto alla pagina corrente.
        // Es: ?_limit=20&_page=1 → prime 20 foto
        //     ?_limit=20&_page=2 → foto 21-40, ecc.
        let url = `https://jsonplaceholder.typicode.com/photos?_limit=20&_page=${paginaCorrente}`;

        // Se l'utente ha scelto un album specifico, lo aggiungiamo all'URL.
        // Es: &albumId=3 → solo foto dell'album 3
        if (albumCorrente) {
            url += `&albumId=${albumCorrente}`;
        }

        // ── Fetch e controllo risposta ───────────────────────────────────────
        // await: aspettiamo che la risposta HTTP arrivi dal server
        const risposta = await fetch(url);

        // Se il server risponde con un errore (es. 404, 500), lanciamo un errore manuale
        if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);

        // await: aspettiamo che il corpo JSON venga letto e trasformato in array
        const foto = await risposta.json();

        // ── Controllo fine pagine ────────────────────────────────────────────
        // Se l'API restituisce un array vuoto, non ci sono altre foto.
        // Aggiorniamo lo stato e blocchiamo il bottone definitivamente.
        if (foto.length === 0) {
            finitePagine = true;
            stato.textContent = "📭 Non ci sono altre foto.";
            btnCarica.disabled = true;
            return; // usciamo dalla funzione, non c'è nulla da mostrare
        }

        // ── Creazione card per ogni foto ─────────────────────────────────────
        // forEach scorre l'array di foto e per ognuna crea un elemento HTML.
        foto.forEach(f => {
            // Creiamo un <div class="foto"> per ogni foto
            const div = document.createElement("div");
            div.className = "foto";

            // Inseriamo dentro il div: la thumbnail (immagine piccola) e il titolo
            // f.thumbnailUrl → URL immagine piccola (150x150)
            // f.title        → testo descrittivo della foto
            div.innerHTML = `
                <img src="${f.thumbnailUrl}" alt="${f.title}">
                <div class="titolo">${f.title}</div>
            `;

            // Al click sulla card, apriamo il modal con l'immagine grande
            // f.url → URL immagine grande (600x600)
            div.addEventListener("click", () => apriModal(f.url, f.title));

            // Aggiungiamo la card alla griglia nella pagina
            griglia.appendChild(div);
        });

        // ── Aggiorniamo lo stato ─────────────────────────────────────────────
        // La prossima chiamata caricherà la pagina successiva
        paginaCorrente++;
        stato.textContent = ""; // puliamo il messaggio "Caricamento..."

    } catch (err) {
        // Se qualcosa va storto (rete assente, errore HTTP...), mostriamo l'errore
        stato.textContent = `❌ Errore: ${err.message}`;

    } finally {
        // finally viene eseguito SEMPRE, sia dopo try che dopo catch.
        // Riabilitiamo il bottone e resettiamo il flag di caricamento.
        staCaricando = false;
        if (!finitePagine) btnCarica.disabled = false;
    }
}

// ─── STEP 5: Funzione modal ───────────────────────────────────────────────────
// Mostra l'immagine grande a tutto schermo quando l'utente clicca una foto.
// Crea un <div class="overlay"> con dentro il tag <img> grande.
function apriModal(urlImmagine, titolo) {
    const overlay = document.createElement("div");
    overlay.className = "overlay"; // CSS: sfondo scuro a tutto schermo

    // Inseriamo l'immagine grande dentro l'overlay
    overlay.innerHTML = `<img src="${urlImmagine}" alt="${titolo}">`;

    // Cliccando sull'overlay (lo sfondo scuro), rimuoviamo il modal dalla pagina
    overlay.addEventListener("click", () => overlay.remove());

    document.body.appendChild(overlay); // aggiungiamo l'overlay alla pagina
}

// ─── STEP 6: Chiudi modal con tasto Escape ────────────────────────────────────
// Alternativa alla chiusura col click: premiamo Escape per chiudere il modal.
// document.addEventListener ascolta gli eventi tastiera su tutta la pagina.
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        // Cerchiamo l'overlay nella pagina (se esiste) e lo rimuoviamo
        const overlay = document.querySelector(".overlay");
        if (overlay) overlay.remove();
    }
});

// ─── STEP 7: Cambio album → resetta e ricarica ────────────────────────────────
// Quando l'utente sceglie un album diverso dal menu a tendina:
//   1. Salviamo il nuovo album selezionato
//   2. Torniamo alla pagina 1 (ricominciamo dall'inizio)
//   3. Resettiamo il flag "finito"
//   4. Svuotiamo la griglia delle foto precedenti
//   5. Ricarichiamo le foto con i nuovi parametri
albumSelect.addEventListener("change", () => {
    albumCorrente = albumSelect.value; // "" = tutti, "3" = solo album 3, ecc.
    paginaCorrente = 1;                // torna all'inizio
    finitePagine = false;              // potrebbe esserci un album più lungo
    griglia.innerHTML = "";            // svuota le foto vecchie
    caricaFoto();                      // carica le nuove
});

// ─── STEP 8: Bottone "Carica altre" ──────────────────────────────────────────
// Al click sul bottone chiamiamo caricaFoto() che caricherà la pagina successiva
// (paginaCorrente è già stata incrementata nell'ultima chiamata).
btnCarica.addEventListener("click", caricaFoto);

// ─── STEP 9: Scroll infinito (opzionale) ─────────────────────────────────────
// Alternativa al bottone: carichiamo automaticamente quando l'utente
// arriva vicino al fondo della pagina (entro 200px dal fondo).
//
// window.scrollY       → quanti pixel ha scrollato dall'alto
// window.innerHeight   → altezza visibile della finestra
// document.body.scrollHeight → altezza totale della pagina
//
// Quando la loro somma supera l'altezza totale - 200px → siamo vicini al fondo
window.addEventListener("scroll", () => {
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 200) {
        caricaFoto(); // la guardia interna evita richieste doppie
    }
});

// ─── STEP 10: Caricamento iniziale ───────────────────────────────────────────
// Appena la pagina è pronta, carichiamo le prime 20 foto.
caricaFoto();
