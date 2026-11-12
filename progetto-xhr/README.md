# Mini Dashboard Meteo/Utenti

Piccola web app didattica che usa **AJAX con `XMLHttpRequest`** per consumare due API pubbliche, senza librerie esterne.

## Descrizione

- **Meteo**: si cerca una città per nome; l'app ricava le coordinate (geocoding) e mostra condizioni attuali e previsioni a 5 giorni.
- **Utenti**: elenco scaricato con GET, filtro per nome e aggiunta di un utente con POST (risposta `201 Created`).
- **Console XHR**: registra ogni cambio di `readyState` e l'esito di ogni richiesta, utile per studiare il ciclo di vita di XHR.

## Concetti dell'esercitazione dimostrati

| Concetto | Dove |
|---|---|
| Creazione di un oggetto `XMLHttpRequest` (uno per richiesta) | `richiestaJSON()` in `app.js` |
| Callback `onload`, `onerror`, `ontimeout` e `onreadystatechange` | `richiestaJSON()` |
| `open()` prima di `send()`, richieste asincrone | `richiestaJSON()` |
| `send()` GET con parametri in query string | `costruisciUrl()` + ricerca meteo |
| `send()` POST con corpo JSON e `setRequestHeader()` | form "Aggiungi utente" |
| `responseText` + `JSON.parse()` | `richiestaJSON()` |
| Gestione errori (rete, timeout, HTTP, JSON non valido) | `richiestaJSON()` |
| Rendering sicuro nel DOM (`textContent`, niente `innerHTML`) | funzione `el()` |

## Tecnologie

HTML5, CSS3, JavaScript (ES6), `XMLHttpRequest`.

API usate (gratuite, senza chiave):

- [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) e [Open-Meteo Forecast](https://open-meteo.com/en/docs)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/)

## Come avviare

Aprire `index.html` con doppio clic **non funziona** in modo affidabile: serve un server locale.

```bash
# con Python
python -m http.server 8000

# oppure con Node
npx serve
```

Poi aprire <http://localhost:8000>. In alternativa, usare l'estensione *Live Server* di VS Code.

## Struttura

```text
progetto-xhr/
├── index.html
├── style.css
├── app.js
├── README.md
├── .gitignore
└── esercizi/      # esercizi 1-4 con file di supporto e risposte
```

## Pubblicazione

- **GitHub**: repository pubblico `progetto-xhr`, push su `main`.
- **Vercel**: Add New → Project → importare il repository, Framework Preset *Other*, Build Command e Output Directory vuoti.
