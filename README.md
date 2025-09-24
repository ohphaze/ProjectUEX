ProjectUEX Discord Bot

Overview

- Discord bot scaffold to surface UEX (https://uexcorp.space/) account listings in Discord.
- Pluggable UEX client with safe configuration and clear auth options.
- Starts with a stub command (`/uex listings`) and ready-to-wire data fetch.

Important Notes

- The UEX site appears protected by Cloudflare anti-bot. Direct HTTP scraping without an official API or session cookies will likely fail.
- Preferred: use an official API or token if UEX offers one (contact UEX for developer access). If an API exists, wire it into `bot/uex/http_client.py`.
- Alternative: supply authenticated cookies (from your browser) as an environment variable. This is brittle and may expire. Only use on your own machine; do not share cookies.
- Last resort: headless browser automation (e.g., Playwright) to log in and scrape. This may violate site terms; use only if permitted by UEX and at your own risk.

What’s implemented now

- Discord bot with `/uex listings` command.
- Config via `.env` (Discord token, base URL, cookie string placeholder).
- UEX client interface with two backends:
  - `CookieHTTPClient` (placeholder: ready for wiring once endpoint is known)
  - `MockClient` (returns sample listings for testing)

Quick Start

1) Create and invite a Discord bot
   - Create an application at https://discord.com/developers/applications
   - Add a Bot, copy the bot token
   - Enable Message Content intent (not strictly required for slash commands, but handy)
   - Invite the bot to your server with the proper scopes (bot + applications.commands)

2) Local setup
   - Python 3.10+
   - Create a virtualenv and install deps:
     - `python -m venv .venv`
     - `./.venv/Scripts/activate` (Windows) or `source .venv/bin/activate` (macOS/Linux)
     - `pip install -r requirements.txt`

3) Configure `.env`
   - Copy `.env.example` to `.env` and set:
     - `DISCORD_TOKEN=your_discord_bot_token`
     - `UEX_BASE_URL=https://uexcorp.space` (default)
     - `UEX_AUTH_MODE=mock` (start with mock, see below)
     - If you later use cookies: set `UEX_COOKIE_HEADER` to the full Cookie header value from your logged-in browser (see notes below).

4) Run the bot
   - `python -m bot.bot`
   - In Discord, use `/uex listings` to see mocked listings.

Switching to real data later

Option A: Official API (recommended)
 - If UEX provides an API and token-based auth, add the endpoint(s) in `bot/uex/http_client.py` and set `UEX_AUTH_MODE=cookie_http` (or a new `api_token` mode) along with required env vars (e.g., `UEX_API_TOKEN`).

Option B: Cookie-based HTTP (works if Cloudflare/session allows)
 - Export your current browser Cookie header when viewing your UEX account listings page.
   - Example format: `cf_clearance=...; uex_session=...; other=...`
 - Put that entire string into `UEX_COOKIE_HEADER` in `.env`.
 - Set `UEX_AUTH_MODE=cookie_http`.
 - Update `fetch_listings()` in `bot/uex/http_client.py` with the correct URL and parsing of the JSON/HTML the site returns. Share a sample response or the listings page HTML and I can wire this for you.

Option C: Headless browser (Playwright) [only if allowed]
 - This logs in and scrapes like a real browser. Only use with UEX’s permission.
 - Not implemented here to keep the scaffold lean. If you want this path, I can add a Playwright client that logs in using `UEX_EMAIL`/`UEX_PASSWORD` and scrapes listings.

Security Guidance

- Do NOT hardcode credentials in code. Use environment variables.
- Keep `.env` out of version control.
- If you share this bot with others, do not accept passwords in Discord messages. Prefer OAuth or API tokens.
- Cookies grant account access—treat them like passwords.

Files

- `requirements.txt` — Python deps for the bot.
- `bot/bot.py` — Discord bot entry with slash commands.
- `bot/config.py` — Configuration handling.
- `bot/uex/base.py` — Client interface and dataclasses.
- `bot/uex/http_client.py` — Cookie-based HTTP client (placeholder fetch).
- `bot/uex/mock_client.py` — Mock data for development.

Next Steps (for me to wire up)

- If you can provide: (a) API documentation, or (b) the specific endpoint(s) the site calls for listings, or (c) a saved HTML/JSON sample of your listings page, I’ll implement `fetch_listings()` and the parsing immediately.

