const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const db = new sqlite3.Database('./app.db');

app.get('/contacts', (req, res) => {
  const search = req.query.search || '';
  const tokens = search.trim().split(/\s+/); // séparer en mots

  let sql = 'SELECT * FROM contacts WHERE 1=1';
  const params = [];

  tokens.forEach(token => {
    sql += " AND (nom LIKE ? OR prenom LIKE ?)";
    params.push(`%${token}%`, `%${token}%`);
  });

  sql += " LIMIT 5";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post('/contacts/:id/note', (req, res) => {
  const id = req.params.id;
  let { note, commentaire } = req.body;

  if (commentaire && commentaire.length > 140) {
    commentaire = commentaire.slice(0, 140);
  }

  db.run(`UPDATE contacts SET note_adh = ?, commentaire = ? WHERE id = ?`, [note, commentaire, id], function (err) {
    if (err) return res.status(500).send(err.message);
    if (this.changes === 0) return res.status(404).send("Contact non trouvé");
    res.json({ success: true });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
