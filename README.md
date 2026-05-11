# Obsidian GitHub Image Uploader

Paste or drop any image into a note — the plugin uploads it to your GitHub repo and replaces it with a [jsDelivr](https://www.jsdelivr.com/) CDN link, automatically.

No PicGo. No background process. Just a token.

## Features

- 📋 **Paste & drop** — works with screenshots and image files
- ⚡ **jsDelivr CDN** — your images get served from a global CDN, not raw GitHub
- 🪶 **Tiny** — ~6 KB bundle, zero runtime dependencies
- 📱 **Cross-platform** — works on desktop and mobile (no helper app needed)
- 🧪 **Test command** — one-click verification of your token & repo

## How it works

```
paste image  →  insert ![uploading-xxx]() placeholder  →
PUT /repos/:owner/:repo/contents/:path (GitHub Contents API)  →
replace placeholder with ![](https://cdn.jsdelivr.net/gh/owner/repo@branch/path)
```

If the upload fails, the placeholder is removed and an error toast is shown.

## Install

### Manual install (until accepted into the community plugin store)

1. Download `main.js` and `manifest.json` from the latest [Release](../../releases).
2. Create the folder `<your-vault>/.obsidian/plugins/github-image-uploader/`.
3. Drop both files into it.
4. Open Obsidian → **Settings → Community plugins** → turn off Restricted mode if you haven't already → enable **GitHub Image Uploader**.

### Build from source

```bash
git clone https://github.com/n1k0ver3E/obsidian-image-uploader
cd obsidian-image-uploader
npm install
npm run build
# Copy main.js + manifest.json into <your-vault>/.obsidian/plugins/github-image-uploader/
```

## Setup

1. **Create a public GitHub repo** as your image bed (e.g., `my-image-bed`). It must be public — jsDelivr does not serve private repos.
2. **Create a Personal Access Token** at [github.com/settings/tokens](https://github.com/settings/tokens) (classic). Scope: only `repo` is required.
3. **Open the plugin's settings tab** and fill in:

   | Field | Value |
   |---|---|
   | Owner | Your GitHub username |
   | Repo | The image bed repo name |
   | Branch | Default branch (`main` or `master`) |
   | Token | The PAT you just created |
   | Path prefix | Subfolder inside the repo (e.g., `img` or `obsidian/2026`) — optional |

4. Open the command palette (`Cmd/Ctrl + P`) → run **GitHub Image Uploader: Test GitHub connection**. You should see an "OK" notice with the latest commit SHA.

5. Paste a screenshot into any note. Done.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `401 / 403` | Token is invalid, expired, or missing the `repo` scope |
| `404` | Owner / repo / branch is misspelled, or the repo is private |
| `422` | A file with the same name already exists (very rare — filenames include timestamp + random suffix) |
| Image link 404s in browser | jsDelivr can take a minute to cache new files on first request — refresh after ~60 s |
| Nothing happens on paste | Open Developer Tools (`Cmd/Ctrl + Opt + I`) → Console, look for `[GitHub Image Uploader]` errors |

## Security

- Your token is stored in `<vault>/.obsidian/plugins/github-image-uploader/data.json` **in plain text**. Anything that can read your vault can read your token.
- If you sync your vault to a third party (iCloud, Dropbox, etc.), be aware the token rides along.
- For shared vaults, use a fine-grained token scoped only to your image bed repo.

## License

MIT
