# Free Resume Tailoring with Ollama (Llama 3)

Run a **free**, private Llama 3 model to tailor your resume to a job description — no API keys, no cost. There are now **three** ways to use it:

1. **Automated cloud (recommended, zero setup)** — pick **Ollama / Llama 3** in the Generate tab. When you click **Generate**, the website triggers a GitHub Actions workflow that spins up a fresh runner, installs Ollama, runs Llama 3, tailors your resume, commits the result, and **self-destructs**. A live progress card shows each step. See [Automated cloud flow](#automated-cloud-flow-no-server).
2. **From the command line** — run `scripts/ollama-generate.js` (or `scripts/ollama-actions-generate.js`) to batch-generate tailored resumes inside a Codespace or any machine with Ollama.
3. **Local server (advanced)** — run `OLLAMA_ORIGINS='*' ollama serve` on your own machine and point the app at it (legacy mode).

Because GitHub Actions runners are **free** and **deleted automatically** when the job ends, you pay nothing and there is nothing to clean up.

---

## Automated cloud flow (no server)

This is the fully automated "create a node → run Ollama → commit → self-destruct" pipeline, driven entirely from the website.

### One-time setup
1. Create a **fine-grained GitHub Personal Access Token** at <https://github.com/settings/tokens?type=beta>, scoped to the `resume-engine-pro` repository, with:
   - **Actions** → Read & write
   - **Contents** → Read & write
   (Or a classic token with the `repo` + `workflow` scopes.)
2. In the app, open **Settings → Ollama / Llama 3 (cloud)**, paste the token, confirm the owner/repo and model (`llama3.2` is fast on the free CPU runner), and **Save**.

### Each time you generate
1. Pick a profile and paste the job description.
2. Select **Ollama / Llama 3** as the AI provider and click **Generate**.
3. Watch the live progress card. Behind the scenes the `ollama-resume.yml` workflow:
   - installs Ollama (`curl -fsSL https://ollama.com/install.sh | sh`),
   - pulls the model (`ollama pull llama3.2`),
   - runs `scripts/ollama-actions-generate.js` to tailor your resume to the JD,
   - commits the result to `generated/<run_id>.json`,
   - and the runner is destroyed automatically.
4. The app fetches the committed JSON and builds your PDF / Word / Portfolio locally.

> Notes: workflow inputs are capped (~28KB resume text, ~6KB JD) to stay within GitHub's limit. The token lives only in your browser (obfuscated in localStorage) — keep it scoped to this one repo. Larger models like `llama3` (8B) work but run slower on the free runner.

---

## Codespaces / CLI procedure (alternative)

If you prefer to run it yourself in a disposable Codespace:

### 1. Launch a Codespace
From your repository on GitHub: **Code ▸ Codespaces ▸ Create codespace on master**.

### 2. Install & run Ollama
In the Codespace terminal:

```bash
curl -fsSL https://ollama.com/install.sh | sh
# Allow the browser app to reach the server, then start it in the background:
OLLAMA_ORIGINS='*' ollama serve > ollama.log 2>&1 &
```

### 3. Pull the model
```bash
ollama pull llama3
```

### 4a. Generate from the command line
Put your existing resume(s) and the job description in text files, then:

```bash
node scripts/ollama-generate.js \
  --resume my-resume.txt \
  --resume older-resume.txt \
  --jd job-description.txt \
  --out output/tailored-resume.json \
  --model llama3
```

This writes a tailored `tailored-resume.json` and a readable `tailored-resume.md`.
Pass multiple `--resume` files to give the model more data points to curate from.

Commit the results if you want them in your repo:

```bash
git add output/ && git commit -m "Add tailored resume" && git push
```

### 4b. Or use it from the web app
1. In the Codespace, forward **port 11434** and set its visibility to **Public**
   (PORTS tab ▸ right-click 11434 ▸ Port Visibility ▸ Public).
2. Copy the forwarded URL and add `/v1/chat/completions` to the end.
3. In the app: **Settings ▸ Ollama / Llama 3**, paste that URL as the endpoint, model `llama3`, **Save**.
4. On the **Generate** tab, choose **Ollama / Llama 3** and generate as usual.

> Running Ollama on your **own machine** instead? Skip Codespaces: install Ollama,
> run `OLLAMA_ORIGINS='*' ollama serve`, and the app's default
> `http://localhost:11434/v1/chat/completions` endpoint works out of the box.

### 5. Delete the node (stop being billed)
In your **GitHub Codespaces dashboard**, click **Stop** (or **Delete**) on the Codespace.
The environment is wiped from the cloud and your free-hour usage stops.

---

## Notes
- `OLLAMA_ORIGINS='*'` is required so the browser app (a different origin) can call the server. For tighter security, set it to your exact site origin instead of `*`.
- Larger models (`llama3:70b`) give better results but need more RAM/time; `llama3` (8B) is a good free default.
- All processing is local to your Codespace/machine — your resume data never leaves it.
