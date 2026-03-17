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

async function primo() {
    console.log("1");           // [3] eseguito subito quando primo() viene chiamata
    await Promise.resolve();    // [4] PAUSA: sospende primo(), mette "2" in coda microtask, restituisce il controllo
    console.log("2");           // [6] riprende dopo che il call stack è vuoto
}

console.log("3");   // [1] sincrono, eseguito per primo
primo();            // [2] chiama primo() — solo ora si entra nella funzione
console.log("4");   // [5] sincrono, eseguito mentre primo() è in pausa

/*

Riga per riga:


console.log("3");   // sincrono → stampa 3 subito

primo();            // chiama la funzione async
Dentro primo():


console.log("1");       // sincrono → stampa 1 subito
await Promise.resolve(); // PAUSA — mette il resto in coda microtask, restituisce il controllo
await è esattamente come .then() — tutto il codice dopo await viene sospeso e messo nella coda microtask. La funzione "esce" e restituisce il controllo al chiamante.


console.log("4");   // sincrono → stampa 4 subito (primo() è in pausa)
Ora il call stack è vuoto → il browser svuota i microtask:


console.log("2");   // microtask → stampa 2 (il resto di primo() riprende)
Regola chiave: await non blocca tutto il programma, blocca solo la funzione async. Il codice fuori dalla funzione continua normalmente, e il resto della funzione riprende dopo, come un .then().

*/