import request from 'supertest';
import express from 'express';
import tagRoutes from '../routes/tagRoutes';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const app = express();
app.use(express.json());
app.use('/api/tags', tagRoutes);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 20000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

describe('Tag API', () => {
  it('should create and return a new tag', async () => {
    const response = await request(app).post('/api/tags').send({
      label: 'Groceries',
      key: 'tesco',
      color: '#aabbcc'
    });

    expect(response.status).toBe(201);
    expect(response.body.label).toBe('Groceries');
    expect(response.body.key).toBe('tesco');
  });

  it('should return all tags', async () => {
    await request(app).post('/api/tags').send({
      label: 'Utilities',
      key: 'edf',
      color: '#ddeeff'
    });

    const response = await request(app).get('/api/tags');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].key).toBe('edf');
  });
});
