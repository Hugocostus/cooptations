let etudiants = [];

async function chargerEtudiants() {
    try {
        let response = await fetch("https://sheetdb.io/api/v1/8kmmsjdje3dk6"); // Mets ton URL API ici
        etudiants = await response.json();
        console.log("Données chargées :", etudiants);
    } catch (error) {
        console.error("Erreur de chargement des données :", error);
    }
}

async function exporterTableau() {
    // Charger SheetJS (s'il n'est pas déjà ajouté dans le projet)
    if (typeof XLSX === "undefined") {
        let script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.3/xlsx.full.min.js";
        script.onload = genererExcel;
        document.body.appendChild(script);
    } else {
        genererExcel();
    }
}

function genererExcel() {
    let wb = XLSX.utils.book_new();
    let groupeChoisi = document.getElementById("groupeChoisi").value || "Non spécifié";
    
    // Nombre d'étudiants dans chaque liste (comptage des lignes non vides)
    let nbPrincipal = compterLignesNonVides("tableau_principal");
    let nbSecondaire = compterLignesNonVides("tableau_secondaire");

    // Ajout d'une feuille avec les informations
    let ws_info = XLSX.utils.aoa_to_sheet([
        ["Association :", groupeChoisi],
        ["Nombre en liste principale :", nbPrincipal],
        ["Nombre en liste secondaire :", nbSecondaire]
    ]);
    XLSX.utils.book_append_sheet(wb, ws_info, "Informations");

    // Export des tableaux sous forme de deux lignes
    let ws_principal = creerFeuilleExcelDeuxLignes("tableau_principal");
    XLSX.utils.book_append_sheet(wb, ws_principal, "Liste Principale");

    let ws_secondaire = creerFeuilleExcelDeuxLignes("tableau_secondaire");
    XLSX.utils.book_append_sheet(wb, ws_secondaire, "Liste Secondaire");

    // Sauvegarde du fichier avec le nom de l'asso
    let fileName = `${groupeChoisi}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function compterLignesNonVides(idTableau) {
    let tableau = document.getElementById(idTableau);
    let tbody = tableau.querySelector("tbody");
    let count = 0;

    tbody.querySelectorAll("tr").forEach(tr => {
        let cellules = tr.querySelectorAll("td");
        let nonVide = Array.from(cellules).some(td => td.textContent.trim() !== "" && td.cellIndex > 0); // Ignore le numéro de ligne
        if (nonVide) count++;
    });

    return count;
}

function creerFeuilleExcelDeuxLignes(idTableau) {
    let tableau = document.getElementById(idTableau);
    let ws_data = [[], []];

    // Récupérer les données et les organiser en deux lignes
    let tbody = tableau.querySelector("tbody");
    tbody.querySelectorAll("tr").forEach(tr => {
        let rowData = [];
        tr.querySelectorAll("td").forEach(td => rowData.push(td.textContent.trim()));
        if (rowData.some(cell => cell !== "")) { // Vérifie si la ligne contient des valeurs non vides
            ws_data[0].push(rowData[1] || ""); // Prénom
            ws_data[0].push(rowData[2] || ""); // Nom
            ws_data[0].push(rowData[3] || ""); // Numéro Étudiant
        }
    });
    
    return XLSX.utils.aoa_to_sheet(ws_data);
}


function creerSelectionGroupe() {
    let container = document.getElementById("idchoix"); // 🔥 Sélectionne l'élément HTML
    if (!container) {
        console.error("Erreur : Impossible de trouver l'élément #idchoix.");
        return;
    }

    container.innerHTML = `
        <div class="select-container">
            <label for="groupeChoisi">Sélectionnez un groupe :</label>
            <select id="groupeChoisi"> 
                <option value="BDA">BDA</option> 
                <option value="BDE">BDE</option> 
                <option value="BDI">BDI</option> 
            </select>
        </div>
    `;
}

function mettreAJourTableaux() {
    let nbPrinc = parseInt(document.getElementById("nombreListePrinc").value) || 1;
    let nbSec = parseInt(document.getElementById("nombreListeSec").value) || 1;

    mettreAJourTableau("tableau_principal", nbPrinc);
    mettreAJourTableau("tableau_secondaire", nbSec);
}

function mettreAJourTableau(idTableau, nombreLignes) {
    let tableau = document.getElementById(idTableau);
    
    let thead = tableau.querySelector("thead");
    let tbody = tableau.querySelector("tbody");
    if (!tbody) {
        tbody = document.createElement("tbody");
        tableau.appendChild(tbody);
    }
    tbody.innerHTML = "";
    
    if (!thead) {
        thead = document.createElement("thead");
        tableau.prepend(thead);
    }
    
    thead.innerHTML = "<tr><th>N°</th><th>Prénom</th><th>Nom</th><th>Numéro Étudiant</th></tr>";

    for (let i = 0; i < nombreLignes; i++) {
        let row = tbody.insertRow();
        row.insertCell(0).textContent = i + 1;
        row.insertCell(1).textContent = "";
        row.insertCell(2).textContent = "";
        row.insertCell(3).textContent = "";
        row.onclick = () => supprimerLigne(row);
        row.onmouseover = () => row.style.fontWeight = "bold";
        row.onmouseout = () => row.style.fontWeight = "normal";
    }
}

function chercherEtudiants() {
    let recherche = document.getElementById("search").value.toLowerCase();
    let resultDiv = document.getElementById("resultats");
    resultDiv.innerHTML = "";

    etudiants.forEach(etudiant => {
        let texte = `${etudiant.Prenom} ${etudiant.Nom} - ${etudiant.Numero}`;
        if (texte.toLowerCase().includes(recherche)) {
            let div = document.createElement("div");
            div.innerHTML = `<p>${texte}</p>
                <button onclick="demanderPosition('${etudiant.Prenom}', '${etudiant.Nom}', '${etudiant.Numero}', 'tableau_principal')">Liste Principale</button>
                <button onclick="demanderPosition('${etudiant.Prenom}', '${etudiant.Nom}', '${etudiant.Numero}', 'tableau_secondaire')">Liste Secondaire</button>`;
            resultDiv.appendChild(div);
        }
    });
}

function demanderPosition(prenom, nom, numero, idTableau) {
    let position = prompt(`À quelle position veux-tu ajouter ${prenom} ${nom} ? (1 pour début)`);
    position = position ? parseInt(position) - 1 : null;
    ajouterAuTableau(prenom, nom, numero, idTableau, position);
}

function ajouterAuTableau(prenom, nom, numero, idTableau, position) {
    let tableau = document.getElementById(idTableau);
    if (!tableau) {
        console.error(`Tableau non trouvé : ${idTableau}`);
        return;
    }
    let tbody = tableau.querySelector("tbody");
    let rows = tbody.rows;
    if (position === null || position >= rows.length) {
        position = rows.length;
    }
    let row = tbody.rows[position] || tbody.insertRow(position);
    row.cells[1].textContent = prenom;
    row.cells[2].textContent = nom;
    row.cells[3].textContent = numero;
    row.onclick = () => supprimerLigne(row);
    row.onmouseover = () => row.style.fontWeight = "bold";
    row.onmouseout = () => row.style.fontWeight = "normal";
}

function supprimerLigne(row) {
    if (confirm("Voulez-vous vider cette ligne ?")) {
        row.cells[1].textContent = ""; // Efface le prénom
        row.cells[2].textContent = ""; // Efface le nom
        row.cells[3].textContent = ""; // Efface le numéro étudiant
    }
}


window.onload = () => {
    creerSelectionGroupe();
    chargerEtudiants();
    mettreAJourTableaux();
};
