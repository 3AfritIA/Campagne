const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');

const db = new sqlite3.Database('./app.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    adresse TEXT,
    note_adh INTEGER DEFAULT NULL,
    commentaire TEXT
  )`);

  fs.createReadStream('20250925_BD liste electorale - BD.csv')
    .pipe(csv())
    .on('data', (row) => {
      const adresse = [
        row['Numéro de voie'],
        row['Type et libellé de voie'],
        row['1er Complément adresse'],
        row['2nd Complément adresse'],
        row['Lieu-Dit'],
        row['Code postal'],
        row['Libellé de commune']
      ].filter(Boolean).join(' ');

      db.run(`INSERT INTO contacts (nom, prenom, adresse) VALUES (?, ?, ?)`,
        [row['Nom'], row['Prénoms'], adresse]);
    })
    .on('end', () => {
      console.log('Import terminé');
      db.close();
    });
});
