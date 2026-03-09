/* 

## Esercizio 1 — Predici l'output (⭐ facile)

Senza eseguire il codice, scrivi su carta l'ordine esatto in cui verranno stampati i messaggi. Poi verifica nella console.

**Codice A:**

```jsx
console.log("1");
setTimeout(() => console.log("2"), 1000);
console.log("3");
setTimeout(() => console.log("4"), 0);
console.log("5");
```

**Codice B:**

```jsx
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");

Promise.resolve().then(() => {
    console.log("E");
    setTimeout(() => console.log("F"), 0);
});

console.log("G");
```

**Codice C:**

```jsx
async function primo() {
    console.log("1");
    await Promise.resolve();
    console.log("2");
}

console.log("3");
primo();
console.log("4");
```

**Suggerimenti:**

- Il codice sincrono viene eseguito sempre per primo
- I `setTimeout` (macrotask) vanno nella coda dei macrotask
- Le Promise `.then()` (microtask) hanno priorità sui macrotask
- `await` in una funzione async è come un `.then()`: il codice dopo l'await viene messo nella coda microtask
- Codice A: ricorda che `setTimeout(..., 0)` non è immediato, va in coda
- Codice B: la sequenza sincrona è A, D, G. Poi i microtask (C, E). Poi i macrotask (B, F)
- Codice C: `primo()` stampa "1", poi l'`await` mette in pausa la funzione — "4" viene stampato prima di "2"

*/


/*DESCRIZIONE
"Dopo 1000ms, esegui la funzione che stampa 2"
Il () => è solo il modo JavaScript per dire "una funzione anonima che fa..." — la freccia => significa semplicemente "che fa" o "che ritorna".
*/

console.log("1");
setTimeout(() => console.log("2"), 1000);
console.log("3");
setTimeout(() => console.log("4"), 0);
console.log("5");


/*
...quindi il concetto in poche parole è stampa prima in ordine a cascata gli sincroni e poi gkìlia asincroni 0 millesecondi di ritardo è ilo primo e 1000 millesecondi di ritardo è l'ultimo stampato... è giusto il mio ragionamento?
Sì, il ragionamento è giusto! Puoi vederlo come due "code" separate:


1. Prima svuota tutto il codice sincrono (nell'ordine in cui appare)
2. Poi esegui gli asincroni, ordinati per tempo di scadenza
Regola pratica
Tipo	Quando viene eseguito
Sincrono	Subito, nell'ordine in cui appare
setTimeout(..., 0)	Dopo tutto il sincrono
setTimeout(..., 500)	Dopo 500ms dal momento della registrazione
setTimeout(..., 1000)	Dopo 1000ms dal momento della registrazione
Un'unica precisazione
Il delay di setTimeout non è "ritardo rispetto al precedente", ma ritardo dall'inizio del programma:


setTimeout(() => console.log("A"), 1000);  // scade a t=1000ms
setTimeout(() => console.log("B"), 1000);  // scade a t=1000ms → stesso momento!
setTimeout(() => console.log("C"), 500);   // scade a t=500ms → stampa PRIMA di A e B
Risultato: C → A → B (A e B stesso delay, vince chi è registrato prima)

Quindi il tuo ragionamento è corretto come regola generale.

*/