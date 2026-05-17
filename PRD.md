# Bawarchi – Product Requirements Document

## Overview

Bawarchi is an iOS app that converts recipes from multiple input formats into an interactive, step-by-step cooking experience. Users can import recipes from videos, YouTube links, images, audio, PDFs, and URLs, then cook through them hands-free with voice navigation and smart timers.

---

## Input Sources

Users can add a recipe via any of the following:

| Source  | Interaction              |
|---------|--------------------------|
| YouTube | Link via text popup      |
| URL     | Link via text popup      |
| Video   | File picker              |
| PDF     | File picker              |
| Image   | File picker              |
| Audio   | File picker              |

---

## Core Features

### 1. Recipe Extraction
- Parses any supported input into a structured recipe.
- Output includes:
  - Recipe name
  - Ingredients list (with quantities)
  - Ordered steps

### 2. Recipe Library
- All saved recipes are stored and associated with the user's account post-login.
- 3 recipes can be created without login (trial mode).

### 3. Interactive Cooking Mode
- Step-by-step checklist view.
- Only the active step is in full focus; previous/upcoming steps are blurred and visually smaller.
- Steps with durations have an inline timer with a play button.
- Checking a step advances to the next.
- Final step is labelled **Finish** — checking it exits interactive mode.
- **Screen stays on** throughout interactive mode (no auto-lock).
- *(V1)* **Voice mode:** Touchless navigation via voice commands during interactive mode.

### 4. Parallel Mode *(V1)*
- For advanced users to identify and run parallelisable tasks simultaneously.
- Example: boiling chickpeas + sautéing paneer + chopping onions in parallel lanes.

### 5. Authentication
- Google Sign-In
- Apple Sign-In
- Skip option available (up to 3 trial recipes)

---

## Screens

### 1. Launch / Loading *(V1)*
- Custom full-screen loading animation (not a spinner).

### 2. Onboarding *(V1)*
- Tutorial cards explaining how the app works.
- Notice that 3 free trials are available without login.

### 3. Login Screen
- Google and Apple sign-in buttons.
- "Skip for now" option in the top right.

### 4. Recipe List (Home)
- Displays the user's saved recipes.
- **Empty state:** Curly arrow pointing to the bottom-right `+` button.
- Each recipe card shows:
  - Recipe name / thumbnail
  - *(V1)* Optional tiny icons: ❤️ Favorite, ✅ Cooked Before
- *(V1)* Swipe right → toggle cooked / uncooked
- *(V1)* Swipe left → toggle favorite
- *(V1)* Filter button (top right) with options: Cooked / Uncooked / Favorite
- Floating `+` button (bottom right) to add a new recipe.
  - Tapping `+` reveals source options above it: **YouTube · Video · PDF · Link · Image · Audio**
  - YouTube / Link → text field popup to enter a URL
  - Rest → native file picker

### 5. Recipe Processing
- Full-screen loading animation while the recipe is being extracted (not a spinner).

### 6. Recipe Detail Page
- Displays the full structured recipe (ingredients + steps).
- Back button returns to the Recipe List, with the new recipe now visible.
- Floating **Play** button (bottom right) to enter Interactive Mode.
- `+` button remains visible in the bottom right.

### 7. Interactive Mode
- Full-screen step checklist.
- Active step: full size, fully visible.
- Other steps: blurred and smaller.
- Steps with durations: inline timer + play button.
- Checking a step → moves focus to the next step.
- Final step: **Finish** → exits interactive mode on check.
- Screen lock disabled for the duration.
- *(V1)* Voice commands for hands-free navigation.

### 8. Parallel Mode *(V1)*
- Multi-lane view showing tasks that can be done simultaneously.
- Each lane has its own step progress and timers.

---

## Technical Stack

### Frontend
- **Framework:** React Native + Expo
  - Expo handles the iOS build toolchain and provides native APIs (file picker, screen wake lock) without requiring Xcode for day-to-day development.
- **Navigation:** React Navigation
- **API communication:** REST + JSON (via `fetch` or `axios`)
- *(V1)* **Voice:** Expo Speech / `@react-native-voice/voice`

### Backend
- **Language:** Python
- **Framework:** FastAPI
  - Input validation via Pydantic models (built into FastAPI).
  - Auto-generates OpenAPI / Swagger docs out of the box.
- **API style:** REST, JSON
- **Hosting:** Railway (~$5/month, always-on, simple deploys)

### Database
- **Engine:** PostgreSQL
- **Hosting:** Supabase (free tier; includes Postgres + management UI + automatic backups + connection pooling)

### Auth
- **Provider:** Supabase Auth
  - Handles Google OAuth and Apple Sign-In out of the box.
  - Issues JWTs on login; FastAPI verifies these on every protected request via Supabase's public JWKS endpoint.

### File / Media Storage
- Supabase Storage (built on S3) for any files that need to be persisted server-side.
- In practice, most inputs are processed on-device and only extracted text is sent to the backend — so storage needs are minimal.

---

## Recipe Extraction Architecture

### Principle
All pre-processing happens **on-device**. The backend receives plain text and returns a structured recipe. Raw media files are never uploaded.

### Client-side pre-processing by input type

| Input   | On-device method                                      | Sent to backend   | Notes                                                                 |
|---------|-------------------------------------------------------|-------------------|-----------------------------------------------------------------------|
| YouTube | YouTube API (transcript fetch)                        | Transcript text   | Auto-generated transcripts may be noisy; show error if unavailable   |
| Audio   | `SFSpeechRecognizer` (Apple Speech framework)         | Transcript text   | On-device since iOS 16; long files may need chunking                 |
| Video   | `AVFoundation` (audio extraction) + `SFSpeechRecognizer` | Transcript text | Same pipeline as audio after extraction                              |
| PDF     | `PDFKit` (text extraction)                            | Extracted text    | Text-based PDFs only; scanned PDFs fall back to OCR via Vision       |
| Image   | `Vision` framework (`VNRecognizeTextRequest`)         | OCR text          | Handles recipe cards, cookbook photos, screenshots                   |
| URL     | **Server-side** (fetch + HTML parsing)                | —                 | Backend scrapes, cleans, and passes text directly to the AI pipeline |

### Backend AI extraction pipeline

The backend exposes a single endpoint that accepts extracted text and returns a structured `Recipe` object. The AI layer is built around a modular provider interface — the active provider is injected via config and can be swapped without touching business logic.

```
POST /api/extract
Body: { "text": "...", "source_type": "youtube" | "audio" | ... }
Response: Recipe (name, ingredients[], steps[])
```

**Provider interface (Strategy pattern):**

```python
class AIProvider(ABC):
    @abstractmethod
    async def extract_from_text(self, text: str) -> Recipe: ...

    @abstractmethod
    async def extract_from_image(self, image_bytes: bytes) -> Recipe: ...
```

Concrete adapters (`OpenAIAdapter`, `AnthropicAdapter`, `GeminiAdapter`, etc.) implement this interface. The `ExtractionService` depends only on `AIProvider` — never on a concrete adapter.

URL inputs follow the same pipeline but have an additional server-side step before reaching the AI:
```
URL → backend fetches + strips HTML → plain text → AI provider → Recipe
```

---

## API Reference

All endpoints require `Authorization: Bearer <jwt>` — the JWT issued by Supabase Auth after login.

Base URL: `http://localhost:8000` (local) / Railway URL (prod)

---

### Recipes

#### `POST /api/recipe`
Create a recipe from extracted text or a URL.

For text-based sources (youtube, audio, video, pdf, image), the client pre-processes the input on-device and sends the resulting text. For URL sources, the backend fetches and parses the page itself.

**Request body**
```json
{
  "recipe_text": "string (required if no recipe_url)",
  "recipe_url": "string (required if no recipe_text)",
  "source_type": "youtube | audio | video | pdf | image | url (required if recipe_text is provided)"
}
```

**Response `200`**
```json
{
  "id": "uuid",
  "name": "string",
  "cooking_time": "integer (ms) | null",
  "ingredients": [
    { "name": "string", "quantity": "string", "unit": "tsp | tbsp | cup | ml | l | g | kg | oz | lb | piece | pinch | clove | slice" }
  ],
  "recipe_steps": [
    { "step": "string", "time": "integer (ms) | null" }
  ]
}
```

---

#### `GET /api/recipe`
List all recipes for the authenticated user.

**Query params**

| Param | Default | Constraints |
|---|---|---|
| `page` | 1 | ≥ 1 |
| `limit` | 20 | 1–100 |
| `offset` | 0 | ≥ 0 |

**Response `200`**
```json
{
  "recipes": [ /* array of Recipe (same shape as POST response) */ ],
  "page": 1,
  "limit": 20,
  "offset": 0,
  "total": 42
}
```

---

#### `GET /api/recipe/{id}`
Get a single recipe by ID. Returns 404 if not found or belongs to another user.

**Response `200`** — Recipe (same shape as POST response)

---

#### `DELETE /api/recipe/{id}`
Delete a recipe. Returns 404 if not found or belongs to another user.

**Response `204`** — No content

---

### Users

#### `PUT /api/users/preferences`
Update preferences for the authenticated user.

**Request body**
```json
{
  "mode": "dark | light"
}
```

**Response `200`** — No body

---

### Auth flow (frontend)

```
1. Call supabase.auth.signInWithOAuth({ provider: "google" })
   → Browser redirects to Google, then back to your app
2. Supabase SDK automatically parses the session from the redirect URL
3. Call supabase.auth.getSession() to retrieve the JWT
4. Store the JWT and attach it to every backend request:
   Authorization: Bearer <jwt>
5. JWTs expire after 1 hour — use supabase.auth.onAuthStateChange()
   to get a refreshed token automatically
```

---

## V0 vs V1 Scope

| Feature                               | Version |
|---------------------------------------|---------|
| Recipe extraction (all input types)   | V0      |
| Recipe list + detail page             | V0      |
| Interactive cooking mode              | V0      |
| Inline timers                         | V0      |
| Screen stays on during cooking        | V0      |
| 3-trial guest mode                    | V1      |
| Google + Apple login                  | V0      |
| Full-screen loading animation         | V1      |
| Onboarding / tutorial cards           | V1      |
| Favorite & cooked icons on cards      | V1      |
| Swipe gestures on recipe list         | V1      |
| Filter (cooked / uncooked / favorite) | V1      |
| Voice mode (hands-free navigation)    | V1      |
| Parallel cooking mode                 | V1      |

---

## Database Schema

### `public.users`
Created automatically via a Supabase trigger when a user first signs in (row inserted into `auth.users`).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, FK → `auth.users.id` |
| `created_at` | timestamp | |
| `preferences` | jsonb | e.g. `{ "theme": "dark" }` |

### `public.recipes`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `public.users.id` |
| `name` | text | |
| `ingredients` | jsonb | List of `{ name, quantity, unit }` |
| `steps` | jsonb | List of `{ step, time? }` (time in ms) |
| `cooking_time` | int | Total cooking time in ms, nullable |
| `cooked` | bool | Default false |
| `favorite` | bool | Default false |
| `created_at` | timestamp | |

---

## Out of Scope (for now)
- Social / sharing features
- Nutritional information
- Web version
- Push notifications
