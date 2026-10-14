fetch("dati.json")
    .then(r => r.json())
    .then(dati => {
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
    });