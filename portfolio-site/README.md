# Wisam's portfolio web

A static site with no build step: `index.html`, `styles.css`, `app.js`, and **`data.js` (all the content)**.

## Edit content
Everything you'd want to change is in `data.js`. Each project or role is one block. `links: [...]` draws the dashed "related" threads, and `theme` picks the colour mood (themes are defined in `app.js` → `THEMES`).

## Preview locally
```
python -m http.server 5173 --directory portfolio-site
```
Then open http://localhost:5173

## Deep links (use these in LinkedIn posts)
Every tile has its own address, and opening it zooms straight in:
- `/#/projects/dealio`
- `/#/projects/gradguides`
- `/#/projects/energy`
- `/#/projects/steeple`
- `/#/experience/medal`
- `/#/projects/rosemount`
- `/#/about/story`

Add UTM tags so Umami shows which post brought each visitor:
`https://YOUR-DOMAIN/?utm_source=linkedin&utm_medium=post&utm_campaign=dealio-launch#/projects/dealio`

## Analytics (Umami Cloud, free tier)
1. Sign up at https://cloud.umami.is → **Add website** → enter your domain.
2. Copy the **Website ID** into `index.html` (replace `REPLACE-WITH-UMAMI-WEBSITE-ID`).
3. Events you'll see under **Events**:

| Event | When it fires | Data |
|---|---|---|
| `node_open` | A tile is opened | `id`, `label`, `type`, `category`, `via` (web / list / related / link / panel / back) |
| `node_read` | Someone leaves a tile after 5 seconds or more | `id`, `seconds` (5-19 / 20-59 / 60+) |
| `contact_click` | LinkedIn, email or phone is clicked | `method`, `from` |
| `ask_open` / `ask_submit` | The "Ask me about" form is opened / sent | preset `topic` and the tile it came from (never free text or emails) |
| `view_toggle` | Someone switches to list or web view | `view` |

`node_open` tells you what people click; `node_read` tells you what they actually read.

## "Ask me about" messages
`FORM_ENDPOINT` is at the top of `app.js`. If it's empty, Send opens the visitor's email app addressed to you. To receive messages without that step, create a free form at https://formspree.io and paste its URL there.

## Hosting
GitHub Pages (free): push this folder to a repo, then go to Settings → Pages → Deploy from branch.
Custom domain: buy it (Cloudflare Registrar sells at cost, about €10 a year for .com), add a `CNAME` file containing the domain, and point DNS to GitHub Pages.
