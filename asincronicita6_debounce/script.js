/*

## Esercizio 6 — Ricerca utenti con debounce (⭐⭐ medio)

Crea una barra di ricerca che filtra gli utenti di JSONPlaceholder in tempo reale.

**Comportamento:**

1. Al caricamento della pagina, scarica tutti i 10 utenti e salvali in una variabile
2. L'utente digita nella barra di ricerca
3. Dopo 300ms che ha smesso di digitare (debounce), filtra gli utenti localmente
4. Mostra i risultati come cards
5. Se la barra è vuota, mostra tutti
6. Mostra il numero di risultati: "3 utenti trovati"

**Bonus:** Aggiungi un select per cercare per campo specifico (nome, email, città, azienda).

**Suggerimenti:**

- Carica gli utenti una sola volta al `DOMContentLoaded` con `await fetch(...)`
- La ricerca è **locale** (filtri l'array in memoria, non fai nuove fetch)
- Per il debounce: usa la funzione `debounce` dalla lezione sugli eventi
- Per la ricerca multi-campo: `JSON.stringify(utente).toLowerCase().includes(query)` è un trucco veloce per cercare in tutti i campi contemporaneamente
- Per il campo specifico: `utente[campo].toLowerCase().includes(query)` dove `campo` è il valore del select
*/

// ─── PASSO 1: Recuperiamo i riferimenti agli elementi HTML ───────────────────
// Invece di cercarli ogni volta, li salviamo in variabili una volta sola.
const searchInput = document.getElementById("searchInput");   // la casella di testo
const campoSelect = document.getElementById("campoSelect");   // il menu a tendina
const contatoreEl = document.getElementById("contatore");     // il testo "N utenti trovati"
const risultatiEl = document.getElementById("risultati");     // la griglia delle cards

// ─── PASSO 2: Variabile "magazzino" degli utenti ─────────────────────────────
// Scarichiamo gli utenti UNA sola volta e li teniamo qui.
// Tutte le ricerche successive filtrano questo array, senza fare nuove fetch.
let tuttiUtenti = [];

// ─── PASSO 3: La funzione debounce ───────────────────────────────────────────
// Problema: se l'utente digita "mario" fa scattare 5 eventi "input" in rapida
// successione. Senza debounce chiameremmo filtraUtenti 5 volte di fila.
//
// Soluzione: il debounce "aspetta" che l'utente smetta di digitare per un certo
// tempo (ritardo) prima di eseguire davvero la funzione.
//
// Come funziona:
//   - ogni volta che arrivi una nuova chiamata, il timer precedente viene annullato
//   - si riparte da zero con un nuovo timer di "ritardo" millisecondi
//   - solo quando il timer scade senza essere stato annullato, fn viene eseguita
function debounce(fn, ritardo) {
    let timer; // memorizza l'ID del timeout corrente
    return function (...args) {
        clearTimeout(timer);                             // annulla il timer precedente
        timer = setTimeout(() => fn.apply(this, args), ritardo); // ne parte uno nuovo
    };
}

// ─── PASSO 4: Caricamento iniziale degli utenti ──────────────────────────────
// DOMContentLoaded si attiva quando il browser ha costruito la pagina.
// async/await ci permette di scrivere codice asincrono come se fosse sincrono.
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // fetch scarica i dati dalla rete; await aspetta che la risposta arrivi
        const risposta = await fetch("https://jsonplaceholder.typicode.com/users");

        // .ok è false se il server risponde con un codice di errore (es. 404, 500)
        if (!risposta.ok) throw new Error("Errore nel caricamento");

        // .json() converte il testo JSON in un array JavaScript; await aspetta
        tuttiUtenti = await risposta.json();

        // Mostriamo subito tutti gli utenti appena scaricati
        mostraUtenti(tuttiUtenti);
    } catch (err) {
        // Se qualcosa va storto (rete assente, server giù...) mostriamo l'errore
        contatoreEl.textContent = `Errore: ${err.message}`;
    }
});

// ─── PASSO 5: Mostrare gli utenti nella pagina ───────────────────────────────
// Riceve un array di utenti e aggiorna il DOM: contatore + cards.
function mostraUtenti(utenti) {
    // Aggiorniamo il contatore con il numero di risultati
    // (gestiamo anche il singolare: "1 utente trovato" vs "3 utenti trovati")
    contatoreEl.textContent = `${utenti.length} utent${utenti.length === 1 ? "e" : "i"} trovat${utenti.length === 1 ? "o" : "i"}`;

    // .map() trasforma ogni oggetto utente in una stringa HTML (una card)
    // .join("") unisce tutte le stringhe in un'unica stringa HTML da inserire
    risultatiEl.innerHTML = utenti.map(u => `
        <div class="card">
            <h3>${u.name}</h3>
            <p>📧 ${u.email}</p>
            <p>🏙️ ${u.address.city}</p>
            <p>🏢 ${u.company.name}</p>
            <p>📞 ${u.phone}</p>
        </div>
    `).join("");
}

// ─── PASSO 6: Filtrare gli utenti in base alla ricerca ───────────────────────
// Questa funzione viene chiamata (con debounce) ad ogni tasto premuto.
function filtraUtenti() {
    // .trim() rimuove gli spazi iniziali/finali; .toLowerCase() rende la ricerca
    // case-insensitive (es. "Mario" trova anche "mario")
    const query = searchInput.value.trim().toLowerCase();
    const campo = campoSelect.value; // es. "tutti", "name", "email", ...

    // Se la casella è vuota, mostriamo direttamente tutti gli utenti e usciamo
    if (!query) {
        mostraUtenti(tuttiUtenti);
        return;
    }

    // .filter() crea un nuovo array con solo gli utenti che superano il test
    const filtrati = tuttiUtenti.filter(utente => {
        if (campo === "tutti") {
            // Trucco: JSON.stringify converte l'intero oggetto utente in una stringa.
            // Così possiamo cercare in nome, email, città, azienda... tutto insieme!
            return JSON.stringify(utente).toLowerCase().includes(query);
        }

        // Se l'utente ha scelto un campo specifico dal select, cerchiamo solo lì
        switch (campo) {
            case "name":    return utente.name.toLowerCase().includes(query);
            case "email":   return utente.email.toLowerCase().includes(query);
            case "city":    return utente.address.city.toLowerCase().includes(query);
            case "company": return utente.company.name.toLowerCase().includes(query);
            default:        return false;
        }
    });

    mostraUtenti(filtrati);
}

// ─── PASSO 7: Collegare gli eventi ───────────────────────────────────────────
// Creiamo la versione "ritardata" di filtraUtenti (300ms di debounce)
const filtraConDebounce = debounce(filtraUtenti, 300);

// Evento "input": scatta ad ogni tasto — usiamo il debounce per non spammare
searchInput.addEventListener("input", filtraConDebounce);

// Evento "change": scatta solo quando l'utente sceglie una voce dal select.
// Qui NON serve debounce perché il cambio avviene una volta sola, non lettera per lettera.
campoSelect.addEventListener("change", filtraUtenti);