/*

## Esercizio 5 — Caricatore di profili utente (⭐⭐ medio)
Crea una pagina con 10 bottoni (uno per ogni utente di JSONPlaceholder). Cliccando un bottone:

1. Il bottone mostra "Caricamento..." e si disabilita
2. Si caricano **in parallelo** le informazioni dell'utente e i suoi todo
3. Si mostra una card con:
    - Nome, email, città
    - Numero totale di todo
    - Numero di todo completati / non completati
    - Una barra di progresso dei todo completati
4. In caso di errore, si mostra un messaggio rosso

**API:**

- Utente: `https://jsonplaceholder.typicode.com/users/{id}`
- Todo: `https://jsonplaceholder.typicode.com/todos?userId={id}`

**Suggerimenti:**

- Per caricare in parallelo: `const [utente, todos] = await Promise.all([fetch(...), fetch(...)]);`
- Ricordati di fare `.json()` su entrambe le risposte
- Per la barra di progresso: `const completati = todos.filter(t => t.completed).length; const percentuale = (completati / todos.length * 100).toFixed(0);`
- Usa `try/catch/finally`: nel finally, ripristina il bottone

*/

// Prendiamo i riferimenti agli elementi HTML dove andremo a inserire contenuto.
// getElementById cerca nel documento l'elemento con quell'id e ce lo restituisce.
const bottoniContainer = document.getElementById("bottoni");
const risultato = document.getElementById("risultato");

// --- CREAZIONE DINAMICA DEI BOTTONI ---
// Invece di scrivere 10 bottoni a mano nell'HTML, li generiamo con un ciclo.
// i va da 1 a 10 perché gli utenti di JSONPlaceholder hanno id da 1 a 10.
for (let i = 1; i <= 10; i++) {
    const btn = document.createElement("button"); // crea un <button> nel DOM
    btn.textContent = `Utente ${i}`;              // scrive il testo sul bottone

    // Quando il bottone viene cliccato, chiamiamo caricaProfilo passando:
    //   - i: l'id dell'utente (fissiamo il valore con la closure)
    //   - btn: il riferimento al bottone, così possiamo modificarlo dentro la funzione
    btn.addEventListener("click", () => caricaProfilo(i, btn));

    bottoniContainer.appendChild(btn); // aggiunge il bottone alla pagina
}

// --- FUNZIONE PRINCIPALE ---
// async ci permette di usare await dentro. Riceve l'id dell'utente e il bottone cliccato.
async function caricaProfilo(id, bottone) {

    // --- FASE 1: FEEDBACK VISIVO IMMEDIATO ---
    // Salviamo il testo originale del bottone ("Utente 3") per ripristinarlo dopo.
    const testoOriginale = bottone.textContent;
    bottone.textContent = "Caricamento..."; // l'utente capisce che qualcosa sta succedendo
    bottone.disabled = true;                // evitiamo doppi click mentre aspettiamo
    risultato.innerHTML = "<p>⏳ Caricamento in corso...</p>";

    try {
        // --- FASE 2: FETCH IN PARALLELO ---
        // Promise.all prende un array di Promise e le esegue TUTTE INSIEME.
        // Se le facessimo in sequenza (prima utente, poi todos) aspetteremmo due volte.
        // In parallelo aspettiamo solo il più lento dei due — molto più efficiente!
        //
        // La destrutturazione [rispostaUtente, rispostaTodos] ci dà i risultati
        // nello stesso ordine in cui abbiamo passato le Promise.
        const [rispostaUtente, rispostaTodos] = await Promise.all([
            fetch(`https://jsonplaceholder.typicode.com/users/${id}`),
            fetch(`https://jsonplaceholder.typicode.com/todos?userId=${id}`)
        ]);

        // --- FASE 3: CONTROLLO ERRORI HTTP ---
        // fetch() NON lancia un errore se il server risponde con 404 o 500!
        // Dobbiamo controllare manualmente la proprietà .ok (true se status è 200-299).
        // Lanciamo noi l'errore per farlo finire nel catch sotto.
        if (!rispostaUtente.ok) throw new Error(`Errore utente: HTTP ${rispostaUtente.status}`);
        if (!rispostaTodos.ok) throw new Error(`Errore todos: HTTP ${rispostaTodos.status}`);

        // --- FASE 4: CONVERSIONE IN JSON ---
        // Le risposte HTTP arrivano come testo grezzo. .json() le converte in oggetti JS.
        // Anche .json() è asincrono (deve leggere lo stream), quindi serve await.
        const utente = await rispostaUtente.json(); // oggetto con name, email, address, ...
        const todos = await rispostaTodos.json();    // array di oggetti {id, title, completed, ...}

        // --- FASE 5: CALCOLO STATISTICHE ---
        // todos è un array, quindi possiamo usare i metodi degli array su di esso.

        const totale = todos.length; // quanti todo ha in totale questo utente

        // .filter() restituisce un nuovo array con solo gli elementi che soddisfano la condizione.
        // Qui teniamo solo i todo dove completed è true, poi prendiamo quanti sono con .length.
        const completati = todos.filter(t => t.completed).length;

        const nonCompletati = totale - completati; // i rimanenti sono quelli ancora da fare

        // Calcolo della percentuale per la barra di progresso.
        // Dividiamo per totale solo se totale > 0 (evitiamo divisione per zero).
        // * 100 converte in percentuale (es. 0.6 → 60).
        // .toFixed(0) arrotonda a 0 decimali e restituisce una stringa ("60").
        const percentuale = totale > 0 ? ((completati / totale) * 100).toFixed(0) : 0;

        // --- FASE 6: RENDERIZZAZIONE DELLA CARD ---
        // Usiamo i template literal (backtick) per costruire l'HTML in modo leggibile.
        // Con ${} inseriamo le variabili direttamente dentro la stringa HTML.
        // Accediamo alle proprietà annidate dell'oggetto utente: utente.address.city
        risultato.innerHTML = `
            <div class="card">
                <h2>${utente.name}</h2>
                <p><span class="label">📧 Email:</span> ${utente.email}</p>
                <p><span class="label">🏙️ Città:</span> ${utente.address.city}</p>
                <p><span class="label">🏢 Azienda:</span> ${utente.company.name}</p>
                <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
                <p><span class="label">📋 Todo totali:</span> ${totale}</p>
                <p><span class="label">✅ Completati:</span> ${completati}</p>
                <p><span class="label">❌ Non completati:</span> ${nonCompletati}</p>
                <div class="barra-container">
                    <!-- La larghezza della barra è impostata inline come percentuale -->
                    <div class="barra-progresso" style="width: ${percentuale}%">
                        ${percentuale}%
                    </div>
                </div>
            </div>
        `;

    } catch (errore) {
        // --- GESTIONE ERRORI ---
        // Se qualcosa va storto (rete assente, server in errore, id non valido...),
        // l'esecuzione salta qui. errore.message contiene la descrizione del problema.
        risultato.innerHTML = `
            <div class="errore">
                <strong>❌ Errore:</strong> ${errore.message}
            </div>
        `;

    } finally {
        // --- FINALLY: CODICE CHE GIRA SEMPRE ---
        // finally viene eseguito sia se il try va a buon fine, sia se finisce nel catch.
        // È il posto giusto per il "cleanup": ripristinare lo stato del bottone
        // indipendentemente da come è andata la richiesta.
        bottone.textContent = testoOriginale;
        bottone.disabled = false;
    }
}


