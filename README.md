# StudyPrep

A step by step study guide, written in simple English. Built with [Docusaurus](https://docusaurus.io) and published with GitHub Pages.

Live site: https://amiteshgit.github.io/StudyPrep/

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000/StudyPrep/ and edit any file in `docs/`. The page updates as you save.

## How to add content

- **A new question:** open the page in `docs/` and add a block like this under the right section:

  ```md
  ### 49. Your question here?

  **In short:** One line you can say out loud.

  More detail, and a code block if it helps.
  ```

- **A new page** (for example SQL or System Design): add a file such as `docs/sql-interview.md` with a header like the other pages, then add a link to it in `docusaurus.config.js` under `navbar.items`.

## Writing style

- Start each answer with a short **In short** line.
- Use simple words, and add a small example.
- Open each section with a line that connects it to the one before.

## Publishing

Pushes to `main` (or `master`) run `.github/workflows/deploy.yml`, which builds the site and publishes it.
One-time setup: in the repo, go to **Settings > Pages** and set **Source** to **GitHub Actions**.
