'use strict';

/* =====================================================================
 * Mini Dashboard Meteo/Utenti
 * Tutte le comunicazioni di rete usano XMLHttpRequest (come da dispensa):
 *   1. new XMLHttpRequest()
 *   2. callback (onload / onerror / ontimeout)
 *   3. open(metodo, url, true)
 *   4. send(body)
 * ===================================================================== */

const TIMEOUT_MS = 8000;
const STATI_XHR = ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'];

const URL_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const URL_METEO = 'https://api.open-meteo.com/v1/forecast';
const URL_UTENTI = 'https://jsonplaceholder.typicode.com/users';

/* Codici meteo WMO usati da Open-Meteo → descrizione + icona */
const CODICI_METEO = {
  0: ['Sereno', '☀️'],
  1: ['Prevalentemente sereno', '🌤️'],
  2: ['Parzialmente nuvoloso', '⛅'],
  3: ['Coperto', '☁️'],
  45: ['Nebbia', '🌫️'],
  48: ['Nebbia con brina', '🌫️'],
  51: ['Pioggerella leggera', '🌦️'],
  53: ['Pioggerella', '🌦️'],
  55: ['Pioggerella intensa', '🌦️'],
  56: ['Pioggerella gelata', '🌧️'],
  57: ['Pioggerella gelata intensa', '🌧️'],
  61: ['Pioggia debole', '🌧️'],
  63: ['Pioggia', '🌧️'],
  65: ['Pioggia forte', '🌧️'],
  66: ['Pioggia gelata', '🌧️'],
  67: ['Pioggia gelata forte', '🌧️'],
  71: ['Neve debole', '🌨️'],
  73: ['Neve', '🌨️'],
  75: ['Neve forte', '❄️'],
  77: ['Granelli di neve', '❄️'],
  80: ['Rovesci deboli', '🌦️'],
  81: ['Rovesci', '🌧️'],
  82: ['Rovesci violenti', '⛈️'],
  85: ['Rovesci di neve', '🌨️'],
  86: ['Rovesci di neve forti', '❄️'],
  95: ['Temporale', '⛈️'],
  96: ['Temporale con grandine', '⛈️'],
  99: ['Temporale con grandine forte', '⛈️']
};

/* ---------------------------------------------------------------------
 * Utilità DOM
 * Si usa textContent / createElement (mai innerHTML con dati esterni)
 * per evitare problemi di XSS, come indicato nella dispensa (5.1).
 * ------------------------------------------------------------------- */
function el(tag, classe, testo) {
  const nodo = document.createElement(tag);
  if (classe) nodo.className = classe;
  if (testo !== undefined) nodo.textContent = testo;
  return nodo;
}

function impostaStato(nodo, messaggio, tipo) {
  nodo.textContent = messaggio;
  nodo.className = 'stato' + (tipo ? ' ' + tipo : '');
}

/* ---------------------------------------------------------------------
 * Log delle richieste (console XHR della pagina)
 * ------------------------------------------------------------------- */
function logXHR(messaggio, tipo) {
  const lista = document.getElementById('log');
  const voce = el('li', tipo || '', messaggio);
  lista.appendChild(voce);
  while (lista.children.length > 40) {
    lista.removeChild(lista.firstChild);
  }
  lista.scrollTop = lista.scrollHeight;
}

/* ---------------------------------------------------------------------
 * Costruzione URL con query string
 * encodeURIComponent evita caratteri non validi (spazi, accenti, &, ...)
 * ------------------------------------------------------------------- */
function costruisciUrl(base, parametri) {
  const coppie = Object.keys(parametri).map(function (chiave) {
    return encodeURIComponent(chiave) + '=' + encodeURIComponent(parametri[chiave]);
  });
  return coppie.length ? base + '?' + coppie.join('&') : base;
}

/* ---------------------------------------------------------------------
 * richiestaJSON: funzione riutilizzabile che incapsula XHR (dispensa 3.5)
 *
 * opzioni.metodo : 'GET' (default) oppure 'POST', ...
 * opzioni.url    : indirizzo completo
 * opzioni.corpo  : (opzionale) oggetto JS da inviare come JSON
 *
 * Ogni richiesta usa un NUOVO oggetto XHR (dispensa 2.2).
 * ------------------------------------------------------------------- */
function richiestaJSON(opzioni, onSuccesso, onErrore) {
  const metodo = opzioni.metodo || 'GET';
  const inizio = performance.now();
  const xhr = new XMLHttpRequest();

  // Solo a scopo didattico: traccia i cambi di stato
  xhr.onreadystatechange = function () {
    logXHR(metodo + ' · readyState ' + xhr.readyState + ' (' + STATI_XHR[xhr.readyState] + ')');
  };

  xhr.onload = function () {
    const ms = Math.round(performance.now() - inizio);
    const esito = xhr.status >= 200 && xhr.status < 300;
    logXHR(metodo + ' ' + opzioni.url + ' → ' + xhr.status + ' in ' + ms + ' ms', esito ? 'ok' : 'errore');

    if (!esito) {
      // Il server ha risposto, ma con un errore HTTP (404, 500, ...)
      onErrore('Errore HTTP ' + xhr.status + (xhr.statusText ? ' (' + xhr.statusText + ')' : ''));
      return;
    }

    let dati;
    try {
      dati = JSON.parse(xhr.responseText); // responseText è una stringa → JSON.parse
    } catch (e) {
      onErrore('Risposta non valida: il server non ha inviato JSON.');
      return;
    }
    onSuccesso(dati, xhr.status);
  };

  // Problemi di rete: server irraggiungibile, DNS, CORS...
  xhr.onerror = function () {
    logXHR(metodo + ' ' + opzioni.url + ' → errore di rete', 'errore');
    onErrore('Errore di rete: server irraggiungibile.');
  };

  xhr.ontimeout = function () {
    logXHR(metodo + ' ' + opzioni.url + ' → timeout', 'errore');
    onErrore('Timeout: il server non ha risposto entro ' + TIMEOUT_MS / 1000 + ' secondi.');
  };

  xhr.open(metodo, opzioni.url, true); // 1) open() sempre prima di send()
  xhr.timeout = TIMEOUT_MS;            //    asincrono + timeout

  if (opzioni.corpo !== undefined) {
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8'); // dopo open(), prima di send()
    xhr.send(JSON.stringify(opzioni.corpo));
  } else {
    xhr.send();
  }
}

/* =====================================================================
 * METEO
 * Passo 1: geocoding (nome città → latitudine/longitudine)
 * Passo 2: previsioni per quelle coordinate
 * ===================================================================== */
const formMeteo = document.getElementById('form-meteo');
const inputCitta = document.getElementById('citta');
const btnMeteo = document.getElementById('btn-meteo');
const statoMeteo = document.getElementById('stato-meteo');
const risultatoMeteo = document.getElementById('risultato-meteo');

let contatoreRicercheMeteo = 0; // scarta le risposte di ricerche ormai superate

function descriviCodice(codice) {
  return CODICI_METEO[codice] || ['Condizioni non disponibili', '❔'];
}

function fineRicercaMeteo(id, messaggio, tipo) {
  if (id !== contatoreRicercheMeteo) return;
  btnMeteo.disabled = false;
  impostaStato(statoMeteo, messaggio, tipo);
}

function cercaMeteo(nomeCitta) {
  const id = ++contatoreRicercheMeteo;
  btnMeteo.disabled = true;
  risultatoMeteo.textContent = '';
  impostaStato(statoMeteo, 'Ricerca di "' + nomeCitta + '" in corso…');

  const urlGeo = costruisciUrl(URL_GEOCODING, {
    name: nomeCitta,
    count: 1,
    language: 'it',
    format: 'json'
  });

  richiestaJSON({ url: urlGeo }, function (geo) {
    if (id !== contatoreRicercheMeteo) return;

    // Se non ci sono risultati l'API omette del tutto la chiave "results"
    if (!geo.results || geo.results.length === 0) {
      fineRicercaMeteo(id, 'Città non trovata. Controlla il nome e riprova.', 'errore');
      return;
    }

    const luogo = geo.results[0];
    impostaStato(statoMeteo, 'Scarico le previsioni per ' + luogo.name + '…');

    const urlMeteo = costruisciUrl(URL_METEO, {
      latitude: luogo.latitude,
      longitude: luogo.longitude,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: 5
    });

    richiestaJSON({ url: urlMeteo }, function (meteo) {
      if (id !== contatoreRicercheMeteo) return;
      mostraMeteo(luogo, meteo);
      fineRicercaMeteo(id, 'Dati aggiornati alle ' + meteo.current.time.slice(11) + ' (ora locale della città).', 'ok');
    }, function (errore) {
      fineRicercaMeteo(id, 'Previsioni non disponibili: ' + errore, 'errore');
    });
  }, function (errore) {
    fineRicercaMeteo(id, 'Ricerca fallita: ' + errore, 'errore');
  });
}

function mostraMeteo(luogo, meteo) {
  const att = meteo.current;
  const unita = meteo.current_units;
  const [descrizione, icona] = descriviCodice(att.weather_code);

  risultatoMeteo.textContent = '';

  // Condizioni attuali
  const attuale = el('div', 'meteo-attuale');
  attuale.appendChild(el('div', 'meteo-icona', icona));

  const blocco = el('div');
  blocco.appendChild(el('div', 'meteo-temp', Math.round(att.temperature_2m) + unita.temperature_2m));
  const nomeLuogo = [luogo.name, luogo.admin1, luogo.country].filter(Boolean).join(', ');
  blocco.appendChild(el('div', 'meteo-luogo', nomeLuogo));
  blocco.appendChild(el('div', 'meteo-dettagli',
    descrizione +
    ' · percepita ' + Math.round(att.apparent_temperature) + unita.apparent_temperature +
    ' · umidità ' + att.relative_humidity_2m + unita.relative_humidity_2m +
    ' · vento ' + Math.round(att.wind_speed_10m) + ' ' + unita.wind_speed_10m));
  attuale.appendChild(blocco);
  risultatoMeteo.appendChild(attuale);

  // Previsioni dei prossimi giorni
  const giorni = el('div', 'previsioni');
  const d = meteo.daily;
  for (let i = 0; i < d.time.length; i++) {
    const [descGiorno, iconaGiorno] = descriviCodice(d.weather_code[i]);
    const data = new Date(d.time[i] + 'T00:00:00');
    const scheda = el('div', 'giorno');
    scheda.title = descGiorno;
    scheda.appendChild(el('div', 'data', data.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })));
    scheda.appendChild(el('div', 'icona', iconaGiorno));
    scheda.appendChild(el('div', 'minmax',
      Math.round(d.temperature_2m_min[i]) + '° / ' + Math.round(d.temperature_2m_max[i]) + '°'));
    scheda.appendChild(el('div', 'minmax', '💧 ' + (d.precipitation_probability_max[i] ?? '–') + '%'));
    giorni.appendChild(scheda);
  }
  risultatoMeteo.appendChild(giorni);
}

formMeteo.addEventListener('submit', function (evento) {
  evento.preventDefault();
  const nome = inputCitta.value.trim();
  if (nome.length < 2) {
    impostaStato(statoMeteo, 'Scrivi almeno 2 caratteri.', 'errore');
    return;
  }
  cercaMeteo(nome);
});

/* =====================================================================
 * UTENTI
 * GET dell'elenco, filtro per nome in pagina, POST di un nuovo utente
 * ===================================================================== */
const inputFiltro = document.getElementById('filtro');
const btnRicarica = document.getElementById('btn-ricarica');
const statoUtenti = document.getElementById('stato-utenti');
const listaUtenti = document.getElementById('lista-utenti');
const formUtente = document.getElementById('form-utente');
const btnAggiungi = document.getElementById('btn-aggiungi');
const statoPost = document.getElementById('stato-post');

let utenti = []; // elenco in memoria: utenti dal server + quelli aggiunti con POST

function disegnaUtenti() {
  const filtro = inputFiltro.value.trim().toLowerCase();
  const visibili = utenti.filter(function (u) {
    return u.name.toLowerCase().includes(filtro);
  });

  listaUtenti.textContent = '';
  visibili.forEach(function (u) {
    const voce = el('li', u.nuovo ? 'nuovo' : '');
    voce.appendChild(el('span', 'nome', u.name));
    const dettaglio = [u.email, u.company && u.company.name, u.address && u.address.city]
      .filter(Boolean).join(' · ');
    voce.appendChild(el('span', 'dettaglio', dettaglio));
    listaUtenti.appendChild(voce);
  });

  if (utenti.length > 0) {
    impostaStato(statoUtenti, visibili.length + ' di ' + utenti.length + ' utenti' +
      (filtro ? ' per "' + inputFiltro.value.trim() + '"' : '') + '.');
  }
}

function caricaUtenti() {
  btnRicarica.disabled = true;
  impostaStato(statoUtenti, 'Caricamento utenti…');

  richiestaJSON({ url: URL_UTENTI }, function (dati) {
    btnRicarica.disabled = false;
    if (!Array.isArray(dati)) {
      impostaStato(statoUtenti, 'Formato dati inatteso.', 'errore');
      return;
    }
    utenti = dati;
    disegnaUtenti();
  }, function (errore) {
    btnRicarica.disabled = false;
    impostaStato(statoUtenti, 'Impossibile caricare gli utenti: ' + errore, 'errore');
  });
}

inputFiltro.addEventListener('input', disegnaUtenti);
btnRicarica.addEventListener('click', caricaUtenti);

formUtente.addEventListener('submit', function (evento) {
  evento.preventDefault();
  const nuovo = {
    name: document.getElementById('nuovo-nome').value.trim(),
    email: document.getElementById('nuova-email').value.trim()
  };

  btnAggiungi.disabled = true;
  impostaStato(statoPost, 'Invio in corso…');

  richiestaJSON({ metodo: 'POST', url: URL_UTENTI, corpo: nuovo }, function (risposta, status) {
    btnAggiungi.disabled = false;
    if (status !== 201) {
      impostaStato(statoPost, 'Risposta inattesa dal server (status ' + status + ').', 'errore');
      return;
    }
    // JSONPlaceholder simula la creazione: restituisce l'oggetto con un id, ma non lo salva davvero
    utenti.unshift({ id: risposta.id, name: risposta.name, email: risposta.email, nuovo: true });
    disegnaUtenti();
    formUtente.reset();
    impostaStato(statoPost, 'Utente creato (status 201, id ' + risposta.id + '). Il server di prova non lo conserva: sparirà alla ricarica.', 'ok');
  }, function (errore) {
    btnAggiungi.disabled = false;
    impostaStato(statoPost, 'Invio fallito: ' + errore, 'errore');
  });
});

/* ---------------------------------------------------------------------
 * Avvio: meteo di una città di default e caricamento utenti
 * ------------------------------------------------------------------- */
inputCitta.value = 'Milano';
cercaMeteo('Milano');
caricaUtenti();
