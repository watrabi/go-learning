// lesson 8 toys: three goroutines racing to finish, and a channel simulator with blocking

document.addEventListener("DOMContentLoaded", function () {
    wgToy();
    chanToy();
});

function wgToy() {
    const toy = document.getElementById("wg-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    const NAMES = ["ana", "bo", "cy"];
    const bars = {};
    NAMES.forEach(function (name) {
        const row = document.createElement("div");
        row.className = "worker";
        const label = document.createElement("code");
        label.textContent = name;
        const bar = document.createElement("progress");
        bar.className = "watr-progress";
        bar.max = 100;
        bar.value = 0;
        bar.setAttribute("aria-label", name + " progress");
        row.append(label, bar);
        slot("workers").appendChild(row);
        bars[name] = bar;
    });
    let run = 0;

    toy.querySelector('[data-act="run"]').addEventListener("click", function () {
        const me = ++run;
        const out = slot("out");
        const noWait = slot("nowait").checked;
        out.textContent = "";
        // every goroutine gets a random amount of work, like real life where you can't predict it
        const plan = NAMES.map(function (name) { return { name: name, ms: 600 + Math.random() * 1800 }; });
        const fast = golearn.reduced.matches;
        const start = performance.now();
        let finished = 0;
        NAMES.forEach(function (n) { bars[n].value = 0; });

        if (noWait) {
            // main doesn't wait: it prints and returns while the workers have barely started
            setTimeout(function () {
                if (me !== run) return;
                out.textContent = "all done\n\n(program exited)";
                slot("note").textContent = "Without wg.Wait(), main reached the end straight away and the program exited, taking the goroutines with it. None of them got to print.";
                NAMES.forEach(function (n) { bars[n].value = Math.min(bars[n].value, 8); });
            }, fast ? 0 : 120);
            const tick0 = function () {
                if (me !== run) return;
                const t = performance.now() - start;
                NAMES.forEach(function (n) { bars[n].value = Math.min(8, t / 15); });
                if (t < 120) requestAnimationFrame(tick0);
            };
            if (!fast) requestAnimationFrame(tick0);
            return;
        }

        slot("note").textContent = "Running. main is blocked in wg.Wait().";
        const tick = function () {
            if (me !== run) return;
            const t = performance.now() - start;
            plan.forEach(function (p) {
                const pct = fast ? 100 : Math.min(100, (t / p.ms) * 100);
                if (bars[p.name].value < 100 && pct >= 100) {
                    finished++;
                    out.textContent += p.name + " finished\n";
                }
                bars[p.name].value = pct;
            });
            if (finished < NAMES.length) {
                requestAnimationFrame(tick);
            } else {
                out.textContent += "all done\n";
                const order = out.textContent.trim().split("\n").slice(0, 3).map(function (l) { return l.split(" ")[0]; });
                slot("note").textContent = "This time the order was " + order.join(", ") + ". The goroutines were started ana, bo, cy, but that says nothing about who finishes first. \"all done\" always comes last, because wg.Wait() held main back.";
            }
        };
        if (fast) {
            plan.sort(function (a, b) { return a.ms - b.ms; });
        }
        requestAnimationFrame(tick);
    });
}

function chanToy() {
    const toy = document.getElementById("chan-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    const capSel = toy.querySelector("#chan-cap");
    let cap, buffer, senders, receivers, next, gid;

    function reset() {
        cap = parseInt(capSel.value, 10);
        buffer = [];
        senders = [];    // { g, v } goroutines stuck on ch <- v
        receivers = [];  // { g } goroutines stuck on <-ch
        next = 1;
        gid = 1;
        slot("decl").textContent = cap ? "make(chan int, " + cap + ")" : "make(chan int)";
        slot("out").textContent = "";
        slot("note").textContent = cap ? "There's room for " + cap + " values before a sender has to wait." :
            "Unbuffered: no room at all. Every send has to wait for a receive, and the other way round.";
        render();
    }

    function log(line) {
        const out = slot("out");
        out.textContent += line + "\n";
        out.scrollTop = out.scrollHeight;
    }

    function chip(text) {
        const c = document.createElement("span");
        c.className = "cell is-stuck";
        c.textContent = text;
        return c;
    }

    function render(flash) {
        const buf = slot("buffer");
        buf.innerHTML = "";
        if (cap === 0) {
            const c = chip("no buffer");
            c.className = "cell is-ghost";
            buf.appendChild(c);
        }
        for (let i = 0; i < cap; i++) {
            const c = document.createElement("span");
            c.className = "cell" + (i < buffer.length ? " is-in" : "");
            c.innerHTML = "<small>" + (i === 0 ? "next out" : "") + "</small>" + (i < buffer.length ? buffer[i] : "");
            if (flash === "buf" + i) golearn.flash(c);
            buf.appendChild(c);
        }
        const s = slot("senders");
        s.innerHTML = "";
        senders.forEach(function (x) { s.appendChild(chip("g" + x.g + ": ch <- " + x.v)); });
        if (!senders.length) s.innerHTML = '<span class="muted">nobody</span>';
        const r = slot("receivers");
        r.innerHTML = "";
        receivers.forEach(function (x) { r.appendChild(chip("g" + x.g + ": <-ch")); });
        if (!receivers.length) r.innerHTML = '<span class="muted">nobody</span>';
    }

    function send() {
        const v = next++;
        const g = gid++;
        if (receivers.length) {
            // someone was already waiting: hand it straight over
            const r = receivers.shift();
            log("g" + g + " sent " + v + " straight to g" + r.g + ", which was waiting");
            slot("note").textContent = "A receiver was already waiting, so the value goes directly to it. Both goroutines carry on.";
            render();
            return;
        }
        if (buffer.length < cap) {
            buffer.push(v);
            log("g" + g + " sent " + v + " into the buffer and moved on");
            slot("note").textContent = "There was room in the buffer, so the sender didn't wait at all. " + (cap - buffer.length) + " slot" + (cap - buffer.length === 1 ? "" : "s") + " left.";
            render("buf" + (buffer.length - 1));
            return;
        }
        senders.push({ g: g, v: v });
        log("g" + g + " wants to send " + v + " but is blocked");
        slot("note").textContent = cap ? "The buffer is full, so this sender is stuck until someone receives." :
            "No buffer and nobody receiving, so this sender waits. It'll stay stuck until a receive comes along.";
        render();
    }

    function recv() {
        const g = gid++;
        if (buffer.length) {
            const v = buffer.shift();
            let extra = "";
            if (senders.length) {
                // a slot opened up, so the first stuck sender gets to drop its value in
                const s = senders.shift();
                buffer.push(s.v);
                extra = " That freed a slot, so g" + s.g + " finally sent " + s.v + " and got unstuck.";
                log("g" + g + " received " + v + "; g" + s.g + " unblocked and put " + s.v + " in the buffer");
            } else {
                log("g" + g + " received " + v);
            }
            slot("note").textContent = "Values come out in the order they went in." + extra;
            render(extra ? "buf" + (buffer.length - 1) : undefined);
            return;
        }
        if (senders.length) {
            const s = senders.shift();
            log("g" + g + " received " + s.v + " straight from g" + s.g + ", which was waiting");
            slot("note").textContent = "A sender was waiting, so the two meet and the value passes across directly. That's an unbuffered channel's whole job.";
            render();
            return;
        }
        receivers.push({ g: g });
        log("g" + g + " wants to receive but is blocked");
        slot("note").textContent = "Nothing to receive, so this goroutine waits. Send something.";
        render();
    }

    toy.addEventListener("click", function (e) {
        const b = e.target.closest("[data-act]");
        if (!b) return;
        if (b.dataset.act === "send") send();
        if (b.dataset.act === "recv") recv();
        if (b.dataset.act === "reset") reset();
    });
    capSel.addEventListener("change", reset);
    reset();
}
