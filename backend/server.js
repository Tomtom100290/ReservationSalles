const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à la base de données
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialiser la table au démarrage
async function initDB() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        salle VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        heure VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Base de données initialisée');
    } catch (err) {
        console.error('❌ Erreur init DB:', err);
    }
}

// Routes API
app.get('/api/reservations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reservations ORDER BY date, heure');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reservations', async (req, res) => {
    const { salle, nom, date, heure } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO reservations (salle, nom, date, heure) VALUES ($1, $2, $3, $4) RETURNING *',
            [salle, nom, date, heure]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reservations/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reservations WHERE id = $1', [req.params.id]);
        res.json({ message: 'Réservation supprimée' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exporter l'app et les utilitaires
module.exports = { app, pool, initDB };

// Démarrer le serveur SEULEMENT si ce fichier est exécuté directement
if (require.main === module) {
    const PORT = 3000;

    // Initialiser la DB après 3 secondes seulement en mode normal
    //setTimeout(initDB, 3000);

    app.listen(PORT, () => {
        console.log(`🚀 Backend démarré sur le port ${PORT}`);
    });
}