# Tech Stack

## Architecture
- **Framework:** Next.js (App Router) for both Frontend and Backend APIs.
- **Language:** TypeScript.
- **Styling:** Vanilla CSS (per system guidelines).
- **Database:** SQLite (using `better-sqlite3` and `drizzle-orm` or `prisma` for type safety).
- **AI Integration:** `ollama` (Node.js SDK) connecting to a local Ollama server.
- **Form Handling:** React Hook Form.

## Reasoning (Atlas)
- **Next.js:** Provides a cohesive full-stack environment that is easy to run locally via `npm run dev` or `npm start`.
- **SQLite:** Perfect for a single-user local application. Zero configuration, persistent, and fast.
- **Ollama:** Meets the requirement for a local AI agent to preserve privacy while analyzing leads and drafting replies.
- **Vanilla CSS:** Ensures long-term maintainability without dependency on specific utility class frameworks.