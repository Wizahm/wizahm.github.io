# Wisam's portfolio web

A static site with no build step: `index.html`, `styles.css`, `app.js`, and **`data.js` (all the content)**.

## Edit content
Everything you'd want to change is in `data.js`. Each project or role is one block. `links: [...]` draws the dashed "related" threads. Each section has one `theme` (colour) and `shape` that its subtopics share (themes are defined in `app.js` → `THEMES`).
At the bottom of `data.js`:
- `photos`: one free Unsplash photo per subtopic (credited automatically in the panel).
- `funFacts`: the five fun facts behind the sparkling stars.

## Exploration and fun facts
Each subtopic a visitor opens gets an arrow stuck in it, and the top bar counts how many they've explored.
A sparkling star appears in the web after 20 seconds of reading, then another every 20 to 30 seconds (5 in total), each with a short jingle. While a star waits to be clicked, a softer reminder plays at most every 15 seconds and stops after 4. If the star is out of view, a gold marker at the screen edge points to it. Visitors can mute the sounds with the speaker button. Timings are at the top of the fun-facts section in `app.js`.
Progress is saved in the visitor's own browser only. To reset yours, open the browser console and run `Portfolio.reset()`. To see the next star without waiting, run `Portfolio.showNextFact()`.

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
| `contact_click` | LinkedIn or email is clicked | `method`, `from` |
| `email_choice` | An option in the email menu is picked | `via` (gmail / outlook / mailapp / copy) |
| `ask_open` / `ask_submit` | The "Ask me about" form is opened / sent | preset `topic` and the tile it came from (never free text or emails) |
| `view_toggle` | Someone switches to list or web view | `view` |
| `tile_explored` | A new tile is opened | `id`, `count` |
| `funfact_appear` / `funfact_open` | A star appears / is clicked | `n`, `title` |
| `funfact_arrow` / `sound_toggle` | An edge marker is clicked / sound is muted or unmuted | `n`, `muted` |
| `intro_end` / `zoom` | The landing page is closed / zoom buttons are used | `how` |

`node_open` tells you what people click; `node_read` tells you what they actually read.

## "Ask me about" messages
`GOOGLE_FORM_PREFILL` at the top of `app.js` holds the Google Form link (made with `google-form-setup.gs`). The site swaps `__TOPIC__` for the topic the visitor picked. Answers land in the "Portfolio questions (responses)" Google Sheet.

## Hosting
GitHub Pages (free): push this folder to a repo, then go to Settings → Pages → Deploy from branch.
Custom domain: buy it (Cloudflare Registrar sells at cost, about €10 a year for .com), add a `CNAME` file containing the domain, and point DNS to GitHub Pages.
