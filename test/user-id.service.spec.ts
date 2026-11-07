import { randomUUID } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { CacheService } from '../src/cache/cache.service';
import { DatabaseService } from '../src/database/database.service';
import { UserIdService } from '../src/user-id/user-id.service';

describe('UserIdService', () => {
  const execute = jest.fn();
  const cacheGet = jest.fn();
  const cacheSet = jest.fn();
  const database = { pool: { execute } } as unknown as DatabaseService;
  const cache = { get: cacheGet, set: cacheSet } as unknown as CacheService;
  const service = new UserIdService(database, cache);

  beforeEach(() => {
    jest.clearAllMocks();
    cacheGet.mockResolvedValue(null);
    cacheSet.mockResolvedValue(undefined);
  });

  it('generates and returns a UUID v4 for a new pair', async () => {
    execute.mockImplementationOnce(async (_sql: string, args: string[]) => {
      expect(args[0]).toBe('ABC123');
      expect(args[1]).toBe('XYZ456');
      expect(args[2]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      execute.mockResolvedValueOnce([[{ user_id: args[2] }], []]);
      return [{ affectedRows: 1 }, []];
    });

    const response = await service.findOrCreate('ABC123', 'XYZ456');
    expect(response.userID).toMatch(/^[0-9a-f-]{36}$/i);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(cacheSet).toHaveBeenCalledWith(expect.stringContaining('user-id:'), response.userID);
  });

  it('returns the existing UUID for an existing pair', async () => {
    const existing = randomUUID();
    execute.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
    execute.mockResolvedValueOnce([[{ user_id: existing }], []]);

    await expect(service.findOrCreate('ABC123', 'XYZ456')).resolves.toEqual({ userID: existing });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('uses Redis when cached and skips MySQL', async () => {
    const existing = randomUUID();
    cacheGet.mockResolvedValueOnce(existing);

    await expect(service.findOrCreate('ABC123', 'XYZ456')).resolves.toEqual({ userID: existing });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns an opaque 503 when the database fails', async () => {
    execute.mockRejectedValueOnce(new Error('secret database details'));
    await expect(service.findOrCreate('ABC123', 'XYZ456')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
