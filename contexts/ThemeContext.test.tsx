import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

// Test component that uses the theme hook
function TestComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

describe('ThemeContext', () => {
  let mockMatchMedia: jest.Mock;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    mediaQueryListeners = [];
    
    mockMatchMedia = jest.fn().mockImplementation((query) => ({
      matches: false, // Default to light theme
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          mediaQueryListeners.push(callback);
        }
      }),
      removeEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          const index = mediaQueryListeners.indexOf(callback);
          if (index > -1) {
            mediaQueryListeners.splice(index, 1);
          }
        }
      }),
      dispatchEvent: jest.fn(),
    }));

    window.matchMedia = mockMatchMedia;
    
    // Reset document.documentElement.classList
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('ThemeProvider', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Child</div>
        </ThemeProvider>
      );
      
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with system theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('should detect light theme from system preferences', async () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: false, // Light theme
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should detect dark theme from system preferences', async () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: true, // Dark theme
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should listen for system theme changes', async () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: false, // Start with light
        media: query,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryListeners.push(callback);
          }
        }),
        removeEventListener: jest.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });

      // Simulate system theme change to dark
      mockMatchMedia.mockReturnValue({
        matches: true, // Now dark
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      // Trigger the change event
      await act(async () => {
        mediaQueryListeners.forEach((listener) => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.fn();
      
      mockMatchMedia.mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: removeEventListenerSpy,
      }));

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should initialize from document class if dark class exists', async () => {
      document.documentElement.classList.add('dark');
      
      mockMatchMedia.mockImplementation((query) => ({
        matches: true, // Dark theme
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Wait for effect to run and update theme
      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('useTheme', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');
      
      consoleErrorSpy.mockRestore();
    });

    it('should provide theme context when used inside ThemeProvider', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByTestId('theme')).toBeInTheDocument();
      expect(screen.getByTestId('resolved-theme')).toBeInTheDocument();
      expect(screen.getByText('Set Light')).toBeInTheDocument();
      expect(screen.getByText('Set Dark')).toBeInTheDocument();
      expect(screen.getByText('Set System')).toBeInTheDocument();
    });

    it('should have setTheme function (even if no-op)', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      const setLightButton = screen.getByText('Set Light');
      
      // Should not throw even though setTheme is a no-op
      expect(() => {
        setLightButton.click();
      }).not.toThrow();
    });
  });

  describe('document class manipulation', () => {
    it('should add dark class when system prefers dark', async () => {
      mockMatchMedia.mockImplementation((query) => ({
        matches: true, // Dark theme
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should remove dark class when system prefers light', async () => {
      document.documentElement.classList.add('dark');

      mockMatchMedia.mockImplementation((query) => ({
        matches: false, // Light theme
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });
});

