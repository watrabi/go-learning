# go learning

A small static site for learning Go: eight short lessons, each with interactive toys, "predict the output" puzzles and a quiz. Built on the [watr style](https://github.com/WatrLabs/watr-style).

Open `index.html` in a browser, or serve the folder with anything (`npx http-server .`, `python3 -m http.server`). No build step, no dependencies. To host it, turn on GitHub Pages for this repo (deploy from the default branch, root folder).

## lessons

| # | page | toys |
| --- | --- | --- |
| 1 | `basics.html` | click-a-line anatomy of hello world, a pretend terminal for the `go` command |
| 2 | `variables.html` | zero value explorer, a tiny type checker for `x := ...` |
| 3 | `control.html` | for loop stepper, switch matcher |
| 4 | `functions.html` | follow an error through `div()`, the defer stack |
| 5 | `collections.html` | slice visualizer (len, cap, append growth, shared arrays), map playground |
| 6 | `pointers.html` | memory diagram with arrows, copy vs pointer calls |
| 7 | `types.html` | value vs pointer receivers, "does it satisfy Shape?" |
| 8 | `concurrency.html` | goroutines racing with a WaitGroup, channel simulator with blocking |

Plus `quiz.html` (12 random questions from every lesson), `cheatsheet.html` (filterable, sortable) and `404.html`.

Passing a lesson's quiz (70%) marks it done in the sidebar. Progress and the theme choice live in `localStorage`, so they stay in that browser.

## files

- `kit/`: a copy of watr-style v0.5 (`watr.css`, `watr.js`, blob images), vendored so the site doesn't change when the kit does
- `css/site.css`: the knobs (hue 150, chroma 1.15, heading weight 800) plus code blocks, quizzes and the toys
- `js/site.js`: sidebar, progress, theme toggle, Go syntax highlighting, quiz and predict-the-output engines
- `js/quizzes.js`: every quiz question. add one here and it shows up on its lesson and in the final quiz
- `js/toys/*.js`: one file per lesson's interactive bits

Animations respect `prefers-reduced-motion`: steps still happen, they just don't wait.
