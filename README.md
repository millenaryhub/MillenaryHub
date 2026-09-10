# MillenaryHub

MillenaryHub is a useful digital destination for discovering practical knowledge, free tools, resources and ideas to help people learn, build and earn.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

The production output is `dist`, ready for GitHub and Cloudflare Pages. Use `npm run build` as the build command and `dist` as the output directory.

## Project structure

- `src/data` - structured local content
- `src/App.tsx` - routes and shared application shell
- `src/styles.css` - design system and responsive styles
- `public` - static SEO files
- `functions/api/subscribe.ts` - Cloudflare Pages newsletter endpoint
- `src/components/AudioDownloaderPage.tsx` - audio search and download UI
- `functions/api/audio/search.ts` - server-side YouTube Data API adapter
- `functions/api/audio/download.ts` - server-side permitted audio stream adapter
- `functions/_services/audioDownloadService.ts` - external processing service abstraction
- `backend/app/main.py` - local FastAPI API for vocal separation
- `backend/app/services/separation.py` - Demucs service abstraction

## Brevo newsletter setup

The newsletter form posts to `/api/subscribe`. The Brevo API key is only read by the Cloudflare Pages Function and is never bundled into the frontend.

Required secret name:

```text
BREVO_API_KEY
```

In Cloudflare: open **Workers & Pages**, select the MillenaryHub Pages project, go to **Settings > Variables and Secrets**, add `BREVO_API_KEY` as an encrypted secret for Production (and Preview if needed), then redeploy. The function looks up the Brevo list named `MillenaryHub Subscribers` and adds or updates the submitted contact.

For local testing, create an uncommitted `.dev.vars` file in the project root:

```text
BREVO_API_KEY=your-local-Brevo-key
```

Build the app, then run the Pages runtime with `npx wrangler pages dev dist`. Open the local URL and submit the newsletter form. `.dev.vars` is ignored by Git and the key is only available to the local server-side function. Do not put the key in `VITE_*` variables, React code, or committed files.

## Audio Downloader setup

The `/audio-downloader` page uses the official YouTube Data API v3 through the server-side `/api/audio/search` Cloudflare Pages Function. Search requires the encrypted Cloudflare secret `YOUTUBE_API_KEY`. Never use a `VITE_` variable for it.

For local development, copy `.env.example` to an uncommitted `.dev.vars` file and add your key:

```text
YOUTUBE_API_KEY=your-youtube-data-api-key
```

Build and run the Pages runtime with `npx wrangler pages dev dist`. Search text or paste a YouTube video URL into the page. The frontend calls the server endpoint; the key is never bundled into browser JavaScript.

Audio conversion is deliberately separate because media conversion is not a good fit for Cloudflare Pages Functions and must not bypass YouTube restrictions. Add a lawful, permitted processing service as the encrypted Cloudflare variables below when you have one:

```text
MEDIA_DOWNLOAD_ENDPOINT=https://your-permitted-processing-service.example/download
MEDIA_PROVIDER_API_KEY=your-processing-service-secret
```

The processing endpoint receives `{ "url", "title", "format": "mp3", "permissionConfirmed": true }` and must return an `audio/*` response. It must only process content the user owns or has permission to download and must comply with copyright and platform terms. Until configured, search works but download requests return a clear setup message.

## Supabase Profile setup

The existing `/profile` route now uses Supabase Auth and Database while preserving the MillenaryHub profile layout. The official `@supabase/supabase-js` client persists sessions in the browser using the public anon key. Never add a service-role key to the frontend.

Required frontend variables in a local `.env.local` file or Cloudflare Pages variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Run the SQL in `supabase/schema.sql` from the Supabase SQL Editor. It creates `profiles`, `saved_items`, `recently_viewed`, and `recently_used_tools`, links profiles to `auth.users`, adds the profile creation trigger, and enables Row Level Security policies so users can only access rows where `user_id = auth.uid()`.

### Supabase dashboard steps

1. Create or open a Supabase project and copy the Project URL and public anon key into `.env.local`.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. Open **Authentication > Providers > Email**, enable email/password authentication, and choose whether email confirmation is required.
4. Open **Authentication > Providers > Google**, enable it, then add the Google OAuth Client ID and Client Secret from Google Cloud Console.
5. In Google Cloud Console, create an OAuth web client, add the Supabase callback URL shown in the Supabase provider panel, and add your local and production site URLs as authorized origins where required.
6. In Supabase **Authentication > URL Configuration**, add `http://localhost:5173/profile` and your deployed `/profile` URL to the redirect allow list.
7. Restart `npm run dev` after changing `.env.local`. The Profile page supports email sign-up/login, Google sign-in, persistent sessions, profile updates, interests, loading states, errors, and logout.

## Media and Vocal Remover setup

The main navigation now contains one **Media** item. It opens `/media`, where Audio Downloader and Vocal Remover are grouped together. Direct routes remain available at `/audio-downloader` and `/vocal-remover`.

### Start the FastAPI backend on Windows

From the project root in PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process Bypass` for the current terminal, or invoke `.venv\Scripts\python.exe` directly. Demucs also requires a working FFmpeg installation available on `PATH`; install it separately on Windows if the model reports an FFmpeg error.

### Start the React frontend

In a second terminal:

```powershell
npm install
npm run dev
```

The Vocal Remover page sends files to `http://127.0.0.1:8000` by default. To use another backend URL, create a local `.env.local` file with the non-secret setting below:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The first Demucs run downloads the selected pretrained model automatically. With `htdemucs`, the model is cached in the local PyTorch cache, usually `%USERPROFILE%\.cache\torch\hub\checkpoints` on Windows, so later runs do not need to download it again. The model and intermediate files can require several gigabytes of disk space.

### Processing limitations

The backend runs Demucs locally and does not send uploads to an external vocal-removal API. CPU processing can be slow, especially for long or high-quality tracks, and memory use depends on track length and model. A compatible NVIDIA GPU with the appropriate PyTorch build can substantially improve processing time, but the current service defaults to the selected Demucs runtime and is safe to run on CPU. Uploaded files and outputs are kept in the operating system temporary directory and expired jobs are removed after 30 minutes.
