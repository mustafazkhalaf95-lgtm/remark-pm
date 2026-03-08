<p align="center">
  <strong>R</strong>
</p>

<h1 align="center">Remark PM</h1>

<p align="center">
  <strong>نظام إدارة مشاريع وكالة تسويق متكامل — Agency Project Management System</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Language-AR%20%7C%20EN-green" alt="Bilingual" />
</p>

---

## 📖 About

**Remark PM** is a full-featured project management system designed for marketing agencies. It provides four interconnected department boards — Marketing, Creative, Production, and Publishing — with real-time data synchronization, AI-assisted workflows, and a bilingual (Arabic/English) interface.

Built with **Next.js 16**, **React 19**, and **TypeScript**, the system manages the complete client lifecycle from initial contact through content delivery.

---

## ✨ Features

### 🏗️ Core Architecture
- **4 Department Boards** — Marketing, Creative, Production, Publishing
- **Cross-Board Data Sync** — Singleton stores maintain shared client identity
- **Client Lifecycle Management** — Pipeline stages from first contact → converted client
- **Bilingual Interface** — Full Arabic & English support with RTL layout

### 📋 Marketing Board
- Marketing plan wizard (4-step client onboarding)
- 5-stage pipeline (Initial Contact → First Meeting → Quotation → Negotiation → Agreement)
- Client conversion to active accounts
- Monthly summary reports
- Team chat with AI assistant

### 🎨 Creative Board
- 10-stage creative pipeline with stage ownership
- Creative request management (12 content categories)
- Brand asset library & inspiration board
- AI client persona simulation
- Creative Director review workflow

### 🎬 Production Board
- 13-stage production pipeline
- Storyboard planning & scene management
- Media file tracking & version control
- Equipment & talent scheduling
- Campaign management

### 📢 Publishing Board
- Content scheduling & calendar
- Multi-platform publishing workflow
- Performance tracking

### 🔧 Technical
- **Glassmorphism UI** — Modern, premium dark/light theme
- **localStorage Persistence** — Data survives page reloads
- **Optimistic Updates** — Fast, responsive UI with `useTransition`
- **Error Resilience** — Crash-safe data persistence

---

## 🏛️ Architecture

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Marketing Board (main entry)
│   ├── creative/             # Creative Board pages
│   ├── production/           # Production Board pages
│   ├── publishing/           # Publishing Board pages
│   ├── admin/                # Admin panel
│   └── api/                  # REST API routes
├── components/               # Reusable UI components
├── context/                  # React Context providers
└── lib/                      # Core business logic
    ├── creativeStore.ts      # Creative board state (singleton)
    ├── productionStore.ts    # Production board state (singleton)
    ├── publishingStore.ts    # Publishing board state (singleton)
    ├── texts.ts              # i18n translations (AR/EN)
    ├── aiClient.ts           # AI client simulation
    └── validations.ts        # Input validation (Zod)
```

> See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (we use v24.x)
- **npm** 10+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/remark-pm.git
cd remark-pm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Initialize the database (optional — for auth features)
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the Marketing Board.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection string | `file:./dev.db` |
| `NEXTAUTH_SECRET` | NextAuth.js encryption secret | *(generate one)* |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3000` |
| `DEFAULT_PASSWORD` | Default user password for seeding | `changeme-on-first-login` |

---

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Branching strategy (Git Flow)
- Pull request workflow
- Code standards and conventions
- Commit message format

### Quick Start for Contributors

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git add .
git commit -m "feat: description of your change"

# Push and create a pull request
git push origin feature/your-feature-name
```

> See [docs/branching-strategy.md](docs/branching-strategy.md) for our full branching workflow.

---

## 📁 Project Structure

```
remark-pm/
├── src/                  # Source code
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # Reusable React components
│   ├── context/          # React Context providers
│   └── lib/              # Business logic & stores
├── prisma/               # Database schema & seed
├── public/               # Static assets
├── docs/                 # Project documentation
├── .env.example          # Environment template
├── CONTRIBUTING.md       # Contribution guidelines
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── next.config.ts        # Next.js configuration
```

---

## 🛣️ Roadmap

- [ ] Database-backed persistence (replace localStorage)
- [ ] Real-time collaboration (WebSocket/SSE)
- [ ] Role-based access control (RBAC)
- [ ] File upload & cloud storage
- [ ] Email notifications
- [ ] Mobile-responsive design improvements
- [ ] Analytics dashboard
- [ ] API documentation (Swagger/OpenAPI)
- [ ] End-to-end testing (Playwright)
- [ ] CI/CD pipeline (GitHub Actions)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<p align="center">
  Built with ❤️ by <strong>Remark Agency</strong>
</p>
