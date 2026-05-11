import {
  App,
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';

interface Settings {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  pathPrefix: string;
}

const DEFAULTS: Settings = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  pathPrefix: 'img',
};

export default class GithubImageUploader extends Plugin {
  settings: Settings = DEFAULTS;

  async onload() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
    this.addSettingTab(new SettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on(
        'editor-paste',
        (evt: ClipboardEvent, editor: Editor, _info: MarkdownView | MarkdownFileInfo) => {
          this.handle(evt.clipboardData?.files, evt, editor);
        },
      ),
    );

    this.registerEvent(
      this.app.workspace.on(
        'editor-drop',
        (evt: DragEvent, editor: Editor, _info: MarkdownView | MarkdownFileInfo) => {
          this.handle(evt.dataTransfer?.files, evt, editor);
        },
      ),
    );

    this.addCommand({
      id: 'test-github-connection',
      name: 'Test GitHub connection',
      callback: () => this.testConnection(),
    });
  }

  async testConnection() {
    const { owner, repo, branch, token } = this.settings;
    if (!owner || !repo || !token) {
      new Notice('Please configure owner/repo/token first');
      return;
    }
    new Notice('Testing GitHub connection…');
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        },
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as { name?: string; commit?: { sha?: string } };
      new Notice(`OK — ${owner}/${repo}@${data.name} (${data.commit?.sha?.slice(0, 7)})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      new Notice(`Connection failed: ${msg}`);
      console.error('[GitHub Image Uploader]', err);
    }
  }

  private handle(files: FileList | null | undefined, evt: Event, editor: Editor) {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    evt.preventDefault();
    for (const file of images) {
      void this.upload(file, editor);
    }
  }

  private async upload(file: File, editor: Editor) {
    const { owner, repo, branch, token, pathPrefix } = this.settings;
    if (!owner || !repo || !token) {
      new Notice('GitHub Image Uploader: configure owner/repo/token in settings first');
      return;
    }

    const marker = `![uploading-${Date.now()}-${Math.random().toString(36).slice(2, 6)}]()`;
    editor.replaceSelection(marker);

    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const safeExt = ext || 'png';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
      const prefix = pathPrefix.replace(/^\/+|\/+$/g, '');
      const path = prefix ? `${prefix}/${name}` : name;
      const content = await toBase64(file);

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `upload ${name} via obsidian`,
            content,
            branch,
          }),
        },
      );
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${errBody}`);
      }

      const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
      replaceMarker(editor, marker, `![](${cdnUrl})`);
      new Notice(`Uploaded ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      replaceMarker(editor, marker, '');
      new Notice(`Upload failed: ${msg}`);
      console.error('[GitHub Image Uploader]', err);
    }
  }
}

function replaceMarker(editor: Editor, marker: string, replacement: string) {
  const idx = editor.getValue().indexOf(marker);
  if (idx < 0) return;
  const from = editor.offsetToPos(idx);
  const to = editor.offsetToPos(idx + marker.length);
  editor.replaceRange(replacement, from, to);
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader returned non-string'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

class SettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: GithubImageUploader) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h3', { text: 'GitHub Image Uploader' });
    const intro = containerEl.createEl('p');
    intro.appendText('Paste or drop images in any note — they will be uploaded to your GitHub repo and replaced with a ');
    intro.createEl('a', {
      text: 'jsDelivr',
      href: 'https://www.jsdelivr.com/',
    });
    intro.appendText(' CDN URL. The repo must be public.');

    const tip = containerEl.createEl('p', { cls: 'setting-item-description' });
    tip.appendText('Need a token? Create one at ');
    tip.createEl('a', {
      text: 'github.com/settings/tokens',
      href: 'https://github.com/settings/tokens',
    });
    tip.appendText(' with the "repo" scope. After saving, run the command ');
    tip.createEl('code', { text: 'GitHub Image Uploader: Test GitHub connection' });
    tip.appendText(' from the command palette to verify.');

    const s = this.plugin.settings;
    const row = (
      name: string,
      key: keyof Settings,
      desc = '',
      secret = false,
      placeholder = '',
    ) =>
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addText((t) => {
          if (secret) t.inputEl.type = 'password';
          if (placeholder) t.setPlaceholder(placeholder);
          t.setValue(s[key]).onChange(async (v) => {
            (s as Record<keyof Settings, string>)[key] = v.trim();
            await this.plugin.saveData(s);
          });
        });

    row('Owner', 'owner', 'GitHub username or org', false, 'n1k0ver3E');
    row('Repo', 'repo', 'Must be public for jsDelivr to work', false, 'myPrivateIMGBed');
    row('Branch', 'branch', 'Default branch of the repo', false, 'main');
    row('Token', 'token', 'Personal access token with repo scope', true);
    row('Path prefix', 'pathPrefix', 'Folder inside the repo, e.g. img', false, 'img');
  }
}
