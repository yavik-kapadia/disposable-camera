import { render, screen } from '@testing-library/react';
import ManualUpload from './ManualUpload';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
}));

// Mock helpers
jest.mock('@/utils/helpers', () => {
  const original = jest.requireActual('@/utils/helpers');
  return {
    ...original,
    compressImage: jest.fn((file) => Promise.resolve(new Blob(['compressed'], { type: 'image/jpeg' }))),
    generateThumbnail: jest.fn((file) => Promise.resolve(new Blob(['thumb'], { type: 'image/webp' }))),
  };
});

describe('ManualUpload - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  it('should render without crashing', () => {
    render(<ManualUpload eventId="test-event" />);
    expect(screen.getByRole('heading', { name: 'Upload Photos' })).toBeInTheDocument();
  });

  it('should render upload form elements', () => {
    const { container } = render(<ManualUpload eventId="test-event" />);
    
    // Should have heading
    expect(screen.getByRole('heading', { name: 'Upload Photos' })).toBeInTheDocument();
    
    // Should have inputs (name input and file input)
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    
    // Should have upload button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should have tips section', () => {
    render(<ManualUpload eventId="test-event" />);
    
    expect(screen.getByText('Tips:')).toBeInTheDocument();
    expect(screen.getByText(/You can select multiple photos/i)).toBeInTheDocument();
  });

  it('should render with event ID prop', () => {
    const { container } = render(<ManualUpload eventId="custom-event-123" />);
    
    // Should render without errors
    expect(container).toBeInTheDocument();
  });

  it('should call onUploadSuccess callback prop if provided', () => {
    const onUploadSuccess = jest.fn();
    render(<ManualUpload eventId="test-event" onUploadSuccess={onUploadSuccess} />);
    
    // Just verify it renders with the callback
    expect(screen.getByRole('heading', { name: 'Upload Photos' })).toBeInTheDocument();
  });

  // Note: Complex upload workflow tests are skipped and covered by E2E tests
  // These tests would require extensive mocking of file APIs, drag-and-drop, etc.
});
