// Mock Supabase client for testing

export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  })),
  storage: {
    from: jest.fn((bucket: string) => ({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'mock-path' },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['mock data']),
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://mock-url.com/image.jpg' },
      }),
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://mock-url.com/signed/image.jpg' },
        error: null,
      }),
    })),
  },
  channel: jest.fn((name: string) => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn().mockResolvedValue({ error: null }),
  })),
};

export const createMockSupabaseClient = () => {
  return {
    ...mockSupabaseClient,
    // Reset all mocks
    _reset: () => {
      Object.values(mockSupabaseClient.auth).forEach((fn: any) => {
        if (typeof fn === 'function' && fn.mockClear) {
          fn.mockClear();
        }
      });
    },
  };
};



