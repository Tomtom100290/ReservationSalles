// backend/tests/reservation.test.js
const request = require('supertest');
const waitOn = require('wait-on');
const { Pool } = require('pg');
const app = require('../app'); // <-- si ton app est dans app.js
// ou : const app = require('../server'); si tu exportes app depuis server.js

// ⚙️ Config temporaire de la DB pour tests
const testPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://testuser:testpass@localhost:5432/testdb',
});

describe('🧪 Tests API /api/reservations', () => {
    let reservationId;

    // 💡 Avant TOUS les tests
    beforeAll(async () => {
        console.log('⏳ Attente de PostgreSQL...');
        await waitOn({ resources: ['tcp:localhost:5432'], timeout: 30000 }); // attend 30 secondes max

        console.log('✅ PostgreSQL prêt, initialisation de la base...');
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
    }, 30000); // timeout Jest augmenté à 30s pour ce hook

    // Nettoyer après chaque test
    afterEach(async () => {
        await testPool.query('DELETE FROM reservations');
    });

    // Fermer la connexion DB
    afterAll(async () => {
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
            heure: '10:00',
        };

        const res = await request(app)
            .post('/api/reservations')
            .send(newReservation);

        expect(res.statusCode).toBe(201);
        expect(res.body.salle).toBe('Salle Test');
        reservationId = res.body.id;
    });

    it('DELETE /api/reservations/:id → 200', async () => {
        const res = await request(app).delete(`/api/reservations/${reservationId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Réservation supprimée');
    });
});
