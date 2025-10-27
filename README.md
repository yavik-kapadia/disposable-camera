# 📸 Disposable Camera - Event Photo Sharing PWA

A Progressive Web App for sharing photos at events using a disposable camera experience.

## ✨ Features

- 📱 **PWA Camera**: Take photos directly from your browser
- 🔒 **Event-based Access**: Unique codes for each event
- 📤 **Manual Upload**: Upload photos from gallery
- 🎨 **Camera Filters**: Black & white, sepia, vintage
- 🔍 **Hardware Zoom**: Support for device camera zoom
- 📊 **Event Dashboard**: Manage multiple events
- 🌓 **Dark Mode**: System-based theme switching
- 📥 **Bulk Download**: Download all event photos
- 🔐 **Row Level Security**: Secure data access

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd disposable-camera

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
# (See docs/SUPABASE_SETUP.md)

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 🧪 Testing

### Unit Tests (Jest + React Testing Library)

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# CI mode
npm run test:ci
```

**Coverage**: 65 passing tests with >85% coverage on critical components.

### E2E Tests (Playwright)

```bash
# Install browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

**See [docs/E2E_TESTING.md](docs/E2E_TESTING.md) for detailed guide.**

## 📚 Documentation

- **[Quick Start](docs/QUICKSTART.md)** - Get started in 5 minutes
- **[Supabase Setup](docs/SUPABASE_SETUP.md)** - Database configuration
- **[Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)** - Authentication setup
- **[PWA Setup](docs/PWA_SETUP.md)** - Progressive Web App features
- **[Testing Guide](docs/TESTING.md)** - Complete testing documentation
- **[E2E Testing](docs/E2E_TESTING.md)** - Playwright E2E tests
- **[Deployment](docs/DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel

## 📁 Project Structure

```
disposable-camera/
├── app/                    # Next.js app directory
│   ├── camera/[code]/      # Camera page (PWA)
│   ├── dashboard/          # Event management
│   ├── event/[id]/         # Event viewing
│   └── faq/                # FAQ page
├── components/             # React components
│   ├── CameraCapture.tsx   # Camera component
│   ├── ManualUpload.tsx    # File upload
│   └── QRCodeGenerator.tsx # QR code generator
├── contexts/               # React contexts
│   ├── AuthContext.tsx     # Authentication
│   └── ThemeContext.tsx    # Theme management
├── docs/                   # Documentation
├── e2e/                    # Playwright E2E tests
├── supabase/               # Database migrations
├── utils/                  # Utility functions
└── types/                  # TypeScript types
```

## 🔑 Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Setup

1. Add environment variables in Vercel dashboard
2. Set up Supabase edge functions
3. Configure custom domain (optional)

**See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for details.**

## 📸 Usage

### For Event Organizers

1. Sign in with Google
2. Create a new event
3. Share the QR code or access code
4. View and download photos

### For Event Guests

1. Scan QR code or enter access code
2. Grant camera permissions
3. Take photos or upload from gallery
4. Photos are automatically saved

## 🛠️ Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run all tests
npm test && npm run test:e2e
```

## 📊 Test Coverage

- **Unit Tests**: 65 passing, 6 skipped
- **E2E Tests**: 20 tests across 4 suites
- **Coverage**: >85% on critical paths
- **Status**: ✅ All passing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run `npm test` to verify
6. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend infrastructure
- Vercel for hosting
- Playwright for E2E testing

## 📞 Support

- **Documentation**: Check `/docs` directory
- **Issues**: GitHub Issues
- **FAQ**: Visit `/faq` page

---

**Built with ❤️ using Next.js and Supabase**
