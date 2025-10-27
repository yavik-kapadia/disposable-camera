# Testing Guide

This project uses Jest and React Testing Library for comprehensive test coverage.

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## 📊 Current Test Coverage

### Well-Tested Components (90%+ coverage)
- ✅ **AuthContext** - Authentication state management
- ✅ **ThemeContext** - Theme switching and system preference detection
- ✅ **QRCodeGenerator** - QR code generation and download
- ✅ **Utils/Helpers** - Core utility functions

### Components Needing Tests
- ⏳ **CameraCapture** - Camera component (requires browser APIs)
- ⏳ **ManualUpload** - File upload component
- ⏳ **Page Components** - Dashboard, Event, FAQ pages

## 📁 Test File Structure

```
disposable-camera/
├── components/
│   ├── QRCodeGenerator.tsx
│   └── QRCodeGenerator.test.tsx     # Component tests
├── contexts/
│   ├── AuthContext.tsx
│   ├── AuthContext.test.tsx         # Context tests
│   ├── ThemeContext.tsx
│   └── ThemeContext.test.tsx
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts              # Utility tests
├── __mocks__/
│   └── supabase.ts                  # Supabase mock
├── jest.config.js                   # Jest configuration
└── jest.setup.js                    # Test environment setup
```

## 🧪 Test Categories

### Unit Tests
- **Utils** - Pure functions (formatFileSize, generateAccessCode, etc.)
- **Helpers** - Image compression, file downloads

### Integration Tests
- **Contexts** - Auth and Theme providers
- **Components** - QR code generation and UI components

### Skipped Tests
Some tests are marked with `it.skip()` because they require a real browser environment:
- Image compression tests (need real Image API)
- Thumbnail generation tests (need canvas with image loading)

These would require Puppeteer or a full browser environment to test properly.

## 🎯 Writing Tests

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Context Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MyProvider, useMyContext } from './MyContext';

function TestComponent() {
  const { value } = useMyContext();
  return <div>{value}</div>;
}

describe('MyContext', () => {
  it('should provide context value', () => {
    render(
      <MyProvider>
        <TestComponent />
      </MyProvider>
    );
    expect(screen.getByText('expected-value')).toBeInTheDocument();
  });
});
```

### Utility Test Example

```typescript
import { myUtilFunction } from './helpers';

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    expect(myUtilFunction('input')).toBe('output');
  });

  it('should handle edge cases', () => {
    expect(myUtilFunction('')).toBe('');
    expect(myUtilFunction(null)).toBe(null);
  });
});
```

## 🔧 Test Configuration

### Jest Setup (`jest.setup.js`)
Includes mocks for:
- Next.js router (`useRouter`, `usePathname`, `useSearchParams`)
- Browser APIs (`matchMedia`, `IntersectionObserver`, `mediaDevices`)
- Canvas API (for QR code and image testing)

### Jest Config (`jest.config.js`)
- Uses Next.js's built-in Jest configuration
- Test environment: jsdom (simulates browser)
- Coverage collection from key directories
- Module path mapping for `@/` imports

## 📈 Coverage Reports

After running `npm run test:coverage`, view the detailed report:

```bash
# Open HTML coverage report in browser
open coverage/lcov-report/index.html
```

### Coverage Goals
- **Contexts**: 85%+ (business logic)
- **Utils**: 70%+ (pure functions)
- **Components**: 60%+ (UI components)

## 🐛 Debugging Tests

### Run a single test file
```bash
npm test -- AuthContext.test.tsx
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should handle sign in"
```

### Debug in VS Code
Add this configuration to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 🚧 Known Limitations

1. **Browser-dependent tests**: Image processing tests require real browser APIs
2. **Camera tests**: MediaDevices API cannot be fully mocked in jsdom
3. **Edge function tests**: Supabase Edge Functions require separate testing approach

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Next.js Applications](https://nextjs.org/docs/testing)

## 🎓 Best Practices

1. ✅ Write tests for new features before merging
2. ✅ Test user behavior, not implementation details
3. ✅ Use semantic queries (`getByRole`, `getByLabelText`)
4. ✅ Mock external dependencies (Supabase, APIs)
5. ✅ Keep tests simple and focused
6. ❌ Don't test third-party library internals
7. ❌ Don't over-mock (test real behavior when possible)

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Pre-deployment checks

The `test:ci` script is optimized for CI environments with:
- Coverage reporting
- Limited worker threads
- Non-interactive mode


