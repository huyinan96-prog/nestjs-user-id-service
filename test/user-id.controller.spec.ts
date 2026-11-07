import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createValidationPipe } from '../src/common/validation.pipe';
import { UserIdController } from '../src/user-id/user-id.controller';
import { UserIdService } from '../src/user-id/user-id.service';

describe('POST /user-id validation', () => {
  let app: INestApplication;
  const service = {
    findOrCreate: jest.fn().mockResolvedValue({ userID: 'example' }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserIdController],
      providers: [{ provide: UserIdService, useValue: service }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts two string IDs', async () => {
    await request(app.getHttpServer())
      .post('/user-id')
      .send({ id1: 'ABC123', id2: 'XYZ456' })
      .expect(200)
      .expect({ userID: 'example' });
  });

  it.each([
    { description: 'missing id2', payload: { id1: 'ABC123' } },
    { description: 'empty id1', payload: { id1: '', id2: 'XYZ456' } },
    { description: 'non-string id1', payload: { id1: 123, id2: 'XYZ456' } },
    { description: 'extra field', payload: { id1: 'ABC123', id2: 'XYZ456', extra: true } },
    { description: 'whitespace in ID', payload: { id1: 'ABC 123', id2: 'XYZ456' } },
    { description: 'overlong ID', payload: { id1: 'A'.repeat(129), id2: 'XYZ456' } },
  ])('rejects invalid payload: $description', async ({ payload }) => {
    await request(app.getHttpServer())
      .post('/user-id')
      .send(payload)
      .expect(400);
  });
});
