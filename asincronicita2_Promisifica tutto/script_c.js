/* 

## Eserzio 2 — Promisifica tutto (⭐ facile)
Riscrivi queste funzioni basate su callback come funzioni che restituiscono **Promise**, poi usale con async/await.

**Funzione A: ritardo**
```jsx
// Callback version
function aspetta(ms, callback) {
    setTimeout(callback, ms);
}
aspetta(2000, () => console.log("Fatto!"));

// → Riscrivi come Promise, poi usa con await:
// await aspetta(2000);
// console.log("Fatto!");
```

**Funzione B: numero casuale con possibile errore**

```jsx
// Callback version (error-first)
function generaCasuale(min, max, callback) {
    setTimeout(() => {
        if (min >= max) {
            callback(new Error("min deve essere minore di max"), null);
        } else {
            const numero = Math.floor(Math.random() * (max - min + 1)) + min;
            callback(null, numero);
        }
    }, 500);
}
generaCasuale(1, 10, (err, num) => {
    if (err) console.error(err);
    else console.log("Numero:", num);
});
```

**Funzione C: carica dati simulati**

```jsx
// Callback version
function caricaDatabase(tabella, callback) {
    const db = {
        utenti: [{ id: 1, nome: "Mario" }, { id: 2, nome: "Luigi" }],
        prodotti: [{ id: 1, nome: "Laptop" }, { id: 2, nome: "Mouse" }]
    };

    setTimeout(() => {
        if (db[tabella]) {
            callback(null, db[tabella]);
        } else {
            callback(new Error(`Tabella "${tabella}" non trovata`), null);
        }
    }, 800);
}
```

**Suggerimenti:**

- Funzione A: `return new Promise(resolve => setTimeout(resolve, ms));`
- Funzione B e C: `return new Promise((resolve, reject) => { ... })` — chiama `resolve(valore)` al successo e `reject(new Error(...))` al fallimento
- Per testarle con async/await: scrivi una funzione `async function test()` e usa `try/catch`

*/


// Callback version

function caricaDatabase(tabella, callback) {
    const db = {
        utenti: [{ id: 1, nome: "Mario" }, { id: 2, nome: "Luigi" }],
        prodotti: [{ id: 1, nome: "Laptop" }, { id: 2, nome: "Mouse" }]
    };

    setTimeout(() => {
        if (db[tabella]) {
            callback(null, db[tabella]);
        } else {
            callback(new Error(`Tabella "${tabella}" non trovata`), null);
        }
    }, 800);
}