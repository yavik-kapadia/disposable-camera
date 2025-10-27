'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      category: 'System Requirements',
      questions: [
        {
          q: 'What browsers are supported?',
          a: (
            <div className="space-y-2">
              <p><strong>Recommended:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Chrome 90+ (Desktop & Android)</li>
                <li>Safari 14.3+ (iOS & macOS)</li>
                <li>Edge 90+</li>
              </ul>
              <p className="mt-3"><strong>Limited Support:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Firefox (basic camera features only)</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                💡 Chrome on Android and Safari on iOS provide the best experience with hardware zoom support.
              </p>
            </div>
          ),
        },
        {
          q: 'Do I need HTTPS?',
          a: 'Yes, the camera API requires a secure connection (HTTPS). This is a browser security requirement for accessing the camera. The app will work on localhost for development without HTTPS.',
        },
        {
          q: 'What are the minimum device specifications?',
          a: (
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Camera:</strong> Any device with a front or rear camera</li>
                <li><strong>Resolution:</strong> Minimum 1280x720 (720p), ideal 1920x1080 (Full HD)</li>
                <li><strong>Frame Rate:</strong> Minimum 30fps, ideal 60fps for best motion blur reduction</li>
                <li><strong>Storage:</strong> Photos are compressed but ensure adequate device storage</li>
                <li><strong>Internet:</strong> Active connection required for uploading photos</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      category: 'Camera Features',
      questions: [
        {
          q: 'What is hardware zoom vs digital zoom?',
          a: (
            <div className="space-y-2">
              <p><strong>Hardware Zoom (⚡):</strong></p>
              <p>Uses your device\'s actual camera optics for zooming. Provides better quality with no loss in detail. Available on most modern smartphones (iPhone 11+, most Android flagship devices).</p>
              <p className="mt-3"><strong>Digital Zoom:</strong></p>
              <p>Software-based zoom that crops and scales the image. Falls back to this on devices that don\'t support hardware zoom.</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                💡 You\'ll see a ⚡ lightning icon in the zoom indicator if your device supports hardware zoom.
              </p>
            </div>
          ),
        },
        {
          q: 'How do I reduce blurry photos?',
          a: (
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-1">
                <li>The app automatically requests 60fps for smoother captures</li>
                <li>Use the self-timer (3s, 5s, or 10s) to stabilize before capturing</li>
                <li>Hold your device steady when taking photos</li>
                <li>Ensure good lighting - better light = faster shutter = less blur</li>
                <li>Devices with hardware zoom produce sharper zoomed photos</li>
              </ul>
            </div>
          ),
        },
        {
          q: 'What camera features are available?',
          a: (
            <div className="space-y-2">
              <p><strong>Standard Features:</strong></p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Switch between front/rear cameras</li>
                <li>Zoom (1x-3x digital, or up to 10x+ hardware on supported devices)</li>
                <li>Pinch-to-zoom on mobile</li>
                <li>Composition grid (rule of thirds)</li>
                <li>Self-timer (3s, 5s, 10s)</li>
                <li>Color filters (B&W, Sepia, Vintage)</li>
                <li>Fullscreen mode</li>
              </ul>
              <p><strong>Advanced Features (device-dependent):</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Hardware optical zoom</li>
                <li>Continuous auto-focus</li>
                <li>Automatic exposure adjustment</li>
                <li>White balance correction</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      category: 'Photo Quality',
      questions: [
        {
          q: 'What resolution are the photos?',
          a: 'Photos are captured at your camera\'s maximum resolution (typically 1920x1080 or higher) and then compressed to optimize file size while maintaining quality. The app requests Full HD (1920x1080) ideally, with a minimum of 1280x720.',
        },
        {
          q: 'Are photos saved to my device?',
          a: 'Photos are automatically saved to your device\'s download folder after being captured. They\'re also uploaded to the event cloud storage, so you have both local and cloud copies.',
        },
        {
          q: 'How much data do photos use?',
          a: 'Photos are compressed before upload. Typical file sizes range from 200KB to 1MB depending on content complexity. A thumbnail (WebP format) is also generated for faster gallery loading.',
        },
      ],
    },
    {
      category: 'Permissions & Privacy',
      questions: [
        {
          q: 'Why do I need to grant camera permissions?',
          a: 'Camera permissions are required to access your device\'s camera for taking photos. The app only accesses the camera when you explicitly start it and never accesses it in the background.',
        },
        {
          q: 'Can I use the app offline?',
          a: 'You can take photos offline, but an internet connection is required to upload them to the event. Photos will be stored locally until you regain connection.',
        },
        {
          q: 'Who can see my photos?',
          a: 'Only the event creator and guests with the access code can view photos from an event. Photos are stored securely and are not publicly accessible.',
        },
      ],
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          q: 'Camera won\'t start - what should I check?',
          a: (
            <div className="space-y-2">
              <ol className="list-decimal pl-6 space-y-1">
                <li>Ensure you\'re using HTTPS (not HTTP)</li>
                <li>Grant camera permissions when prompted</li>
                <li>Check that no other app is using the camera</li>
                <li>Try refreshing the page</li>
                <li>Try switching to the front/rear camera</li>
                <li>If all else fails, use the Upload tab to select photos from your gallery</li>
              </ol>
            </div>
          ),
        },
        {
          q: 'Photos aren\'t uploading - what should I do?',
          a: (
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-1">
                <li>Check your internet connection</li>
                <li>Photos upload in the background - look for the upload indicator</li>
                <li>Wait a moment - larger photos may take a few seconds</li>
                <li>Try refreshing the page if uploads are stuck</li>
              </ul>
            </div>
          ),
        },
        {
          q: 'Zoom isn\'t working properly',
          a: 'If zoom isn\'t working: 1) Check the console (F12) to see if hardware zoom is supported on your device, 2) Digital zoom will be used as fallback on devices without hardware support, 3) Captured photos should match what you see on screen regardless of zoom type.',
        },
        {
          q: 'Black bars appear in landscape mode',
          a: 'This has been fixed in the latest version. The camera feed now uses object-cover to fill the entire viewport without black bars. If you\'re still seeing them, try refreshing the page.',
        },
      ],
    },
    {
      category: 'Best Practices',
      questions: [
        {
          q: 'How can I get the best photo quality?',
          a: (
            <div className="space-y-2">
              <ul className="list-disc pl-6 space-y-1">
                <li>Use good lighting - natural light is best</li>
                <li>Hold your device steady or use the self-timer</li>
                <li>Use the composition grid to frame shots</li>
                <li>Clean your camera lens</li>
                <li>Use hardware zoom (if available) instead of digital zoom</li>
                <li>Avoid zooming too far - quality degrades at high zoom levels</li>
                <li>Take multiple shots to ensure you get a good one</li>
              </ul>
            </div>
          ),
        },
        {
          q: 'Should I use the camera or upload photos?',
          a: 'Both options work great! Use the camera for real-time event photos. Use the upload feature if you have existing photos on your device you want to add to the event, or if camera access isn\'t working.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-orange-100 to-orange-50 dark:from-black dark:via-black dark:to-black transition-colors duration-200">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              FAQ & Help
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Everything you need to know about Disposable Camera
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-transparent dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <span className="text-orange-500">{sectionIndex === 0 ? '⚙️' : sectionIndex === 1 ? '📸' : sectionIndex === 2 ? '🖼️' : sectionIndex === 3 ? '🔒' : sectionIndex === 4 ? '🔧' : '💡'}</span>
                  {section.category}
                </h2>
                <div className="space-y-4">
                  {section.questions.map((faq, faqIndex) => {
                    const globalIndex = sectionIndex * 100 + faqIndex;
                    const isOpen = openIndex === globalIndex;
                    
                    return (
                      <div key={faqIndex} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                        <button
                          onClick={() => toggleFAQ(globalIndex)}
                          className="w-full text-left flex items-start justify-between gap-4 group"
                        >
                          <span className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {faq.q}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
                            {typeof faq.a === 'string' ? <p>{faq.a}</p> : faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-linear-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-2xl shadow-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
            <p className="mb-6 opacity-90">
              Can't find what you're looking for? Check the browser console (F12) for technical details or error messages.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
              >
                Go to Home
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

