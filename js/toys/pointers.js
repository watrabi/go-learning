// lesson 6 toys: a memory diagram with real arrows, and copy-vs-pointer function calls

document.addEventListener("DOMContentLoaded", function () {
    memToy();
    callToy();
});

function memToy() {
    const toy = document.getElementById("mem-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    const ADDR = { x: "0xc010", y: "0xc018", p: "0xc020" };
    let vars;

    function find(name) { return vars.find(function (v) { return v.name === name; }); }
    function note(t) { slot("note").textContent = t; }
    function log(line) { slot("log").textContent += line + "\n"; slot("log").scrollTop = 1e6; }
    function print(line) { slot("out").textContent += line + "\n"; slot("out").scrollTop = 1e6; }

    function reset() {
        vars = [
            { name: "x", type: "int", value: 1 },
            { name: "p", type: "*int", to: null }
        ];
        slot("log").textContent = "x := 1\nvar p *int\n";
        slot("out").textContent = "";
        note("x holds a number. p is a pointer to an int, and it starts as nil: it points at nothing.");
        render();
    }

    function render(flash) {
        const box = slot("vars");
        box.innerHTML = "";
        vars.forEach(function (v) {
            const c = document.createElement("span");
            c.className = "cell" + (v.type === "*int" ? (v.to ? " is-in" : " is-ghost") : " is-in");
            c.dataset.var = v.name;
            const text = v.type === "*int" ? (v.to ? ADDR[v.to] : "nil") : String(v.value);
            c.innerHTML = "<small>" + v.name + " " + v.type + " · " + ADDR[v.name] + "</small>" + text;
            if (flash && flash.indexOf(v.name) >= 0) golearn.flash(c);
            box.appendChild(c);
        });
        drawArrows();

        const p = find("p");
        const hasY = !!find("y");
        toy.querySelectorAll("[data-need]").forEach(function (b) {
            const need = b.dataset.need;
            b.disabled = (need === "y" && !hasY) || (need === "noy" && hasY) || (need === "p" && !p.to);
        });
    }

    // curved arrows from each pointer to whatever it points at, drawn under the boxes
    function drawArrows() {
        const svg = slot("svg");
        const mem = slot("mem");
        const base = mem.getBoundingClientRect();
        svg.setAttribute("width", base.width);
        svg.setAttribute("height", base.height);
        svg.innerHTML = '<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs>';
        vars.forEach(function (v) {
            if (v.type !== "*int" || !v.to) return;
            const from = mem.querySelector('[data-var="' + v.name + '"]');
            const to = mem.querySelector('[data-var="' + v.to + '"]');
            if (!from || !to) return;
            const a = from.getBoundingClientRect();
            const b = to.getBoundingClientRect();
            const x1 = a.left + a.width / 2 - base.left;
            const y1 = a.bottom - base.top;
            const x2 = b.left + b.width / 2 - base.left;
            const y2 = b.bottom - base.top + 4;
            const dip = 34 + Math.abs(x2 - x1) * 0.08;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M" + x1 + " " + y1 + " C " + x1 + " " + (y1 + dip) + ", " + x2 + " " + (y2 + dip) + ", " + x2 + " " + y2);
            path.setAttribute("marker-end", "url(#arrowhead)");
            svg.appendChild(path);
        });
    }

    function deref(action) {
        const p = find("p");
        if (!p.to) {
            print("panic: runtime error: invalid memory address or nil pointer dereference");
            note("p is nil, so *p has nothing to follow. In a real program this crashes. Check for nil first: if p != nil { ... }");
            golearn.flash(toy.querySelector('[data-var="p"]'));
            return null;
        }
        return action(find(p.to));
    }

    const OPS = [
        { code: "p = &x", run: function () {
            find("p").to = "x";
            note("&x is x's address. p now holds it, so p points at x.");
            render(["p"]);
        } },
        { code: "*p = 10", run: function () {
            deref(function (target) {
                target.value = 10;
                note("*p = 10 follows the arrow and writes to " + target.name + ". p itself didn't change.");
                render([target.name]);
            });
        } },
        { code: "x++", run: function () {
            find("x").value++;
            note("Changing x directly. Anything pointing at x will see the new value.");
            render(["x"]);
        } },
        { code: "fmt.Println(*p)", run: function () {
            deref(function (target) {
                print(String(target.value));
                note("Reading through the pointer gives " + target.name + "'s current value.");
                render([target.name]);
            });
        } },
        { code: "y := x", need: "noy", run: function () {
            vars.splice(1, 0, { name: "y", type: "int", value: find("x").value });
            note("y gets a copy of x's value. They're separate boxes from now on.");
            render(["y"]);
        } },
        { code: "y = 50", need: "y", run: function () {
            find("y").value = 50;
            note("Only y changes. x has its own box.");
            render(["y"]);
        } },
        { code: "p = &y", need: "y", run: function () {
            find("p").to = "y";
            note("Point p somewhere else. Now *p means y.");
            render(["p"]);
        } },
        { code: "p = nil", need: "p", run: function () {
            find("p").to = null;
            note("p points at nothing again. Try *p = 10 now.");
            render(["p"]);
        } }
    ];

    const ops = slot("ops");
    OPS.forEach(function (op) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "watr-btn watr-btn--small";
        b.style.fontFamily = "var(--mono)";
        b.textContent = op.code;
        if (op.need) b.dataset.need = op.need;
        b.addEventListener("click", function () { log(op.code); op.run(); });
        ops.appendChild(b);
    });
    const r = document.createElement("button");
    r.type = "button";
    r.className = "watr-btn watr-btn--small watr-btn--quiet";
    r.textContent = "Reset";
    r.addEventListener("click", reset);
    ops.appendChild(r);

    window.addEventListener("resize", drawArrows);
    // fonts loading late can shift the boxes, so draw once more when they're in
    if (document.fonts) document.fonts.ready.then(drawArrows);
    // the sidebar folding changes the width too
    new ResizeObserver(drawArrows).observe(slot("mem"));
    reset();
}

function callToy() {
    const toy = document.getElementById("call-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    let score = 5;
    let run = 0;

    function setScore(v, flash) {
        score = v;
        const c = slot("score");
        c.innerHTML = "<small>score · 0xc0a0</small>" + v;
        if (flash) golearn.flash(c);
    }
    function setN(text, flash) {
        const c = slot("n");
        c.innerHTML = "<small>n</small>" + text;
        c.classList.toggle("is-in", text !== "-");
        if (flash) golearn.flash(c);
    }

    async function call(kind) {
        const me = ++run;
        const frame = slot("frame");
        const live = function () { return me === run; };
        if (kind === "reset") {
            setScore(5);
            setN("-");
            frame.classList.add("is-empty");
            slot("fname").textContent = "(no call yet)";
            slot("note").textContent = "Call one of them.";
            return;
        }
        frame.classList.remove("is-empty");
        if (kind === "value") {
            slot("fname").textContent = "double(n int)";
            setN(String(score), true);
            slot("note").textContent = "double gets its own n, a copy of score's value.";
            await golearn.wait(1300); if (!live()) return;
            setN(String(score * 2), true);
            slot("note").textContent = "n = n * 2 changes the copy. score is untouched.";
            await golearn.wait(1300); if (!live()) return;
            frame.classList.add("is-empty");
            slot("note").textContent = "double returns and its n is thrown away. score is still " + score + ". All that work, gone.";
        } else {
            slot("fname").textContent = "doublePtr(n *int)";
            setN("0xc0a0", true);
            slot("note").textContent = "doublePtr gets a copy too, but it's a copy of score's address.";
            await golearn.wait(1300); if (!live()) return;
            setScore(score * 2, true);
            slot("note").textContent = "*n = *n * 2 follows that address and changes score itself.";
            await golearn.wait(1300); if (!live()) return;
            frame.classList.add("is-empty");
            slot("note").textContent = "doublePtr returns. score is now " + score + ". Press it again to keep doubling.";
        }
    }

    toy.addEventListener("click", function (e) {
        const b = e.target.closest("[data-call]");
        if (b) call(b.dataset.call);
    });
}
