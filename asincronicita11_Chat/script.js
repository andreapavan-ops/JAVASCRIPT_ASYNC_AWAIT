/*
## Esercizio 11 — Chat simulata (⭐⭐⭐⭐ sfida)

Crea una chat simulata dove l'utente invia messaggi e riceve risposte automatiche dopo un ritardo casuale.

**Funzionalità:**

1. Input per scrivere un messaggio + bottone Invia (o Enter)
2. I messaggi dell'utente appaiono a destra (stile WhatsApp), le risposte a sinistra
3. Dopo ogni messaggio, appare un indicatore "sta scrivendo..." per 1-3 secondi (casuale)
4. La risposta è generata prendendo un commento casuale da JSONPlaceholder: `https://jsonplaceholder.typicode.com/comments/{id}` (id casuale 1-500)
5. Ogni messaggio mostra l'orario
6. La chat scrolla automaticamente verso il basso ad ogni nuovo messaggio
7. I messaggi vengono **salvati in localStorage** e ripristinati al refresh
8. Bottone "Cancella chat" per svuotare tutto

**Bonus:**

- Se l'utente scrive "ciao" o "hello", la risposta è immediata con un saluto
- Se l'utente scrive mentre il bot "sta scrivendo", la risposta del bot viene accodata

**Suggerimenti:**

- Per l'indicatore "sta scrivendo": crea un `<div>` con animazione CSS (tre pallini che pulsano), mostralo dopo l'invio e nascondilo quando arriva la risposta
- Per il ritardo casuale: `await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000))`
- Per lo scroll automatico: `chatContainer.scrollTop = chatContainer.scrollHeight`
- Struttura messaggi in localStorage: `[{ testo, tipo: "utente"|"bot", orario }]`
- Per il commento casuale: `const id = Math.floor(Math.random() * 500) + 1;` poi `fetch(\`...comments/${id}`)`
- Usa il campo `body` del commento come testo della risposta/*

*/

// ─────────────────────────────────────────────────────────────
// PASSO 1 — Selezioniamo gli elementi HTML della pagina
// ─────────────────────────────────────────────────────────────
// Ogni variabile punta a un elemento del DOM che useremo nel codice.
// "chat"       → il contenitore dove appaiono i messaggi
// "inputMsg"   → il campo di testo dove l'utente scrive
// "btnInvia"   → il bottone "Invia"
// "btnCancella"→ il bottone "Cancella chat"
const chat = document.getElementById("chat");
const inputMsg = document.getElementById("inputMsg");
const btnInvia = document.getElementById("btnInvia");
const btnCancella = document.getElementById("btnCancella");

// ─────────────────────────────────────────────────────────────
// PASSO 2 — Variabili di stato globali
// ─────────────────────────────────────────────────────────────
// "messaggi"       → array che contiene TUTTI i messaggi della chat
//                    (sia dell'utente che del bot). Viene sincronizzato
//                    con localStorage per sopravvivere al refresh.
//
// "botStaScrivendo"→ flag booleano: true mentre il bot è "occupato"
//                    a generare una risposta. Serve per sapere se
//                    accodare o no i nuovi messaggi dell'utente.
//
// "codaMessaggi"   → array-coda: se l'utente invia più messaggi mentre
//                    il bot sta ancora rispondendo, vengono messi qui
//                    e processati uno alla volta quando il bot è libero.
let messaggi = [];
let botStaScrivendo = false;
let codaMessaggi = [];

// ─────────────────────────────────────────────────────────────
// PASSO 3 — Carica i messaggi salvati (localStorage → DOM)
// ─────────────────────────────────────────────────────────────
// localStorage è una memoria permanente del browser (sopravvive al refresh).
// Qui leggiamo i messaggi salvati dalla sessione precedente e li
// ridisegniamo nel DOM, così la chat non si azzera al ricaricamento.
function caricaDaStorage() {
    const salvati = localStorage.getItem("chat_messaggi"); // stringa JSON o null
    if (salvati) {
        messaggi = JSON.parse(salvati);              // stringa → array di oggetti
        messaggi.forEach(m => renderizzaMessaggio(m, false)); // disegna senza scrollare
        scrollInBasso();                             // un solo scroll finale
    }
}

// ─────────────────────────────────────────────────────────────
// PASSO 4 — Salva i messaggi (array → localStorage)
// ─────────────────────────────────────────────────────────────
// Ogni volta che arriva un nuovo messaggio (utente o bot) aggiorniamo
// localStorage, così il dato è sempre sincronizzato.
// JSON.stringify converte l'array in una stringa (localStorage accetta solo stringhe).
function salvaInStorage() {
    localStorage.setItem("chat_messaggi", JSON.stringify(messaggi));
}

// ─────────────────────────────────────────────────────────────
// PASSO 5 — Disegna un singolo messaggio nel DOM
// ─────────────────────────────────────────────────────────────
// "msg" è un oggetto del tipo: { testo, tipo: "utente"|"bot", orario }
// "scroll" indica se dopo l'inserimento dobbiamo scorrere in basso
//   (false quando carichiamo la storia all'avvio, per efficienza).
//
// La classe CSS "utente" o "bot" determina l'allineamento (destra/sinistra)
// tramite il foglio di stile.
function renderizzaMessaggio(msg, scroll = true) {
    const div = document.createElement("div");
    div.className = `messaggio ${msg.tipo}`; // es: "messaggio utente" o "messaggio bot"
    div.innerHTML = `
        <div>${msg.testo}</div>
        <div class="orario">${msg.orario}</div>
    `;
    chat.appendChild(div);
    if (scroll) scrollInBasso();
}

// ─────────────────────────────────────────────────────────────
// PASSO 6 — Scroll automatico in fondo alla chat
// ─────────────────────────────────────────────────────────────
// scrollHeight = altezza totale del contenuto (anche quello non visibile)
// Impostando scrollTop = scrollHeight, portiamo la visuale all'ultimo messaggio.
function scrollInBasso() {
    chat.scrollTop = chat.scrollHeight;
}

// ─────────────────────────────────────────────────────────────
// PASSO 7 — Orario corrente formattato (es: "14:32")
// ─────────────────────────────────────────────────────────────
// toLocaleTimeString con "it-IT" e solo ore+minuti restituisce "HH:MM".
function orarioCorrente() {
    return new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────
// PASSO 8 — Indicatore "sta scrivendo..." (tre pallini animati)
// ─────────────────────────────────────────────────────────────
// mostraTyping → aggiunge un div con id "typing-indicator" in fondo alla chat.
//   I tre <span> vuoti vengono animati via CSS (keyframes che li fanno pulsare).
//
// nascondiTyping → rimuove il div se esiste.
//   Si usa quando arriva la risposta del bot.
function mostraTyping() {
    const div = document.createElement("div");
    div.className = "typing";
    div.id = "typing-indicator";
    div.innerHTML = `<div class="pallini"><span></span><span></span><span></span></div>`;
    chat.appendChild(div);
    scrollInBasso();
}

function nascondiTyping() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
}

// ─────────────────────────────────────────────────────────────
// PASSO 9 — Genera la risposta del bot (funzione async)
// ─────────────────────────────────────────────────────────────
// Questa è la funzione principale e usa async/await perché deve:
//   1. Aspettare il ritardo (setTimeout)
//   2. Aspettare la risposta della rete (fetch)
// Entrambe sono operazioni asincrone.
async function generaRisposta(testoUtente) {

    // Segnaliamo che il bot è "occupato"
    botStaScrivendo = true;
    mostraTyping();

    // ── Caso A: l'utente ha scritto un saluto ──────────────────
    // Array.some() torna true se almeno un elemento soddisfa la condizione.
    // toLowerCase() rende il confronto case-insensitive ("Ciao" = "ciao").
    const saluti = ["ciao", "hello", "salve", "hey", "buongiorno", "buonasera"];
    const eSaluto = saluti.some(s => testoUtente.toLowerCase().includes(s));

    if (eSaluto) {
        // Piccolo ritardo di soli 0,5 secondi (risposta "immediata")
        await new Promise(r => setTimeout(r, 500));
        nascondiTyping();

        // Scegliamo una risposta a caso dall'array di saluti predefiniti
        const risposte = ["Ciao! Come posso aiutarti? 😊", "Hey! Tutto bene?", "Salve! Di cosa vuoi parlare?"];
        const risposta = risposte[Math.floor(Math.random() * risposte.length)];

        // Creiamo l'oggetto messaggio e lo aggiungiamo all'array + DOM + storage
        const msgBot = { testo: risposta, tipo: "bot", orario: orarioCorrente() };
        messaggi.push(msgBot);
        renderizzaMessaggio(msgBot);
        salvaInStorage();

    } else {
        // ── Caso B: messaggio generico → fetch da API esterna ────
        // Ritardo casuale tra 1000 ms (1s) e 3000 ms (3s)
        // Math.random() → numero tra 0 e 1
        // * 2000 + 1000 → numero tra 1000 e 3000
        const ritardo = Math.random() * 2000 + 1000;
        await new Promise(r => setTimeout(r, ritardo));
        nascondiTyping();

        try {
            // Scegliamo un id casuale tra 1 e 500
            const id = Math.floor(Math.random() * 500) + 1;

            // fetch() è asincrona: await aspetta che la risposta HTTP arrivi
            const risposta = await fetch(`https://jsonplaceholder.typicode.com/comments/${id}`);

            // .json() è anch'essa asincrona: converte il body della risposta in oggetto JS
            const commento = await risposta.json();

            // Usiamo il campo "body" del commento come testo della risposta
            const msgBot = { testo: commento.body, tipo: "bot", orario: orarioCorrente() };
            messaggi.push(msgBot);
            renderizzaMessaggio(msgBot);
            salvaInStorage();

        } catch (err) {
            // Se fetch lancia un errore (es. offline), mostriamo un messaggio di errore
            const msgBot = { testo: "Scusa, ho avuto un problema di connessione. 😅", tipo: "bot", orario: orarioCorrente() };
            messaggi.push(msgBot);
            renderizzaMessaggio(msgBot);
            salvaInStorage();
        }
    }

    // Il bot ha finito → lo segniamo come "libero"
    botStaScrivendo = false;

    // ── PASSO 9b: gestione della coda ────────────────────────────
    // Se l'utente ha inviato messaggi mentre il bot scriveva,
    // codaMessaggi contiene quei testi in attesa.
    // shift() estrae il primo elemento (FIFO: first-in, first-out).
    // Chiamiamo generaRisposta in modo ricorsivo: si ripete finché la coda è vuota.
    if (codaMessaggi.length > 0) {
        const prossimo = codaMessaggi.shift();
        await generaRisposta(prossimo);
    }
}

// ─────────────────────────────────────────────────────────────
// PASSO 10 — Invia il messaggio dell'utente
// ─────────────────────────────────────────────────────────────
// Questa funzione viene chiamata quando l'utente clicca "Invia" o preme Enter.
async function inviaMessaggio() {
    const testo = inputMsg.value.trim(); // trim() rimuove spazi iniziali/finali
    if (!testo) return;                  // se il campo è vuoto, non fa nulla

    // Crea l'oggetto messaggio utente e aggiornalo ovunque
    const msgUtente = { testo, tipo: "utente", orario: orarioCorrente() };
    messaggi.push(msgUtente);
    renderizzaMessaggio(msgUtente);
    salvaInStorage();

    // Pulisce il campo e riporta il focus sull'input
    inputMsg.value = "";
    inputMsg.focus();

    // Se il bot sta già rispondendo a un messaggio precedente,
    // mettiamo questo testo in coda invece di avviare un'altra risposta in parallelo.
    if (botStaScrivendo) {
        codaMessaggi.push(testo);
        return; // usciamo: generaRisposta attiverà la coda da sola al termine
    }

    // Bot libero → avvia subito la generazione della risposta
    await generaRisposta(testo);
}

// ─────────────────────────────────────────────────────────────
// PASSO 11 — Collegamento degli eventi (Event Listeners)
// ─────────────────────────────────────────────────────────────

// Click sul bottone "Invia"
btnInvia.addEventListener("click", inviaMessaggio);

// Pressione del tasto Enter nel campo di testo
inputMsg.addEventListener("keydown", (e) => {
    if (e.key === "Enter") inviaMessaggio();
});

// Click su "Cancella chat"
btnCancella.addEventListener("click", () => {
    if (confirm("Cancellare tutta la chat?")) {
        // Azzera lo stato in memoria
        messaggi = [];
        codaMessaggi = [];
        // Svuota il DOM
        chat.innerHTML = "";
        // Rimuove il dato da localStorage
        localStorage.removeItem("chat_messaggi");
    }
});

// ─────────────────────────────────────────────────────────────
// PASSO 12 — Avvio dell'applicazione
// ─────────────────────────────────────────────────────────────
// Quando la pagina si carica:
//   1. Ripristina la chat salvata (se esiste)
//   2. Porta il cursore nell'input così l'utente può scrivere subito
caricaDaStorage();
inputMsg.focus();
