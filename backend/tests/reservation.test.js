// backend/tests/reservation.test.js
const request = require('supertest');
const waitOn = require('wait-on');
const { Pool } = require('pg');
const app = require('../app');

// 🧩 Détection du contexte
const isCI = !!process.env.CI;
const DB_HOST = isCI ? 'localhost' : 'db';
const DB_PORT = 5432;

// 🔗 Chaîne de connexion dynamique
const DATABASE_URL =
    process.env.DATABASE_URL ||
    (isCI
        ? `postgresql://testuser:testpass@${DB_HOST}:${DB_PORT}/testdb`
        : `postgresql://admin:password123@${DB_HOST}:${DB_PORT}/reservations`);

const testPool = new Pool({ connectionString: DATABASE_URL });

describe('🧪 Tests API /api/reservations', () => {
    let reservationId;

    beforeAll(async () => {
        console.log(`⏳ Attente de PostgreSQL sur ${DB_HOST}:${DB_PORT}...`);
        await waitOn({ resources: [`tcp:${DB_HOST}:${DB_PORT}`], timeout: 60000 }); // 60s max
        console.log('✅ PostgreSQL prêt');

        await testPool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        salle VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        heure VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    }, 60000); // ← timeout Jest étendu à 60 secondes

    afterEach(async () => {
        await testPool.query('DELETE FROM reservations');
    });

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

        const res = await request(app).post('/api/reservations').send(newReservation);
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
