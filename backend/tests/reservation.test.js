const request = require('supertest');
const { app, pool, initDB } = require('../server.js');

describe('🧪 Tests API /api/reservations', () => {
    let reservationId;

    beforeAll(async () => {
        // Initialiser la DB pour les tests
        await initDB();
    });

    afterEach(async () => {
        // Nettoyer après chaque test
        await pool.query('DELETE FROM reservations');
    });

    afterAll(async () => {
        // Fermer la connexion
        await pool.end();
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