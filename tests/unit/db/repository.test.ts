// Provide a mock for the config module BEFORE importing modules that load it.
jest.mock('../../../src/config', () => ({
  config: {
    supabaseUrl: 'https://test.supabase',
    supabaseServiceRoleKey: 'test-key',
  },
}));

const dbIndex = require('../../../src/lib/db/index');
const repo = require('../../../src/lib/db/repository');

type MockRow = Record<string, any>;

function makeMockFrom(returnValue: any) {
  const resolved = { data: returnValue, error: null };

  const from = jest.fn().mockImplementation((table: string) => {
    // eq needs to be both chainable and awaitable; create a thenable object
    const eqFn = jest.fn().mockImplementation(() => {
      const obj: any = {
        single: jest.fn().mockResolvedValue(resolved),
        limit: jest.fn().mockResolvedValue(resolved),
      };
      obj.then = (onFulfilled: any, onRejected: any) => Promise.resolve(resolved).then(onFulfilled, onRejected);
      return obj;
    });

    return {
      // select(...).eq(...)/.limit(...) or .single()
      select: jest.fn().mockReturnValue({
        eq: eqFn,
        limit: jest.fn().mockResolvedValue(resolved),
        single: jest.fn().mockResolvedValue(resolved),
      }),
      // insert(...).select()
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(resolved) }),
      // upsert(...).select()
      upsert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(resolved) }),
  // update(...).eq(...).select()
  update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(resolved) }) }),
    };
  });

  return { from } as any;
}

describe('db repository', () => {
  const originalGet = dbIndex.getSupabaseClient;

  afterEach(() => {
    jest.resetAllMocks();
    (dbIndex.getSupabaseClient as any) = originalGet;
  });

  test('getInventoryById returns row when found', async () => {
    const expected = { id: 1, attachment_url: 'https://example.com/img.jpg' };
    const mockClient = makeMockFrom(expected);
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.getInventoryById(1);
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_inventory');
  });

  test('findInventoryBySha256 returns array', async () => {
    const expected = [{ id: 2, sha256: 'abc' }];
    const mockClient = makeMockFrom(expected);
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.findInventoryBySha256('abc');
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_inventory');
  });

  test('upsertInventory calls upsert and returns data', async () => {
    const expected = [{ id: 3, attachment_url: 'u', sha256: 's' }];
    const mockClient = makeMockFrom(expected);
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.upsertInventory({ attachment_url: 'u', sha256: 's' });
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_inventory');
  });

  test('listPending returns pending rows', async () => {
    const expected = [{ id: 4, status: 'pending' }];
    // customize the mock to return via select().eq().limit()
    const mockClient: any = {
      from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue({ data: expected, error: null }) }) }) })
    };
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.listPending(10);
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_inventory');
  });

  test('updateInventoryStatus updates and returns data', async () => {
    const expected = [{ id: 5, status: 'optimized' }];
    const mockClient = makeMockFrom(expected);
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.updateInventoryStatus(5, 'optimized');
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_inventory');
  });

  test('insertOptimization inserts record', async () => {
    const expected = [{ id: 6, inventory_id: 5 }];
    const mockClient = makeMockFrom(expected);
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.insertOptimization({ inventory_id: 5, optimized_url: 'o' });
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_optimization');
  });

  test('getOptimizationsByInventoryId returns optimizations', async () => {
    const expected = [{ id: 7, inventory_id: 5 }];
    const mockClient = makeMockFrom(expected);
    jest.spyOn(dbIndex, 'getSupabaseClient').mockImplementation(() => mockClient as any);

    const res = await repo.getOptimizationsByInventoryId(5);
    expect(res).toEqual(expected);
    expect(mockClient.from).toHaveBeenCalledWith('media_optimization');
  });
});
