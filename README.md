# Obsidian GitHub Image Uploader

[中文](README.zh-CN.md) · **English**

Paste or drop any image into a note — the plugin uploads it to your GitHub repo and replaces it with a [jsDelivr](https://www.jsdelivr.com/) CDN link, automatically.

**No PicGo. No background process. Just a token.**

## Features

- 📋 Paste & drop — works with screenshots and image files
- ⚡ jsDelivr CDN — images served from a global CDN, not raw GitHub
- 🪶 Tiny — ~8 KB bundle, zero runtime dependencies
- 📱 Cross-platform — desktop and mobile (no helper app needed)
- 🧪 Built-in command — `Test GitHub connection` verifies your setup in one click

## How it works

```
paste image to file →  insert ![uploading-xxx]() placeholder
                    →  PUT /repos/:owner/:repo/contents/:path  (GitHub Contents API)
                    →  replace placeholder with ![](https://cdn.jsdelivr.net/gh/owner/repo@branch/path)
```

If the upload fails, the placeholder is removed and an error toast is shown.

---

## Install

### Option A — Release (recommended)

1. Go to the [latest Release](../../releases/latest) and download **`main.js`** and **`manifest.json`**.
2. Create the folder `<your-vault>/.obsidian/plugins/github-image-uploader/`.
3. Drop both files into it.

### Option B — build from source

```bash
git clone https://github.com/n1k0ver3E/obsidian-image-uploader
cd obsidian-image-uploader
npm install
npm run build
# Copy main.js + manifest.json into <your-vault>/.obsidian/plugins/github-image-uploader/
```

---

## What you need to do (after the files are in place)

> Obsidian doesn't auto-enable plugins, so you have to do this part by hand once.

### 1. Enable community plugins in Obsidian

- Open **Settings → Community plugins**.
- If you've never used a community plugin, you'll see a **"Turn on community plugins"** button (the so-called Restricted Mode). Click it and confirm Obsidian's safety prompt.

### 2. Enable this plugin

- In the **Installed plugins** list, find **GitHub Image Uploader** and flip the toggle on.

### 3. Fill in the settings

Click the gear icon next to the plugin name. You should see a panel like this:

<p align="center">
  <img src="docs/settings.png" alt="GitHub Image Uploader settings panel" width="720" />
</p>

Fill in:

| Field | Value |
|---|---|
| **Owner** | Your GitHub username |
| **Repo** | The repo to use as image bed — **must be public** for jsDelivr to work |
| **Branch** | Default branch of the repo (`main` or `master`) |
| **Token** | A classic Personal Access Token from [github.com/settings/tokens](https://github.com/settings/tokens) — scope: only `repo` |
| **Path prefix** | Subfolder inside the repo, e.g. `img` or `obsidian/2026`. Leave empty to upload to the repo root. |

![img](https://cdn.jsdelivr.net/gh/n1k0ver3E/myPrivateIMGBed@main/img/1778498879814-nmd01g.png)

> 💡 Don't have a bed repo yet? Create a new **public** repo on GitHub first (any name, empty is fine — the plugin will create files in it).

### 4. Smoke test

1. Open the command palette (`Cmd/Ctrl + P`) → run **GitHub Image Uploader: Test GitHub connection**. You should see an "OK" notice with the latest commit SHA. If not, check the troubleshooting table below.
2. Open any note. Take a screenshot and paste it with `Cmd/Ctrl + V`. You should see:
   - First, a placeholder `![uploading-xxx]()` at the cursor.
   - A second later, the placeholder is replaced with `![](https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>)`.
3. Check your GitHub repo — there should be a new commit with the uploaded file.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Nothing happens on paste | Open Developer Tools (`Cmd/Ctrl + Opt + I`) → Console, look for `[GitHub Image Uploader]` errors |
| `401` / `403` | Token is invalid, expired, or missing the `repo` scope |
| `404` | Owner / repo / branch is misspelled, or the repo is private |
| `422` | A file with the same name already exists (rare — filenames include timestamp + random suffix) |
| Image link 404s in the browser | jsDelivr can take up to ~60 s to cache new files on first request — wait and refresh |
| Mobile paste doesn't work | Some clipboard sources on iOS/Android don't expose image bytes to Obsidian. Try dropping a file from a file picker instead. |

---

## Security

- Your token is stored in `<vault>/.obsidian/plugins/github-image-uploader/data.json` **in plain text**. Anything that can read your vault can read your token.
- If you sync your vault to a third party (iCloud, Dropbox, Git, etc.), the token rides along. Consider `.gitignore`-ing the file if your vault is in Git.
- For shared vaults, use a [fine-grained token](https://github.com/settings/personal-access-tokens) scoped to only your image bed repo.

---

## License

MIT — see [LICENSE](LICENSE).
