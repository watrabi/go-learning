// lesson 3 toys: a for loop you can step through, and a switch that shows its working

document.addEventListener("DOMContentLoaded", function () {
    // ---------- loop stepper ----------
    const loop = document.getElementById("loop-toy");
    if (loop) {
        const pre = loop.querySelector("pre.go");
        golearn.paint(pre);
        const lines = pre.querySelectorAll(".code-lines > span");
        const slot = function (name) { return loop.querySelector('[data-slot="' + name + '"]'); };
        const nInput = loop.querySelector("#loop-n");
        const playBtn = loop.querySelector('[data-act="play"]');

        let steps = [];
        let at = -1;
        let timer = null;

        // work out every step up front, then stepping is just moving a finger along the list
        function plan(n) {
            const s = [];
            s.push({ line: 0, phase: "init", i: 0, note: "i := 0 runs once, before anything else." });
            for (let i = 0; ; i++) {
                const ok = i < n;
                s.push({ line: 0, phase: "check", i: i, cond: ok, note: "Is " + i + " < " + n + "? " + (ok ? "Yes, so run the body." : "No, so the loop is over.") });
                if (!ok) break;
                const even = i % 2 === 0;
                s.push({ line: 1, phase: "body", i: i, cond: ok, note: i + " % 2 is " + (i % 2) + ", so " + (even ? "the if branch runs." : "the else branch runs.") });
                s.push({ line: even ? 2 : 4, phase: "body", i: i, cond: ok, print: i + " " + (even ? "even" : "odd"), note: "Print it." });
                s.push({ line: 0, phase: "post", i: i + 1, cond: ok, note: "End of the body. i++ makes i " + (i + 1) + ", then back to the check." });
            }
            s.push({ line: 7, phase: "after", i: null, print: "done", note: "Out of the loop. i is gone too: it only existed inside the for." });
            return s;
        }

        function reset() {
            stop();
            const n = Math.max(1, Math.min(8, parseInt(nInput.value, 10) || 1));
            nInput.value = n;
            steps = plan(n);
            at = -1;
            lines.forEach(function (l) { l.classList.remove("is-on"); });
            slot("out").textContent = "";
            slot("i").textContent = "-";
            slot("cond").textContent = "-";
            slot("phase").textContent = "ready";
            slot("note").textContent = "Press Step.";
            const track = slot("track");
            track.innerHTML = "";
            for (let k = 0; k < n; k++) {
                const c = document.createElement("span");
                c.className = "cell";
                c.innerHTML = "<small>" + (k === 0 ? "i =" : "") + "</small>" + k;
                track.appendChild(c);
            }
        }

        function step() {
            if (at >= steps.length - 1) { stop(); return false; }
            const s = steps[++at];
            lines.forEach(function (l, k) { l.classList.toggle("is-on", k === s.line); });
            slot("phase").textContent = s.phase;
            slot("i").textContent = s.i === null ? "(gone)" : s.i;
            slot("cond").textContent = s.cond === undefined ? "-" : String(s.cond);
            slot("note").textContent = s.note;
            if (s.print) slot("out").textContent += s.print + "\n";
            slot("track").querySelectorAll(".cell").forEach(function (c, k) {
                c.classList.toggle("is-in", k === s.i && s.phase !== "after");
                c.classList.toggle("is-ghost", s.i !== null && k < s.i && s.phase !== "init");
            });
            if (at >= steps.length - 1) stop();
            return true;
        }

        function stop() {
            clearInterval(timer);
            timer = null;
            playBtn.textContent = "Play";
        }

        loop.addEventListener("click", function (e) {
            const act = e.target.closest("[data-act]");
            if (!act) return;
            if (act.dataset.act === "step") { stop(); if (at >= steps.length - 1) reset(); step(); }
            if (act.dataset.act === "reset") reset();
            if (act.dataset.act === "play") {
                if (timer) { stop(); return; }
                if (at >= steps.length - 1) reset();
                playBtn.textContent = "Pause";
                step();
                timer = setInterval(step, golearn.reduced.matches ? 400 : 700);
            }
        });
        nInput.addEventListener("change", reset);
        reset();
    }

    // ---------- switch ----------
    const sw = document.getElementById("switch-toy");
    if (!sw) return;
    const pre = sw.querySelector("pre.go");
    golearn.paint(pre);
    const lines = pre.querySelectorAll(".code-lines > span");
    const out = sw.querySelector('[data-slot="out"]');
    const note = sw.querySelector('[data-slot="note"]');
    const days = sw.querySelector('[data-slot="days"]');
    // which case line covers which day, and the line that prints for it
    const CASES = [
        { line: 1, match: ["sat", "sun"], print: 2, says: "weekend" },
        { line: 3, match: ["fri"], print: 4, says: "nearly weekend" },
        { line: 5, match: null, print: 6, says: "weekday" }
    ];
    let run = 0;

    async function pick(day) {
        const me = ++run;  // clicking again cancels the older run
        days.querySelectorAll("button").forEach(function (b) { b.classList.toggle("watr-btn--quiet", b.textContent !== day); });
        out.textContent = "";
        const light = function (k) { lines.forEach(function (l, j) { l.classList.toggle("is-on", j === k); }); };
        for (const c of CASES) {
            light(c.line);
            if (c.match === null) {
                note.textContent = "Nothing matched \"" + day + "\", so default runs.";
            } else if (c.match.indexOf(day) >= 0) {
                note.textContent = "\"" + day + "\" matches. This case runs, and the switch stops here. Nothing below gets checked.";
            } else {
                note.textContent = "Is \"" + day + "\" one of " + c.match.map(function (m) { return "\"" + m + "\""; }).join(", ") + "? No, next case.";
                await golearn.wait(650);
                if (me !== run) return;
                continue;
            }
            await golearn.wait(500);
            if (me !== run) return;
            light(c.print);
            out.textContent = c.says;
            return;
        }
    }

    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].forEach(function (d) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "watr-btn watr-btn--small watr-btn--quiet";
        b.textContent = d;
        b.addEventListener("click", function () { pick(d); });
        days.appendChild(b);
    });
    note.textContent = "Pick a day.";
});
