# AI M — first web prototype

A responsive Arabic/English AI chat UI, built with plain HTML, CSS, and JavaScript. No build step and no Termux required.

## Run locally
Open `public/index.html` in a browser. The chat UI works, but real AI replies are not enabled until a server endpoint is configured. Without `/api/chat`, it intentionally displays a setup message.

## Free deployment from a phone
1. Extract the ZIP.
2. Open GitHub in your phone browser and create a new repository named `ai-m`.
3. Upload the files and folders, keeping the structure:
   - `public/index.html`
   - `public/style.css`
   - `public/app.js`
   - `functions/api/chat.js` (optional secure API starter)
   - `wrangler.toml`
4. In Cloudflare, create a Pages project connected to that GitHub repository.
5. Set the build output directory to `public`. No build command is needed.
6. The current UI can be deployed as a static site. Real AI replies require a provider API key stored as a server-side secret, not in `public/app.js`.

## Secure AI endpoint
The optional `functions/api/chat.js` is a server-side starter. It does not call an AI provider until you add provider-specific code. Configure secrets in your hosting dashboard; never paste secret keys into public files or commit them to GitHub.

## Current features
- Responsive dark violet/blue design
- Arabic RTL and English LTR toggle
- New chat, recent chat list (in-memory only)
- Prompt suggestions
- Secure `/api/chat` integration point
- No external dependencies

## Important limitations
- Chats are held in browser memory only and disappear after a reload.
- AI, image generation, file uploads, login, database, and persistent memory are not connected in this first prototype.
- A Google Play developer account may require a one-time fee; publish the PWA first to avoid that cost.
