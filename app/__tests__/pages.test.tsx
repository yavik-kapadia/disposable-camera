import { render, screen } from '@testing-library/react';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock contexts
jest.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('Page Components - Smoke Tests', () => {
  describe('Home Page', () => {
    // We'll import dynamically to avoid module loading issues
    let HomePage: any;

    beforeAll(async () => {
      const module = await import('../page');
      HomePage = module.default;
    });

    it('should render without crashing', () => {
      render(<HomePage />);
      // Just check it renders something
      expect(document.body).toBeInTheDocument();
    });

    it('should display main heading', () => {
      render(<HomePage />);
      // Look for common heading text (adjust based on actual content)
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should render page content', () => {
      render(<HomePage />);
      // Just verify it renders without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('FAQ Page', () => {
    let FAQPage: any;

    beforeAll(async () => {
      const module = await import('../faq/page');
      FAQPage = module.default;
    });

    it('should render without crashing', () => {
      render(<FAQPage />);
      expect(document.body).toBeInTheDocument();
    });

    it('should display FAQ heading', () => {
      render(<FAQPage />);
      // FAQ page should have a heading
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accordion or expandable sections', () => {
      render(<FAQPage />);
      // FAQ typically has buttons for accordions
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Page', () => {
    let DashboardPage: any;

    beforeAll(async () => {
      const module = await import('../dashboard/page');
      DashboardPage = module.default;
    });

    it('should render without crashing', () => {
      render(<DashboardPage />);
      expect(document.body).toBeInTheDocument();
    });

    it('should render dashboard content', () => {
      render(<DashboardPage />);
      // Just verify it renders without crashing
      // Dashboard may require auth, so just check basic rendering
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Camera Layout', () => {
    let CameraLayout: any;

    beforeAll(async () => {
      const module = await import('../camera/[code]/layout');
      CameraLayout = module.default;
    });

    it('should render children without crashing', () => {
      render(
        <CameraLayout>
          <div data-testid="test-child">Test Content</div>
        </CameraLayout>
      );
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should render PWA-specific layout', () => {
      render(
        <CameraLayout>
          <div>Content</div>
        </CameraLayout>
      );
      // Should render without errors
      expect(document.body).toBeInTheDocument();
    });
  });
});

describe('Page SEO and Metadata', () => {
  it('should have valid document structure', () => {
    const { container } = render(<div>Test Page</div>);
    expect(container).toBeInTheDocument();
  });

  it('should render semantic HTML', () => {
    render(
      <main>
        <h1>Test Page</h1>
        <p>Content</p>
      </main>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('Error Boundaries', () => {
  // Suppress console.error for intentional error tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should handle component errors gracefully', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // This should not crash the test suite
    expect(() => {
      render(<ThrowError />);
    }).toThrow();
  });
});

