// backend/tests/reservation.test.js
const request = require('supertest');
const waitOn = require('wait-on');
const { Pool } = require('pg');
//const faker = require('@faker-js/faker').faker;
const faker = require('@faker-js/faker');
const app = require('../app'); // ton app Express

// Détecter l'environnement CI (GitHub Actions) ou local Docker
const isCI = !!process.env.CI;

// Config DB selon l'environnement
const DB_HOST = isCI ? 'postgres' : 'db';
const DB_PORT = 5432;

const DATABASE_URL =
    process.env.DATABASE_URL ||
    `postgresql://admin:password123@${DB_HOST}:${DB_PORT}/reservations`;

// Pool PostgreSQL pour tests
const testPool = new Pool({
    connectionString: DATABASE_URL,
});

describe('🧪 Tests API /api/reservations avec fausses données', () => {
    let reservationId;

    // 💡 Avant tous les tests : attendre PostgreSQL et créer la table si nécessaire
    beforeAll(async () => {
        console.log(`⏳ Attente de PostgreSQL sur ${DB_HOST}:${DB_PORT}...`);
        await waitOn({ resources: [`tcp:${DB_HOST}:${DB_PORT}`], timeout: 60000 });
        console.log('✅ PostgreSQL prêt');

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
    }, 60000); // timeout 60s pour beforeAll

    // Nettoyer la table après chaque test
    afterEach(async () => {
        await testPool.query('DELETE FROM reservations');
    });

    // Fermer le pool à la fin
    afterAll(async () => {
        await testPool.end();
    });

    it('GET /api/reservations → 200', async () => {
        const res = await request(app).get('/api/reservations');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/reservations → 201 avec fausses données', async () => {
        const fakeReservation = {
            salle: faker.word.adjective() + ' ' + faker.word.noun(),
            nom: faker.person.firstName(),
            date: faker.date.future().toISOString().split('T')[0],
            heure: `${faker.number.int({ min: 8, max: 18 })}:00`,
        };

        const res = await request(app)
            .post('/api/reservations')
            .send(fakeReservation);

        expect(res.statusCode).toBe(201);
        expect(res.body.salle).toBe(fakeReservation.salle);
        expect(res.body.nom).toBe(fakeReservation.nom);

        reservationId = res.body.id;
    });

    it('DELETE /api/reservations/:id → 200', async () => {
        // Créer une réservation fictive avant de la supprimer
        const resCreate = await testPool.query(
            `INSERT INTO reservations (salle, nom, date, heure) VALUES ($1,$2,$3,$4) RETURNING id`,
            ['Salle Test', 'Alice', '2025-10-25', '10:00']
        );
        const idToDelete = resCreate.rows[0].id;

        const res = await request(app).delete(`/api/reservations/${idToDelete}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Réservation supprimée');
    });
});
