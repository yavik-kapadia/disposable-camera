import {
  generateAccessCode,
  formatFileSize,
  compressImage,
  generateThumbnail,
  downloadFile,
  formatDate,
} from './helpers';

describe('generateAccessCode', () => {
  it('should generate a code with default length of 8', () => {
    const code = generateAccessCode();
    expect(code).toHaveLength(8);
  });

  it('should generate a code with custom length', () => {
    const code = generateAccessCode(12);
    expect(code).toHaveLength(12);
  });

  it('should only contain alphanumeric characters (excluding similar-looking ones)', () => {
    const code = generateAccessCode();
    // Should not contain 0, O, 1, I, etc.
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it('should generate different codes on multiple calls', () => {
    const code1 = generateAccessCode();
    const code2 = generateAccessCode();
    expect(code1).not.toBe(code2);
  });
});

describe('formatFileSize', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should handle decimal values correctly', () => {
    const result = formatFileSize(1536); // 1.5 KB
    expect(result).toBe('1.5 KB');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const dateString = '2024-01-15T10:30:00Z';
    const formatted = formatDate(dateString);
    // The exact format depends on locale, but it should contain key components
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should handle different date formats', () => {
    const dateString = new Date('2023-12-25T18:45:00Z').toISOString();
    const formatted = formatDate(dateString);
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('25');
    expect(formatted).toContain('2023');
  });
});

describe('compressImage', () => {
  // These tests require a real browser environment with image loading
  // Skipping for now - would need jsdom-worker or puppeteer for proper testing
  it.skip('should compress an image', async () => {
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImage(mockFile);
    expect(result).toBeInstanceOf(Blob);
  });

  it.skip('should handle different max widths', async () => {
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImage(mockFile, 1280);
    expect(result).toBeInstanceOf(Blob);
  });

  it.skip('should handle different quality settings', async () => {
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImage(mockFile, 1920, 0.9);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should be a valid function', () => {
    expect(typeof compressImage).toBe('function');
    // Function has default parameters, so length counts only required params
    expect(compressImage.length).toBeGreaterThanOrEqual(1);
  });
});

describe('generateThumbnail', () => {
  // These tests require a real browser environment with image loading
  // Skipping for now - would need jsdom-worker or puppeteer for proper testing
  it.skip('should generate a thumbnail', async () => {
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await generateThumbnail(mockFile);
    expect(result).toBeInstanceOf(Blob);
  });

  it.skip('should scale down large images with custom max width', async () => {
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await generateThumbnail(mockFile, 200);
    expect(result).toBeInstanceOf(Blob);
  });

  it.skip('should use default max width of 400 when not provided', async () => {
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await generateThumbnail(mockFile);
    expect(result).toBeInstanceOf(Blob);
    expect(result.size).toBeGreaterThanOrEqual(0);
  });

  it('should be a valid function', () => {
    expect(typeof generateThumbnail).toBe('function');
    // Function has default parameters, so length counts only required params
    expect(generateThumbnail.length).toBeGreaterThanOrEqual(1);
  });
});

describe('downloadFile', () => {
  it('should trigger file download', () => {
    const mockBlob = new Blob(['test content'], { type: 'text/plain' });
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
        } as any;
      }
      return {} as any;
    });
    
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;
    
    downloadFile(mockBlob, 'test.txt');
    
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

