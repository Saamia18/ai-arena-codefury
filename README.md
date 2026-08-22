# AI Arena

**Find the AI model that fits your mission.**

AI Arena is a gamified AI model discovery and evaluation platform built for **CodeFury 9.0**. Instead of choosing a model from a generic leaderboard, users complete an AI Quest, receive a personalized AI DNA profile, compare contenders in an Arena, and receive an explainable recommendation with a Match Score, Trust Score, and Model Passport.

## Mission

Choosing an AI model is often reduced to popularity or isolated benchmark numbers. AI Arena makes the decision personal and explainable by matching model strengths to what a user values most: **Accuracy, Speed, Cost, Privacy, and Ease of Use**.

## Key Features

- **AI Quest** — five-question, one-question-per-screen flow that produces a weighted AI DNA profile.
- **AI DNA** — SVG radar visualization, ranked priority summary, and five-dimension progress bars.
- **Arena** — contender leaderboard, Match Scores, model metrics, selectable head-to-head battle, prompt input, and response/latency comparison.
- **Recommended for You** — prominent winner treatment tied to the user’s AI DNA dimensions.
- **Explainable Result** — Trust Score, per-dimension trust evidence, winner explanation, and expandable runner-up reasons.
- **Model Passport** — a shareable result record with scores, AI DNA, use cases, ranking, download, share, and copy-link actions.
- **Deployment Configuration** — adjustable temperature and token settings with generated JavaScript, Python, and cURL starter configurations.
- **My Passports** — filterable archive of previous Quest and Arena decisions.
- **Ask AI** — floating demo chatbot for AI DNA, recommendation, scores, Arena results, and alternatives.
- **Theme and responsive design** — light mode by default, persisted dark mode, responsive layouts, animations, and transitions.

## How the Recommendation Works

1. **Quest → AI DNA** — Quest answers are converted on the backend into normalized weights for Accuracy, Speed, Cost, Privacy, and Ease of Use.
2. **Arena → Match Score** — backend Arena ranking uses a deterministic weighted-sum calculation against the user’s AI DNA. The ranking is not chosen by an LLM.
3. **Result → Trust Score** — a separate backend Trust Score combines model dimensions and evidence quality.
4. **Explanation** — Groq generates concise natural-language winner explanations. Groq is also used for supported live-battle responses; it does not determine ranking.
5. **Passport** — the saved result can be revisited as a Model Passport and carried into the deployment configuration screen.

## User Flow

```text
Home → Login / Sign Up → AI Quest → AI DNA → Arena → Result → Model Passport → Deployment → History
```

The main product flow includes a global journey indicator:

```text
01 Quest → 02 DNA → 03 Arena → 04 Result → 05 Passport → 06 Deploy
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| Frontend styling | Custom CSS design system with CSS custom properties |
| Backend | Next.js 16 App Router API routes, TypeScript |
| Database | MongoDB via the official MongoDB driver |
| Authentication | `bcryptjs`, signed JWT session cookie with `jose` |
| AI | Groq SDK using `openai/gpt-oss-120b` |

## Architecture

```text
.
├─ app/api/                 # Next.js backend API routes
├─ data/                    # Model catalogue data
├─ lib/                     # Auth, MongoDB, scoring, history, Groq integration
├─ scripts/                 # Database seed script
├─ types/                   # Shared backend API/domain types
├─ frontend/                # React + Vite client application
│  └─ src/
│     ├─ components/        # Navigation, journey indicator, Ask AI
│     ├─ layouts/           # Shared application shell
│     ├─ pages/             # Home and product-flow screens
│     ├─ routes/            # Client-side routes
│     └─ services/          # API boundary and mock services
└─ package.json             # Next.js backend scripts and dependencies
```

## API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/signup` | POST | Create an account and session |
| `/api/auth/login` | POST | Log in and create a session |
| `/api/auth/logout` | POST | Clear the session |
| `/api/auth/me` | GET | Get the current user |
| `/api/quest/submit` | POST | Convert Quest answers into an AI DNA profile |
| `/api/quest/history` | GET | Get authenticated user Quest history |
| `/api/models` | GET | Get the model catalogue |
| `/api/arena/rank` | POST | Rank models against AI DNA weights |
| `/api/arena/test` | POST | Run a two-model live test |
| `/api/result/trust-score` | POST | Calculate the Trust Score |
| `/api/result/explain` | POST | Generate the winner explanation |
| `/api/result/why-not` | POST | Generate runner-up explanations |
| `/api/results` | GET, POST | List or save authenticated user results |
| `/api/results/:id` | GET | Get one saved Model Passport |
| `/api/health` | GET | Health check |

## Setup

### Prerequisites

- Node.js (current LTS recommended)
- MongoDB instance for persistence
- Groq API key for explanations and supported live tests

### 1. Start the backend

```bash
git clone <repository-url>
cd ai-arena-codefury
npm install
npm run dev
```

The Next.js backend runs at `http://localhost:3000` by default.

### 2. Start the frontend

In a second terminal:

```bash
cd ai-arena-codefury/frontend
npm install
npm run dev
```

The Vite frontend runs at `http://localhost:5173` by default.

For local development, leave `VITE_API_BASE_URL` unset: Vite proxies `/api/*` to `http://localhost:3000`.

### Optional: seed the model catalogue

```bash
cd ai-arena-codefury
npm run db:seed
```

## Environment Variables

Create a root `.env` file based on `.env.example`:

```env
MONGODB_URI=<your MongoDB connection string>
AUTH_SECRET=<long random signing secret>
GROQ_API_KEY=<your Groq API key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For a separately deployed frontend, set this in `frontend/.env`:

```env
VITE_API_BASE_URL=<backend origin>
```

When frontend and backend are on different origins, configure the backend deployment for credentialed cross-origin requests and cookies.

## Authentication

The frontend submits Login and Sign Up forms to the backend and sends credentials with API requests. The backend hashes passwords with `bcryptjs` and creates a seven-day HTTP-only JWT session cookie using `jose`.

The backend protects saved results, individual passports, and history endpoints. Frontend session restoration, logout controls, and protected client-side routes are future work.

## AI Integration

Groq is used with `openai/gpt-oss-120b` to produce concise winner explanations and supported Arena live-test responses. Model ranking remains a deterministic backend calculation.

The current live-test adapter is configured for the `openai-gpt-4o` catalogue ID; other models return a clearly marked fallback response.

## Current Frontend Integration

Already connected from the frontend:

- Authentication: sign up and login
- Quest submission
- Result Trust Score, winner explanation, and runner-up explanations
- Saving a result
- Loading a saved passport by ID

The Arena leaderboard/live battle, History archive, and Ask AI use mock presentation data today. They are structured for later integration with the existing model, Arena, history, and AI APIs.

## Testing and Quality Checks

No automated test suite is currently configured in the repository.

Available frontend checks:

```bash
cd frontend
npm run build
npm run lint
```

## Deployment

The backend is configured for standalone Next.js output. Deploy the Next.js service with its required environment variables and deploy the Vite frontend separately if desired. When deployed on separate origins, configure `VITE_API_BASE_URL` and backend CORS/cookie behavior accordingly.

## Team

| Name | Role |
| --- | --- |
| _Your name_ | Frontend / UI-UX |
| _Teammate name_ | Backend |

## Future Scope

- Connect Arena ranking, model catalogue, live test, and History screens to their existing backend endpoints.
- Add frontend session restoration, logout, and protected routes.
- Persist Quest-to-Passport journey state across refreshes and deep links.
- Ground Ask AI in the current user’s real Quest and result data.
- Replace mock deployment configuration with provider-backed deployment integration.
- Add automated tests and a not-found route.

---

Built for **CodeFury 9.0**.
