# Risposte alle domande dell'esercitazione

## Esercizio 1

**Cosa significa `readyState === 4`?**
Significa che la richiesta è nello stato `DONE`: l'operazione è terminata e la risposta è stata ricevuta per intero. Non dice però se è andata bene: anche un errore 404 o 500 arriva con `readyState` 4.

**Perché serve `status === 200`?**
`status` è il codice HTTP della risposta. Con `200 OK` il server conferma di aver trovato e inviato la risorsa. Senza questo controllo, una pagina di errore (404, 500) verrebbe trattata come se fosse il dato richiesto. Sono due condizioni diverse: `readyState` dice *se* la richiesta è finita, `status` dice *come* è finita.

**Cosa succede se metto `false` come terzo parametro di `open()`?**
La richiesta diventa sincrona: `send()` blocca l'esecuzione e l'intera pagina resta congelata finché non arriva la risposta. È una pratica deprecata. Inoltre, nei browser, su una richiesta sincrona fatta dalla pagina non si possono impostare `timeout` e `responseType`: il tentativo genera un'eccezione.

## Esercizio 4 — approfondimento

**Perché `send()` deve stare dopo `open()`?**
`open()` configura la richiesta (metodo, URL, modalità) e porta l'oggetto in stato `OPENED`. `send()` può trasmettere solo una richiesta già configurata: chiamato su un oggetto `UNSENT` lancia un'eccezione (`InvalidStateError`). Lo stesso vale per `setRequestHeader()`, che funziona solo dopo `open()` e prima di `send()`.

## Autoverifica (dispensa, 5.7)

1. **Perché `responseXML` può essere `null` anche con un XML valido?** Perché il server può inviare un `Content-Type` non XML (ad esempio `text/plain`): il browser non esegue il parsing. Soluzione: `responseText` + `DOMParser`.
2. **Cosa restituisce `responseText` con una risposta JSON?** Una stringa con il testo JSON. Per ottenere un oggetto serve `JSON.parse()`, oppure `responseType = 'json'` e lettura da `xhr.response`.
3. **Differenza tra `readyState === 4` e `status === 200`?** Vedi esercizio 1: il primo indica che la richiesta è terminata, il secondo che il server ha risposto con successo.
4. **Cosa succede se chiamo `send()` prima di `open()`?** Viene lanciata un'eccezione, perché la richiesta non è ancora stata configurata.
5. **Come si invia un POST con body JSON?** `open('POST', url, true)`, poi `setRequestHeader('Content-Type', 'application/json;charset=UTF-8')`, poi `send(JSON.stringify(oggetto))`.
