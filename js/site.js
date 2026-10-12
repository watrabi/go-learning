// go learning: the shared bits. sidebar, progress, theme, go highlighting, quizzes, predict boxes.
// every page loads this after kit/watr.js and js/quizzes.js. no build step, no dependencies,
// no regrets (some regrets)

(function () {
    const LESSONS = [
        { id: "basics",      file: "basics.html",      title: "hello, go",            blurb: "Packages, main, and running your first program." },
        { id: "variables",   file: "variables.html",   title: "variables and types",  blurb: "var, :=, zero values and the basic types." },
        { id: "control",     file: "control.html",     title: "if, for, switch",      blurb: "The one loop Go has, and how to branch." },
        { id: "functions",   file: "functions.html",   title: "functions and errors", blurb: "Multiple returns, errors as values, defer." },
        { id: "collections", file: "collections.html", title: "slices and maps",      blurb: "Arrays, slices, append, and maps." },
        { id: "pointers",    file: "pointers.html",    title: "pointers",             blurb: "Addresses, & and *, and why copies matter." },
        { id: "types",       file: "types.html",       title: "structs and interfaces", blurb: "Your own types, methods, and implicit interfaces." },
        { id: "concurrency", file: "concurrency.html", title: "goroutines and channels", blurb: "go, chan, select and sync.WaitGroup." }
    ];
    const PASS = 0.7;
    const STORE = "golearn:scores";

    // ---------- storage. private mode can throw, so everything is wrapped ----------
    function load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (err) { return fallback; }
    }
    function save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* fine, we just forget */ }
    }

    function scores() { return load(STORE, {}); }
    function isDone(id) { const s = scores()[id]; return !!s && s.best >= PASS; }
    function record(id, right, total) {
        const all = scores();
        const ratio = total ? right / total : 0;
        const prev = all[id] || { best: 0 };
        all[id] = { best: Math.max(prev.best, ratio), last: ratio };
        save(STORE, all);
        renderSide();
        renderPath();
    }

    // ---------- theme: system by default, the bar button forces one ----------
    function applyTheme(theme) {
        if (theme) document.documentElement.dataset.theme = theme;
        else delete document.documentElement.dataset.theme;
    }
    function currentTheme() {
        return document.documentElement.dataset.theme ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    applyTheme(load("golearn:theme", null));

    function wireTheme() {
        document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
            const label = function () { btn.textContent = currentTheme() === "dark" ? "light" : "dark"; };
            label();
            btn.addEventListener("click", function () {
                const next = currentTheme() === "dark" ? "light" : "dark";
                applyTheme(next);
                save("golearn:theme", next);
                label();
            });
        });
    }

    // ---------- sidebar ----------
    function here() {
        const file = location.pathname.split("/").pop() || "index.html";
        return file;
    }

    function renderSide() {
        const nav = document.querySelector("[data-lesson-nav]");
        if (!nav) return;
        nav.innerHTML = "";
        LESSONS.forEach(function (lesson, i) {
            const a = document.createElement("a");
            a.href = lesson.file;
            if (here() === lesson.file) a.setAttribute("aria-current", "page");
            const name = document.createElement("span");
            name.textContent = (i + 1) + ". " + lesson.title;
            a.appendChild(name);
            if (isDone(lesson.id)) {
                const tick = document.createElement("span");
                tick.className = "watr-side__count";
                tick.textContent = "done";
                a.appendChild(tick);
            }
            nav.appendChild(a);
        });

        const done = LESSONS.filter(function (l) { return isDone(l.id); }).length;
        const meter = document.querySelector("[data-progress]");
        if (meter) { meter.value = done; meter.max = LESSONS.length; }
        const text = document.querySelector("[data-progress-text]");
        if (text) text.textContent = done + " of " + LESSONS.length;

        document.querySelectorAll("[data-side-extra] a").forEach(function (a) {
            if (a.getAttribute("href") === here()) a.setAttribute("aria-current", "page");
        });
    }

    // the home page's big list of lessons
    function renderPath() {
        const list = document.querySelector("[data-path]");
        if (!list) return;
        list.innerHTML = "";
        LESSONS.forEach(function (lesson) {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = lesson.file;
            const words = document.createElement("span");
            const b = document.createElement("b");
            b.textContent = lesson.title;
            const p = document.createElement("span");
            p.className = "muted";
            p.textContent = lesson.blurb;
            words.append(b, p);
            const tag = document.createElement("span");
            tag.className = "watr-tag" + (isDone(lesson.id) ? " watr-tag--bright" : "");
            tag.textContent = isDone(lesson.id) ? "done" : "start";
            a.append(words, tag);
            li.appendChild(a);
            list.appendChild(li);
        });
    }

    // previous / next buttons at the bottom of a lesson
    function renderLessonNav() {
        const holder = document.querySelector("[data-lesson-steps]");
        if (!holder) return;
        const i = LESSONS.findIndex(function (l) { return l.file === here(); });
        if (i < 0) return;
        if (i > 0) {
            const prev = document.createElement("a");
            prev.className = "watr-btn watr-btn--quiet";
            prev.href = LESSONS[i - 1].file;
            prev.textContent = "← " + LESSONS[i - 1].title;
            holder.appendChild(prev);
        }
        const next = document.createElement("a");
        next.className = "watr-btn";
        next.href = i < LESSONS.length - 1 ? LESSONS[i + 1].file : "quiz.html";
        next.textContent = (i < LESSONS.length - 1 ? LESSONS[i + 1].title : "final quiz") + " →";
        holder.appendChild(next);
    }

    // ---------- go highlighting. a regex, not a parser. it's fine. it's a learning site ----------
    const TOKENS = new RegExp([
        "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",                                  // 1 comment
        "(\"(?:\\\\.|[^\"\\\\\\n])*\"|`[^`]*`|'(?:\\\\.|[^'\\\\\\n])*')",          // 2 string / rune
        "\\b(\\d+(?:\\.\\d+)?)\\b",                                                // 3 number
        "\\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|nil|true|false|iota)\\b", // 4 keyword
        "\\b(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|string|bool|byte|rune|error|any|make|len|cap|append|new|panic|recover|close|copy|delete|min|max)\\b", // 5 builtin
        "\\b([A-Za-z_]\\w*)(?=\\()"                                                // 6 call
    ].join("|"), "g");
    const CLASSES = [null, "tok-c", "tok-s", "tok-n", "tok-k", "tok-t", "tok-f"];

    function esc(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function highlight(src) {
        let out = "";
        let last = 0;
        src.replace(TOKENS, function (match) {
            const groups = Array.prototype.slice.call(arguments, 1, 7);
            const offset = arguments[7];
            out += esc(src.slice(last, offset));
            const which = groups.findIndex(function (g) { return g !== undefined; }) + 1;
            out += '<span class="' + CLASSES[which] + '">' + esc(match) + "</span>";
            last = offset + match.length;
            return match;
        });
        return out + esc(src.slice(last));
    }

    // strips the shared indent so code can sit nicely indented inside the html
    function dedent(text) {
        const lines = text.replace(/^\n+|\s+$/g, "").split("\n");
        const indents = lines.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^ */)[0].length; });
        const cut = indents.length ? Math.min.apply(null, indents) : 0;
        return lines.map(function (l) { return l.slice(cut); }).join("\n");
    }

    // <pre class="go">. add data-lines to wrap each line in a span (the steppers light them up)
    function paint(pre) {
        if (pre.dataset.painted) return;
        pre.dataset.painted = "1";
        const src = dedent(pre.textContent);
        if (pre.hasAttribute("data-lines")) {
            pre.innerHTML = '<code class="code-lines">' + src.split("\n").map(function (line) {
                return "<span>" + (highlight(line) || " ") + "</span>";
            }).join("") + "</code>";
        } else {
            pre.innerHTML = "<code>" + highlight(src) + "</code>";
        }
    }

    // ---------- quizzes ----------
    function shuffle(list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function pickQuestions(box) {
        const bank = window.QUIZZES || {};
        const id = box.dataset.quiz;
        if (id !== "mixed") return (bank[id] || []).map(function (q) { return Object.assign({ from: id }, q); });
        // the final quiz: a few from every lesson, shuffled
        const count = parseInt(box.dataset.count || "12", 10);
        let all = [];
        Object.keys(bank).forEach(function (key) {
            all = all.concat(bank[key].map(function (q) { return Object.assign({ from: key }, q); }));
        });
        return shuffle(all).slice(0, count);
    }

    function inlineCode(text) {
        // `backticks` in quiz text become <code>
        return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>");
    }

    function buildQuiz(box) {
        const id = box.dataset.quiz;
        const questions = pickQuestions(box);
        if (!questions.length) return;
        box.innerHTML = "";
        box.classList.add("watr-panel");

        const form = document.createElement("form");
        questions.forEach(function (q, qi) {
            const set = document.createElement("fieldset");
            set.className = "quiz__q";
            const legend = document.createElement("legend");
            legend.innerHTML = '<span class="watr-tag watr-tag--deep">' + (qi + 1) + "</span>" + inlineCode(q.q);
            set.appendChild(legend);

            if (q.code) {
                const pre = document.createElement("pre");
                pre.className = "go";
                pre.textContent = q.code;
                paint(pre);
                set.appendChild(pre);
            }

            const opts = document.createElement("div");
            opts.className = "quiz__opts";
            // shuffle the options but remember which one is right
            const order = shuffle(q.options.map(function (_, i) { return i; }));
            order.forEach(function (oi) {
                const label = document.createElement("label");
                label.className = "watr-check";
                const input = document.createElement("input");
                input.type = "radio";
                input.name = "q" + qi;
                input.value = String(oi);
                const span = document.createElement("span");
                span.innerHTML = inlineCode(q.options[oi]);
                label.append(input, span);
                opts.appendChild(label);
            });
            set.appendChild(opts);

            const msg = document.createElement("div");
            msg.hidden = true;
            set.appendChild(msg);
            form.appendChild(set);
        });

        const foot = document.createElement("div");
        foot.className = "quiz__foot";
        const check = document.createElement("button");
        check.className = "watr-btn";
        check.textContent = "Check answers";
        const again = document.createElement("button");
        again.type = "button";
        again.className = "watr-btn watr-btn--quiet";
        again.textContent = id === "mixed" ? "New questions" : "Try again";
        again.hidden = true;
        const score = document.createElement("span");
        score.className = "quiz__score";
        score.setAttribute("aria-live", "polite");
        foot.append(check, again, score);
        form.appendChild(foot);
        box.appendChild(form);

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            let right = 0;
            let answered = 0;
            const missed = [];
            questions.forEach(function (q, qi) {
                const set = form.querySelectorAll(".quiz__q")[qi];
                const picked = form.querySelector('input[name="q' + qi + '"]:checked');
                const msg = set.querySelector("div:last-child");
                set.querySelectorAll(".watr-check").forEach(function (l) {
                    const v = Number(l.querySelector("input").value);
                    l.classList.toggle("is-right", v === q.answer);
                    l.classList.toggle("is-wrong", !!picked && v === Number(picked.value) && v !== q.answer);
                    l.querySelector("input").disabled = true;
                });
                const ok = picked && Number(picked.value) === q.answer;
                if (picked) answered++;
                if (ok) right++;
                else if (missed.indexOf(q.from) < 0) missed.push(q.from);
                msg.hidden = false;
                msg.className = ok ? "watr-msg watr-msg--info" : picked ? "watr-msg" : "watr-msg watr-msg--warning";
                msg.innerHTML = (ok ? "<b>Right.</b> " : picked ? "<b>Not quite.</b> " : "<b>Skipped.</b> ") + inlineCode(q.why || "");
            });

            check.hidden = true;
            again.hidden = false;
            score.textContent = right + " of " + questions.length + " right";

            const passed = right / questions.length >= PASS;
            if (id !== "mixed") {
                record(id, right, questions.length);
                if (passed) watr.toast(right + " of " + questions.length + ". Lesson marked done.");
                else watr.toast(right + " of " + questions.length + ". You need " + Math.ceil(PASS * questions.length) + " to finish the lesson. Reread the bits in red and try again.", { type: "warning", time: 7000 });
            } else {
                box.dispatchEvent(new CustomEvent("quizdone", { detail: { right: right, total: questions.length, missed: missed } }));
            }
            if (answered === 0) score.textContent += " (you didn't pick anything)";
        });

        again.addEventListener("click", function () { buildQuiz(box); box.scrollIntoView({ block: "start" }); });
    }

    // ---------- predict the output ----------
    // <div class="predict" data-answer="3 2 1"> with a pre.go inside. answers are compared with
    // whitespace squashed, and data-also="a|b" lists other accepted answers
    function buildPredict(box) {
        const accepted = [box.dataset.answer].concat(box.dataset.also ? box.dataset.also.split("|") : [])
            .map(function (a) { return a.replace(/\s+/g, " ").trim().toLowerCase(); });

        const row = document.createElement("form");
        row.className = "watr-row";
        const input = document.createElement("input");
        input.placeholder = "what does it print?";
        input.setAttribute("aria-label", "your answer");
        input.autocomplete = "off";
        input.spellcheck = false;
        const check = document.createElement("button");
        check.className = "watr-btn";
        check.textContent = "Check";
        const reveal = document.createElement("button");
        reveal.type = "button";
        reveal.className = "watr-btn watr-btn--quiet";
        reveal.textContent = "Show answer";
        row.append(input, check, reveal);

        const msg = document.createElement("div");
        msg.hidden = true;
        box.append(row, msg);

        const why = box.dataset.why ? " " + box.dataset.why : "";
        row.addEventListener("submit", function (e) {
            e.preventDefault();
            const guess = input.value.replace(/\s+/g, " ").trim().toLowerCase();
            msg.hidden = false;
            if (!guess) {
                msg.className = "watr-msg watr-msg--warning";
                msg.textContent = "Type what you think it prints first.";
            } else if (accepted.indexOf(guess) >= 0) {
                msg.className = "watr-msg watr-msg--info";
                msg.innerHTML = "<b>Right.</b>" + inlineCode(why);
            } else {
                msg.className = "watr-msg";
                msg.textContent = "Not that. Trace it line by line, or press Show answer.";
            }
        });
        reveal.addEventListener("click", function () {
            msg.hidden = false;
            msg.className = "watr-msg watr-msg--info";
            msg.innerHTML = "It prints <code>" + esc(box.dataset.answer) + "</code>." + inlineCode(why);
        });
    }

    function setup() {
        wireTheme();
        renderSide();
        renderPath();
        renderLessonNav();
        document.querySelectorAll("pre.go").forEach(paint);
        document.querySelectorAll("[data-quiz]").forEach(buildQuiz);
        document.querySelectorAll(".predict[data-answer]").forEach(buildPredict);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
    else setup();

    // ---------- for the toys ----------
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
    // a pause between animation steps. with reduced motion the steps still happen, just without the wait
    function wait(ms) {
        return new Promise(function (done) { setTimeout(done, REDUCED.matches ? 0 : ms); });
    }
    // replays a css animation class on an element
    function flash(el, cls) {
        cls = cls || "is-flash";
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
    }

    window.golearn = { LESSONS: LESSONS, paint: paint, highlight: highlight, esc: esc, scores: scores, isDone: isDone, wait: wait, flash: flash, reduced: REDUCED };
})();
