const request = require('supertest');
const { Pool } = require('pg');

// Configuration de la connexion pour les tests
const testPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://testuser:testpass@localhost:5432/testdb'
});

// Import de l'app - IMPORTANT: importer après avoir configuré la DB
const { app } = require('../server.js');

describe('🧪 Tests API /api/reservations', () => {
    let reservationId;

    beforeAll(async () => {
        // Attendre que PostgreSQL soit prêt
        let retries = 5;
        while (retries > 0) {
            try {
                await testPool.query('SELECT 1');
                console.log('✅ Connexion PostgreSQL établie');
                break;
            } catch (err) {
                retries--;
                console.log(`⏳ Attente PostgreSQL... (${retries} essais restants)`);
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Créer la table si elle n'existe pas
        await testPool.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                salle VARCHAR(100) NOT NULL,
                nom VARCHAR(100) NOT NULL,
                date DATE NOT NULL,
                heure VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table reservations créée/vérifiée');
    });

    afterEach(async () => {
        // Nettoyer après chaque test
        await testPool.query('DELETE FROM reservations');
    });

    afterAll(async () => {
        // Fermer la connexion
        await testPool.end();
    });

    it('GET /api/reservations → 200', async () => {
        const res = await request(app).get('/api/reservations');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/reservations → 201', async () => {
        const newReservation = {
            salle: 'Salle Test',
            nom: 'Alice',
            date: '2025-10-25',
            heure: '10:00'
        };

        const res = await request(app)
            .post('/api/reservations')
            .send(newReservation);

        expect(res.statusCode).toBe(201);
        expect(res.body.salle).toBe('Salle Test');
        reservationId = res.body.id;
    });

    it('DELETE /api/reservations/:id → 200', async () => {
        // D'abord créer une réservation
        const createRes = await request(app)
            .post('/api/reservations')
            .send({
                salle: 'Salle Test',
                nom: 'Bob',
                date: '2025-10-26',
                heure: '14:00'
            });

        const id = createRes.body.id;

        // Puis la supprimer
        const res = await request(app).delete(`/api/reservations/${id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Réservation supprimée');
    });
});