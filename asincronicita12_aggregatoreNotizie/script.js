/*

## 🏆 Esercizio 12 — Aggregatore di notizie (⭐⭐⭐⭐ sfida)

Crea un aggregatore che combina dati da più "fonti" (usiamo endpoint diversi di JSONPlaceholder come fonti simulate) e li presenta in un feed unificato.

**Fonti di dati:**

- "Blog": `https://jsonplaceholder.typicode.com/posts?_limit=10` (usa `title` e `body`)
- "Social": `https://jsonplaceholder.typicode.com/comments?_limit=15` (usa `name` come titolo e `body`)
- "News": `https://jsonplaceholder.typicode.com/todos?_limit=20` (usa `title`, e `completed` come "letto/non letto")

**Funzionalità:**

1. **Caricamento parallelo** di tutte e 3 le fonti con barra di progresso
2. **Feed unificato**: tutti i contenuti mescolati in ordine casuale, con un badge che indica la fonte (Blog 📝 / Social 💬 / News 📰)
3. **Filtri per fonte**: checkbox per mostrare/nascondere ogni fonte
4. **Ricerca** nel feed unificato
5. **Segna come letto**: click su un item lo segna come letto (sfondo diverso)
6. **Refresh singola fonte**: bottone per ricaricare solo una fonte senza perdere lo stato "letto" delle altre
7. **Statistiche**: totale items, items per fonte, items letti, items non letti
8. **Ordinamento**: per fonte, per titolo (A-Z), per stato (non letti prima)
9. **Persistenza**: lo stato "letto" viene salvato in localStorage

**Suggerimenti:**

- Normalizza i dati da ogni fonte in un formato comune: `{ id: "blog_1", fonte: "blog", titolo: "...", corpo: "...", letto: false }`
- L'id deve essere unico e contenere la fonte per evitare conflitti: `"blog_" + post.id`
- Per il refresh singolo: ricarica solo i dati di quella fonte, mantieni le altre. Ripristina lo stato "letto" confrontando gli id con quelli salvati in localStorage
- Per i filtri: non rimuovere gli items dal DOM, usa `.classList.toggle("nascosto")` basandoti sullo stato dei checkbox
- Per il mescolamento casuale: `array.sort(() => Math.random() - 0.5)` (shuffle semplice)
- La barra di progresso si aggiorna ad ogni fonte completata (0%, 33%, 66%, 100%)
- Per le statistiche: ricalcola tutto con `.filter()` e `.length` dopo ogni azione


*/

// ============================================================
// STEP 1 — Recupero i riferimenti agli elementi HTML
// Uso getElementById per puntare ai nodi del DOM che mi
// serviranno per aggiornare la UI durante l'esecuzione.
// ============================================================
const progressoBarra = document.getElementById("progressoBarra");       // l'elemento della barra azzurra
const progressoContainer = document.getElementById("progressoContainer"); // il contenitore grigio attorno alla barra
const contenuto = document.getElementById("contenuto");                 // il blocco principale (nascosto all'inizio)
const feedEl = document.getElementById("feed");                         // il div dove stamperò le notizie
const statisticheEl = document.getElementById("statistiche");           // il div dei badge con i conteggi
const ricercaInput = document.getElementById("ricerca");                // la casella di testo per cercare
const ordinamentoSelect = document.getElementById("ordinamento");       // il menu a tendina per ordinare

// ============================================================
// STEP 2 — Variabili globali di stato
// items → array che conterrà TUTTI gli articoli caricati
// fontiCompletate → contatore usato per la barra progresso
// ============================================================
let items = [];
let fontiCompletate = 0;

// ============================================================
// STEP 3 — Persistenza: localStorage
// Il browser mette a disposizione localStorage, uno spazio
// chiave→valore che sopravvive alla chiusura della pagina.
// Qui salvo/leggo la lista degli ID degli articoli letti.
// ============================================================

// Legge dal localStorage la lista di ID salvati.
// Se non c'è nulla restituisce un array vuoto [].
function caricaStatoLetto() {
    const salvato = localStorage.getItem("aggregatore_letti");
    return salvato ? JSON.parse(salvato) : [];
    // JSON.parse converte la stringa salvata di nuovo in array JavaScript
}

// Scrive nel localStorage la lista corrente di ID letti.
// Prima filtra items tenendo solo quelli con letto === true,
// poi estrae solo gli id con .map(), poi serializza con JSON.stringify.
function salvaStatoLetto() {
    const lettiIds = items.filter(i => i.letto).map(i => i.id);
    localStorage.setItem("aggregatore_letti", JSON.stringify(lettiIds));
}

// ============================================================
// STEP 4 — Barra di progresso
// Ogni volta che una fonte termina il download, chiamo questa
// funzione. Incremento il contatore e ricalcolo la percentuale
// su 3 fonti totali: 1/3 = 33%, 2/3 = 66%, 3/3 = 100%.
// ============================================================
function aggiornaProgresso() {
    fontiCompletate++;
    const pct = Math.round((fontiCompletate / 3) * 100); // calcola la % arrotondata
    progressoBarra.style.width = `${pct}%`;              // allarga fisicamente la barra
    progressoBarra.textContent = `${pct}%`;              // scrive il testo dentro la barra
}

// ============================================================
// STEP 5 — Normalizzazione dei dati
// Le tre API restituiscono oggetti con campi diversi
// (post ha "title"/"body", comment ha "name"/"body", todo ha
// "title"/"completed"). Normalizzo tutto in un formato comune:
//   { id, fonte, titolo, corpo, letto }
// Così il resto del codice non deve sapere da dove arriva il dato.
// ============================================================

// Blog: /posts → ogni post diventa un oggetto normalizzato.
// L'id è "blog_1", "blog_2" ecc. per non confondersi con
// gli id degli altri (anche loro partono da 1).
function normalizzaBlog(posts) {
    return posts.map(p => ({
        id: `blog_${p.id}`,   // id univoco con prefisso della fonte
        fonte: "blog",
        titolo: p.title,
        corpo: p.body,
        letto: false           // di default non letto
    }));
}

// Social: /comments → uso "name" come titolo (i commenti non
// hanno un vero titolo, ma hanno un campo "name").
function normalizzaSocial(comments) {
    return comments.map(c => ({
        id: `social_${c.id}`,
        fonte: "social",
        titolo: c.name,
        corpo: c.body,
        letto: false
    }));
}

// News: /todos → uso "completed" sia come corpo descrittivo
// sia come stato iniziale "letto" (todo completato = già letto).
function normalizzaNews(todos) {
    return todos.map(t => ({
        id: `news_${t.id}`,
        fonte: "news",
        titolo: t.title,
        corpo: t.completed ? "✅ Completato" : "⬜ Da fare",
        letto: t.completed  // "completed" come "letto"
    }));
}

// ============================================================
// STEP 6 — Caricamento iniziale parallelo con Promise.all
// Le tre fetch partono CONTEMPORANEAMENTE (non una dopo l'altra).
// Ognuna, appena finisce, chiama aggiornaProgresso() e poi
// normalizza i dati. Promise.all aspetta che TUTTE e tre
// finiscano prima di continuare.
// ============================================================
async function caricaTutto() {
    const BASE = "https://jsonplaceholder.typicode.com";
    fontiCompletate = 0; // reset del contatore all'avvio

    // Creo tre Promise. Ognuna:
    //   1. fa il fetch → ottiene la Response
    //   2. .then(r => r.json()) → la converte in array JS
    //   3. .then(d => { ... }) → aggiorna la barra e normalizza
    // Le tre Promise partono subito, in parallelo.
    const fBlog = fetch(`${BASE}/posts?_limit=10`)
        .then(r => r.json())
        .then(d => { aggiornaProgresso(); return normalizzaBlog(d); });

    const fSocial = fetch(`${BASE}/comments?_limit=15`)
        .then(r => r.json())
        .then(d => { aggiornaProgresso(); return normalizzaSocial(d); });

    const fNews = fetch(`${BASE}/todos?_limit=20`)
        .then(r => r.json())
        .then(d => { aggiornaProgresso(); return normalizzaNews(d); });

    // Aspetto che tutte e tre le Promise siano risolte.
    // La destrutturazione [blog, social, news] prende i tre
    // array risultanti nell'ordine in cui li ho passati.
    const [blog, social, news] = await Promise.all([fBlog, fSocial, fNews]);

    // Unisco i tre array in uno solo con lo spread operator ...
    items = [...blog, ...social, ...news];

    // Ripristino lo stato "letto" salvato in precedenza:
    // se un id è nella lista salvata, rimetto letto = true.
    const lettiSalvati = caricaStatoLetto();
    items.forEach(item => {
        if (lettiSalvati.includes(item.id)) item.letto = true;
    });

    // Mescolo casualmente l'array (shuffle).
    // Math.random() - 0.5 restituisce un numero positivo o negativo
    // a caso → .sort() usa questo per invertire o mantenere l'ordine.
    items.sort(() => Math.random() - 0.5);

    // Nascondo la barra di progresso e mostro il contenuto principale.
    progressoContainer.classList.add("nascosto");
    contenuto.classList.remove("nascosto");

    renderizzaFeed(); // disegno il feed per la prima volta
}

// ============================================================
// STEP 7 — Refresh di una singola fonte
// Ricarica solo gli articoli di "blog", "social" o "news"
// senza toccare le altre fonti e senza perdere lo stato letto.
// ============================================================
async function refreshFonte(fonte) {
    const BASE = "https://jsonplaceholder.typicode.com";

    // Leggo lo stato letto attuale PRIMA di ricaricare,
    // così posso ripristinarlo sui nuovi dati.
    const lettiSalvati = caricaStatoLetto();

    let nuoviItems;
    try {
        // In base alla fonte richiesta faccio il fetch giusto
        // e normalizzo nel formato comune.
        if (fonte === "blog") {
            const dati = await (await fetch(`${BASE}/posts?_limit=10`)).json();
            nuoviItems = normalizzaBlog(dati);
        } else if (fonte === "social") {
            const dati = await (await fetch(`${BASE}/comments?_limit=15`)).json();
            nuoviItems = normalizzaSocial(dati);
        } else if (fonte === "news") {
            const dati = await (await fetch(`${BASE}/todos?_limit=20`)).json();
            nuoviItems = normalizzaNews(dati);
        }

        // Ripristino lo stato "letto" anche per i nuovi items
        nuoviItems.forEach(item => {
            if (lettiSalvati.includes(item.id)) item.letto = true;
        });

        // Sostituisco SOLO gli items di quella fonte nell'array globale:
        // .filter() rimuove i vecchi item di quella fonte,
        // .concat() aggiunge i nuovi al posto loro.
        items = items.filter(i => i.fonte !== fonte).concat(nuoviItems);

        renderizzaFeed(); // ridisegno tutto
    } catch (err) {
        // Se la rete è down o l'URL non risponde, mostro l'errore.
        alert(`Errore refresh ${fonte}: ${err.message}`);
    }
}

// ============================================================
// STEP 8 — Badge descrittivo per ogni fonte
// Converte la stringa "blog"/"social"/"news" in un'etichetta
// con emoji da mostrare nell'interfaccia.
// ============================================================
function getBadge(fonte) {
    const badge = { blog: "📝 Blog", social: "💬 Social", news: "📰 News" };
    return badge[fonte] || fonte; // fallback: mostra la stringa grezza
}

// ============================================================
// STEP 9 — Statistiche
// Conta gli articoli totali, per fonte, letti e non letti
// e aggiorna i "badge" nella UI.
// Nota: usa sempre items (il totale), non itemsFiltrati,
// così le statistiche mostrano sempre la situazione reale.
// ============================================================
function aggiornaStatistiche(itemsFiltrati) {
    const totale = items.length;
    const blog   = items.filter(i => i.fonte === "blog").length;
    const social = items.filter(i => i.fonte === "social").length;
    const news   = items.filter(i => i.fonte === "news").length;
    const letti  = items.filter(i => i.letto).length;

    // Costruisco l'HTML dei badge direttamente come stringa
    statisticheEl.innerHTML = `
        <div class="stat-badge">📊 Totale: ${totale}</div>
        <div class="stat-badge">📝 Blog: ${blog}</div>
        <div class="stat-badge">💬 Social: ${social}</div>
        <div class="stat-badge">📰 News: ${news}</div>
        <div class="stat-badge">👁️ Letti: ${letti}</div>
        <div class="stat-badge">🆕 Non letti: ${totale - letti}</div>
    `;
}

// ============================================================
// STEP 10 — Renderizzazione del feed
// Questa funzione viene chiamata ogni volta che qualcosa cambia
// (ricerca, filtri, ordinamento, click su un item).
// Ricostruisce ogni volta l'intero HTML del feed.
// ============================================================
function renderizzaFeed() {
    // Leggo i valori correnti dei controlli UI
    const query = ricercaInput.value.trim().toLowerCase();    // testo cercato
    const ordinamento = ordinamentoSelect.value;              // valore del select
    // Raccoglie i valori dei checkbox spuntati: ["blog", "news"] ecc.
    const fontiAttive = [...document.querySelectorAll(".filtri-fonte input:checked")]
        .map(cb => cb.value);

    // --- FILTRO PER FONTE ---
    // Tengo solo gli items la cui fonte è tra quelle attive
    let filtrati = items.filter(i => fontiAttive.includes(i.fonte));

    // --- FILTRO PER RICERCA ---
    // Se c'è del testo nella casella, tengo solo gli items
    // che lo contengono nel titolo o nel corpo (case-insensitive).
    if (query) {
        filtrati = filtrati.filter(i =>
            i.titolo.toLowerCase().includes(query) ||
            i.corpo.toLowerCase().includes(query)
        );
    }

    // --- ORDINAMENTO ---
    // .localeCompare() confronta stringhe rispettando la lingua
    // a.letto - b.letto → false(0) - true(1) mette i non letti prima
    switch (ordinamento) {
        case "fonte":
            filtrati.sort((a, b) => a.fonte.localeCompare(b.fonte));
            break;
        case "titolo":
            filtrati.sort((a, b) => a.titolo.localeCompare(b.titolo));
            break;
        case "nonLetti":
            filtrati.sort((a, b) => a.letto - b.letto); // false=0 < true=1
            break;
        // "casuale" → non riordinare, l'ordine è già random dall'inizio
    }

    // --- GENERAZIONE HTML ---
    // Per ogni item creo una card HTML. .join("") unisce tutto in
    // un'unica stringa senza virgole tra le card.
    // onclick="toggleLetto('...')" passa l'id alla funzione al click.
    // .substring(0, 120) tronca il testo lungo del corpo a 120 caratteri.
    feedEl.innerHTML = filtrati.map(item => `
        <div class="feed-item fonte-${item.fonte} ${item.letto ? "letto" : ""}"
             onclick="toggleLetto('${item.id}')">
            <div class="header-item">
                <span class="badge">${getBadge(item.fonte)}</span>
                <span>${item.letto ? "👁️ letto" : "🆕 nuovo"}</span>
            </div>
            <h3>${item.titolo}</h3>
            <p>${item.corpo.substring(0, 120)}${item.corpo.length > 120 ? "..." : ""}</p>
        </div>
    `).join("");

    aggiornaStatistiche(filtrati); // aggiorno i contatori dopo ogni render
}

// ============================================================
// STEP 11 — Toggle "letto"
// Al click su una card, cerco l'item nell'array tramite l'id,
// inverto il booleano letto (true↔false), salvo su localStorage
// e ridisegno il feed.
// ============================================================
function toggleLetto(id) {
    const item = items.find(i => i.id === id); // trova l'oggetto nell'array
    if (item) {
        item.letto = !item.letto; // inverte: true→false, false→true
        salvaStatoLetto();        // persiste su localStorage
        renderizzaFeed();         // ridisegna per aggiornare la UI
    }
}

// ============================================================
// STEP 12 — Event listeners
// Collego i controlli UI alle funzioni:
// - ogni volta che l'utente scrive nella casella → renderizzaFeed
// - ogni volta che cambia il select → renderizzaFeed
// - ogni volta che spunta/deseleziona un checkbox → renderizzaFeed
// ============================================================
ricercaInput.addEventListener("input", renderizzaFeed);
ordinamentoSelect.addEventListener("change", renderizzaFeed);
document.querySelectorAll(".filtri-fonte input").forEach(cb => {
    cb.addEventListener("change", renderizzaFeed);
});

// ============================================================
// STEP 13 — Avvio dell'applicazione
// Quando la pagina è pronta, parte subito il caricamento.
// ============================================================
caricaTutto();
