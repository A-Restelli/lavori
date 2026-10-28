const xhr = new XMLHttpRequest();
xhr.open("GET", "dati.json", true);
xhr.onload = function() {
  if (xhr.status === 200) {
  const dati = JSON.parse(xhr.responseText);
  const tabella = document.getElementById("tabella");
  const intestazione = document.createElement("tr");
  Object.keys(dati[0]).forEach(chiave => {
    const th = document.createElement("th");
    th.textContent = chiave;
    intestazione.appendChild(th);
  });
  tabella.appendChild(intestazione);
  dati.forEach(oggetto => {
    const riga = document.createElement("tr");
    Object.values(oggetto).forEach(valore => {
      const cella = document.createElement("td");
      cella.textContent = valore;
      riga.appendChild(cella);
    });
    tabella.appendChild(riga);
  });
} else {
  document.getElementById("tabella").textContent =
    "Errore nel caricamento dei dati.";
  }
};
xhr.onerror = function() {
  document.getElementById("tabella").textContent =
    "Errore nella richiesta al server.";
};
xhr.send();
