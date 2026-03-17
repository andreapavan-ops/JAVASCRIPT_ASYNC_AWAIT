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

// --- FASE 1: codice sincrono — eseguito subito, nell'ordine ---

console.log("A");                               // [1] sincrono → stampa A

setTimeout(() => console.log("B"), 0);          // [2] → mette B in coda MACROTASK

Promise.resolve().then(() => console.log("C")); // [3] → mette C in coda MICROTASK

console.log("D");                               // [4] sincrono → stampa D

Promise.resolve().then(() => {                  // [5] → mette E (+ F) in coda MICROTASK
    console.log("E");
    setTimeout(() => console.log("F"), 0);      //     quando E esegue, aggiunge F in coda MACROTASK
});

console.log("G");                               // [6] sincrono → stampa G

// --- FASE 2: microtask — svuotati prima dei macrotask ---
// esegue C → stampa C                           [7]
// esegue E → stampa E, aggiunge F a MACROTASK   [8]

// --- FASE 3: macrotask — nell'ordine in cui sono stati aggiunti ---
// esegue B → stampa B  (era in coda prima di F) [9]
// esegue F → stampa F  (aggiunto dopo da E)     [10]

// OUTPUT FINALE: A D G C E B F

/*
Fase 1 — Codice sincrono (eseguito subito, nell'ordine)


console.log("A")          → stampa A
setTimeout(B, 0)          → mette B nella coda MACROTASK
Promise.resolve().then(C) → mette C nella coda MICROTASK
console.log("D")          → stampa D
Promise.resolve().then(E) → mette E nella coda MICROTASK
console.log("G")          → stampa G
Risultato: A, D, G

Fase 2 — Microtask (vengono svuotati PRIMA dei macrotask)


esegue C → stampa C
esegue E → stampa E, e dentro E c'è setTimeout(F, 0)
           → mette F nella coda MACROTASK
Risultato: C, E

Fase 3 — Macrotask (ora ci sono B e F in coda, nell'ordine in cui sono stati aggiunti)


esegue B → stampa B   (era in coda prima di F)
esegue F → stampa F   (aggiunto dopo da dentro E)
Risultato: B, F

Regola chiave: ogni volta che il call stack si svuota, il browser esegue tutti i microtask (Promise .then) prima di passare al prossimo macrotask (setTimeout). 
Per questo C ed E vengono prima di B, e F finisce in fondo perché viene aggiunto alla coda macrotask solo quando E viene eseguito.
*/

