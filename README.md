# ShopSmart Frontend

A clean React chat interface for the Amazon Electronics Agentic RAG backend.

Built with **React 19 + TypeScript + Vite + Tailwind CSS 4**.

## Run locally

The backend must be running on port `8002` first.

```powershell
# Terminal 1 — backend
cd C:\Users\Anurag\OneDrive\Desktop\coading\amazon_ecommerce
uv run uvicorn api.app:app --host 127.0.0.1 --port 8002 --reload
```

Or, if you use Docker Compose:

```powershell
cd C:\Users\Anurag\OneDrive\Desktop\coading\amazon_ecommerce
docker compose up --build -d
```

Then start the frontend:

```powershell
cd C:\Users\Anurag\OneDrive\Desktop\coading\frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

## API connection

During development, the app calls `/api/*` and Vite proxies it to FastAPI:

```text
Browser → http://localhost:5173/api/rag
Vite    → http://localhost:8002/rag
```

This is configured in `vite.config.ts` and means **no CORS changes are needed for local development**.

For production, put Nginx in front of the Vite build and proxy `/api/` to the API container.

If you want to call FastAPI directly, add CORS middleware to the backend and set:

```ini
VITE_API_URL=http://localhost:8002
```

Do not put OpenAI or LangSmith keys in this frontend. Only the API URL belongs here.

## Implemented

- Chat UI with Markdown answers and suggestion prompts
- Product cards under assistant answers
- "Add" on a product card sends a conversational add-to-bag request through `/rag`
- Slide-in shopping bag drawer with item count, quantities, images, and subtotal
- Chat and bag persistence in `localStorage`
- FastAPI health indicator with 30-second polling
- Loading stages, error states, retry action, and copy-answer button
- Responsive layout and keyboard-accessible drawer
- Amazon product image fallback when an image is unavailable
- Local conversation ID reused across refreshes

## Current API limitations

These are intentional notes for the next backend iteration, not frontend bugs:

1. **The bag is read-only from the UI.** Items are added or removed by asking the assistant. There are no `POST /cart/items`, `PATCH`, or `DELETE` endpoints yet.
2. **Product cards have no `product_id`.** `used_context` currently returns only `image_url`, `price`, and `description`. The Add button therefore sends a chat prompt rather than a direct cart request.
3. **`thread_id` is also the cart ID.** Starting a new chat in the header creates a new thread and therefore a new empty bag.
4. **There is no conversation-history endpoint.** Messages are persisted in the browser; the LangGraph memory lives in Postgres but is not exposed for loading into the UI.
5. **There is no streaming endpoint yet.** The assistant loading stages are a client-side experience while the synchronous `/rag` request is running.
6. **Feedback is not wired up.** The API currently returns `trace_id: null`, so LangSmith feedback would not be recorded.
7. **No cart refresh endpoint.** On a fresh browser or another device, the bag appears empty until the next `/rag` response.

## Recommended backend follow-ups

- Add `product_id`, `title`, `average_rating`, and `currency` to `used_context`, and deduplicate products per turn.
- Add cart endpoints: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{product_id}`, `DELETE /cart/items/{product_id}`.
- Return a real LangSmith run ID and fix `/submit_feedback`.
- Add `POST /rag/stream` with SSE stage events, then optionally token streaming.
- Add `GET /conversations/{thread_id}` for cross-device history.
- Separate `user_id`, `conversation_id`, and `cart_id`; add auth before exposing this publicly.

## Scripts

```powershell
npm run dev      # Vite dev server on 5173
npm run build    # Typecheck + production build
npm run preview  # Preview the production build
npm run lint     # oxlint
```

## Structure

```text
src/
  components/
    CartDrawer.tsx      Slide-in bag panel
    ChatWorkspace.tsx   Scroll area + composer
    Composer.tsx        Auto-growing input
    EmptyState.tsx      Welcome screen and suggestions
    Header.tsx          Brand, API status, new chat, bag button
    Markdown.tsx        Sanitized Markdown renderer
    MessageBubble.tsx   User/assistant messages, products, feedback actions
    ProductCard.tsx     Product result card
    ProductImage.tsx    Image with fallback
    ThinkingIndicator.tsx
  hooks/
    useChat.ts          Chat state, requests, retry, persistence
  lib/
    api.ts              FastAPI client
    format.ts           Price, cart, and title formatting
    storage.ts          Versioned localStorage helpers
    types.ts            API and UI types
```

## Local data

The app stores data under:

```text
shopsmart.chat.v1
```

Clear site storage to start completely fresh.
