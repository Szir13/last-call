# First prompt for Claude Code

Paste this in a new Claude Code session opened at the project root.

---

Read `CLAUDE.md`, then `docs/ARCHITECTURE.md` and `docs/REFACTOR.md`. Reply in Portuguese.

Goal: make the code easier to change without changing the game's behaviour.

1. Install the tools (`pip install -r tools/requirements.txt && playwright install chromium`) and run `python tools/reference.py` and `python tools/run_bots.py careful --months 12 --seeds 2`. Save the output as the baseline in `docs/BASELINE.md`.
2. Do refactor steps 1 and 4 from `docs/REFACTOR.md`: split `index.html` into `src/` modules with a small Node build script that still outputs a single `index.html`, and delete the dead schedule code with a save migration.
3. After each step: run `node --check` on the built script, load a fresh game and an old save (`tools/saves/` fixtures, create them from the current game) at 390x780 in dark and light with no console errors, and re-run `tools/reference.py`. Margins must stay within 50-57%.
4. Commit after each step with a short message. Do not change numbers in the economy during the refactor.
5. At the end, give me a summary of what moved where and anything that behaved differently.

Then propose the order for steps 2, 3 and 5 of `docs/REFACTOR.md` and wait for my choice.
