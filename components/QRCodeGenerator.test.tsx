import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QRCodeGenerator from './QRCodeGenerator';
import QRCode from 'qrcode';

// Mock qrcode library
jest.mock('qrcode', () => ({
  toCanvas: jest.fn((canvas, value, options) => {
    // Simulate successful QR code generation
    return Promise.resolve();
  }),
}));

describe('QRCodeGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render canvas element', () => {
    render(<QRCodeGenerator value="https://example.com" />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render download button', () => {
    render(<QRCodeGenerator value="https://example.com" />);
    const button = screen.getByText('Download QR Code');
    expect(button).toBeInTheDocument();
  });

  it('should generate QR code with correct value', async () => {
    render(<QRCodeGenerator value="https://test.com" />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });

    const calls = (QRCode.toCanvas as jest.Mock).mock.calls;
    expect(calls[0][1]).toBe('https://test.com');
  });

  it('should use custom size when provided', async () => {
    render(<QRCodeGenerator value="https://test.com" size={512} />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });

    const calls = (QRCode.toCanvas as jest.Mock).mock.calls;
    expect(calls[0][2].width).toBe(512);
  });

  it('should use default size of 256 when not provided', async () => {
    render(<QRCodeGenerator value="https://test.com" />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });

    const calls = (QRCode.toCanvas as jest.Mock).mock.calls;
    expect(calls[0][2].width).toBe(256);
  });

  it('should trigger download when button is clicked', async () => {
    const user = userEvent.setup();
    const mockClick = jest.fn();
    const mockCreateElement = document.createElement;

    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
        } as any;
      }
      return mockCreateElement.call(document, tagName);
    });

    render(<QRCodeGenerator value="https://test.com" />);
    
    const button = screen.getByText('Download QR Code');
    await user.click(button);
    
    expect(mockClick).toHaveBeenCalled();
  });

  it('should regenerate QR code when value changes', async () => {
    const { rerender } = render(<QRCodeGenerator value="https://first.com" />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalledTimes(1);
    });

    rerender(<QRCodeGenerator value="https://second.com" />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalledTimes(2);
    });

    const calls = (QRCode.toCanvas as jest.Mock).mock.calls;
    expect(calls[1][1]).toBe('https://second.com');
  });

  it('should regenerate QR code when size changes', async () => {
    const { rerender } = render(<QRCodeGenerator value="https://test.com" size={256} />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalledTimes(1);
    });

    rerender(<QRCodeGenerator value="https://test.com" size={512} />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalledTimes(2);
    });

    const calls = (QRCode.toCanvas as jest.Mock).mock.calls;
    expect(calls[1][2].width).toBe(512);
  });

  it('should apply correct styling to canvas', () => {
    render(<QRCodeGenerator value="https://test.com" />);
    const canvas = document.querySelector('canvas');
    
    expect(canvas).toHaveClass('border-4');
    expect(canvas).toHaveClass('border-white');
    expect(canvas).toHaveClass('shadow-lg');
    expect(canvas).toHaveClass('rounded-lg');
  });

  it('should apply correct styling to button', () => {
    render(<QRCodeGenerator value="https://test.com" />);
    const button = screen.getByText('Download QR Code');
    
    expect(button).toHaveClass('bg-gray-800');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('rounded-lg');
  });

  it('should set correct QR code colors', async () => {
    render(<QRCodeGenerator value="https://test.com" />);
    
    await waitFor(() => {
      expect(QRCode.toCanvas).toHaveBeenCalled();
    });

    const calls = (QRCode.toCanvas as jest.Mock).mock.calls;
    expect(calls[0][2].color.dark).toBe('#000000');
    expect(calls[0][2].color.light).toBe('#FFFFFF');
  });
});



