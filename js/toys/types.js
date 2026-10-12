// lesson 7 toys: value vs pointer receivers, and the "does it satisfy Shape?" checker

document.addEventListener("DOMContentLoaded", function () {
    recvToy();
    ifaceToy();
});

function recvToy() {
    const toy = document.getElementById("recv-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    let n = 0;
    let run = 0;

    function setC(flash) {
        slot("c").innerHTML = "<small>c.n</small>" + n;
        if (flash) golearn.flash(slot("c"));
    }
    function setRecv(text, flash) {
        const c = slot("recv");
        c.innerHTML = "<small>receiver</small>" + text;
        c.classList.toggle("is-in", text !== "-");
        if (flash) golearn.flash(c);
    }

    toy.addEventListener("click", async function (e) {
        const b = e.target.closest("[data-m]");
        if (!b) return;
        const me = ++run;
        const live = function () { return me === run; };
        const frame = slot("frame");
        if (b.dataset.m === "reset") {
            n = 0; setC(); setRecv("-");
            frame.classList.add("is-empty");
            slot("fname").textContent = "(no call yet)";
            slot("note").textContent = "Call a method.";
            return;
        }
        frame.classList.remove("is-empty");
        if (b.dataset.m === "inc") {
            slot("fname").textContent = "Inc (c *Counter)";
            setRecv("&c", true);
            slot("note").textContent = "Inc has a pointer receiver, so it gets c's address.";
            await golearn.wait(1000); if (!live()) return;
            n++; setC(true);
            slot("note").textContent = "c.n++ goes through the pointer and changes the real c. It's now " + n + ".";
        } else {
            slot("fname").textContent = "BadInc (c Counter)";
            setRecv("{n: " + n + "}", true);
            slot("note").textContent = "BadInc has a value receiver, so it gets a copy of the whole struct.";
            await golearn.wait(1000); if (!live()) return;
            setRecv("{n: " + (n + 1) + "}", true);
            slot("note").textContent = "c.n++ bumps the copy...";
            await golearn.wait(1000); if (!live()) return;
            frame.classList.add("is-empty");
            slot("note").textContent = "...and the copy is thrown away when BadInc returns. The real c.n is still " + n + ".";
        }
    });
}

function ifaceToy() {
    const toy = document.getElementById("iface-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    const WANT = ["Area", "Perimeter"];
    const TYPES = [
        { name: "Square", lit: "Square{2}", has: { Area: true, Perimeter: true, String: false }, area: 4, perim: 8 },
        { name: "Circle", lit: "Circle{1}", has: { Area: true, Perimeter: false, String: false }, area: Math.PI, perim: 2 * Math.PI },
        { name: "Rect", lit: "Rect{2, 3}", has: { Area: true, Perimeter: true, String: true }, area: 6, perim: 10 }
    ];

    const cards = slot("cards");
    TYPES.forEach(function (type, ti) {
        const card = document.createElement("div");
        card.className = "shape-card";
        const head = document.createElement("div");
        head.className = "shape-card__head";
        head.innerHTML = "<code>" + type.name + "</code>";
        const verdict = document.createElement("span");
        verdict.className = "watr-tag";
        head.appendChild(verdict);
        card.appendChild(head);
        Object.keys(type.has).forEach(function (m) {
            const label = document.createElement("label");
            label.className = "watr-check";
            const box = document.createElement("input");
            box.type = "checkbox";
            box.checked = type.has[m];
            box.addEventListener("change", function () { type.has[m] = box.checked; update(ti); });
            const span = document.createElement("span");
            span.innerHTML = "<code>" + m + "()</code>";
            label.append(box, span);
            card.appendChild(label);
        });
        type.verdict = verdict;
        type.card = card;
        cards.appendChild(card);
    });

    function missing(type) { return WANT.filter(function (m) { return !type.has[m]; }); }

    function update(changed) {
        TYPES.forEach(function (type, i) {
            const miss = missing(type);
            type.verdict.textContent = miss.length ? "not a shape" : "is a shape";
            type.verdict.className = "watr-tag " + (miss.length ? "watr-tag--danger" : "watr-tag--bright");
            if (i === changed) golearn.flash(type.card);
        });

        // the program we'd write, with the compiler's complaint where it would come
        const lines = ["var shapes []Shape"];
        const errs = [];
        TYPES.forEach(function (type) {
            const miss = missing(type);
            lines.push("shapes = append(shapes, " + type.lit + ")" + (miss.length ? "  // ✗" : ""));
            if (miss.length) {
                errs.push("./main.go: cannot use " + type.lit.replace(/\{.*\}/, "{…}") + " (value of struct type " + type.name + ") as Shape value in argument to append: " +
                    type.name + " does not implement Shape (missing method " + miss[0] + ")");
            }
        });
        lines.push("", "for _, s := range shapes {", "    fmt.Printf(\"%.2f %.2f\\n\", s.Area(), s.Perimeter())", "}");
        slot("code").innerHTML = "<code>" + golearn.highlight(lines.join("\n")) + "</code>";

        const out = slot("out");
        if (errs.length) {
            out.textContent = "$ go run .\n" + errs.join("\n");
            slot("note").textContent = "It doesn't even compile. Interfaces are checked when you build, not when you run. Tick the missing method to fix it.";
        } else {
            out.textContent = "$ go run .\n" + TYPES.map(function (t) { return t.area.toFixed(2) + " " + t.perim.toFixed(2); }).join("\n");
            const extra = TYPES.filter(function (t) { return t.has.String; }).map(function (t) { return t.name; });
            slot("note").textContent = "Every type has Area and Perimeter, so every type is a Shape." +
                (extra.length ? " " + extra.join(" and ") + " also " + (extra.length > 1 ? "have" : "has") + " String(). Extra methods don't hurt, and it means " + (extra.length > 1 ? "they" : "it") + " also satisfies fmt.Stringer." : "");
        }
    }

    update(-1);
}
