// lesson 5 toys: the slice visualizer (arrays, len, cap, append, sharing) and a map playground

document.addEventListener("DOMContentLoaded", function () {
    sliceToy();
    mapToy();
});

function sliceToy() {
    const toy = document.getElementById("slice-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };

    // the model. a slice is { arr, off, len } and its cap is however much array is left after off
    let names, arrays, s, t, dropped, next, busy;
    const cap = function (sl) { return sl.arr.cells.length - sl.off; };
    const view = function (sl) { return sl.arr.cells.slice(sl.off, sl.off + sl.len); };
    const show = function (sl) { return "[" + view(sl).join(" ") + "]"; };

    function newArray(size) {
        const a = { name: names.shift(), cells: new Array(size).fill(0) };
        arrays.push(a);
        return a;
    }

    function reset() {
        names = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        arrays = [];
        const a = newArray(3);
        a.cells = [1, 2, 3];
        s = { arr: a, off: 0, len: 3 };
        t = null;
        dropped = null;
        next = 4;
        busy = false;
        slot("log").textContent = "s := []int{1, 2, 3}\n";
        note("A slice literal makes an array of 3 and a slice that sees all of it: length 3, capacity 3.");
        render();
    }

    function note(text) { slot("note").textContent = text; }
    function log(line) {
        const out = slot("log");
        out.textContent += line + "\n";
        out.scrollTop = out.scrollHeight;
    }

    function render(flash) {
        const box = slot("arrays");
        box.innerHTML = "";
        const live = arrays.filter(function (a) { return a === s.arr || (t && a === t.arr) || a === dropped; });
        live.forEach(function (a) {
            const row = document.createElement("div");
            row.className = "array-row" + (a === dropped ? " is-dropped" : "");
            const label = document.createElement("div");
            label.className = "array-row__label";
            const who = [];
            if (a === s.arr) who.push("s");
            if (t && a === t.arr) who.push("t");
            label.textContent = "array " + a.name + " · " + a.cells.length + " slots" +
                (who.length ? " · used by " + who.join(" and ") : " · nothing points here now, the garbage collector will free it");
            const cells = document.createElement("div");
            cells.className = "cells";
            a.cells.forEach(function (v, i) {
                const c = document.createElement("span");
                c.className = "cell";
                const inS = a === s.arr && i >= s.off && i < s.off + s.len;
                const spareS = a === s.arr && i >= s.off + s.len;
                const inT = t && a === t.arr && i >= t.off && i < t.off + t.len;
                if (inS) c.classList.add("is-in");
                if (inT) c.classList.add("is-t");
                if (!inS && !spareS && !inT) c.classList.add("is-ghost");
                if (spareS && !inT) c.classList.add("is-spare");
                c.innerHTML = "<small>" + i + "</small>" + v;
                if (flash && flash.arr === a && flash.idx.indexOf(i) >= 0) golearn.flash(c);
                cells.appendChild(c);
            });
            row.append(label, cells);
            box.appendChild(row);
        });

        const heads = slot("headers");
        heads.innerHTML = "";
        [["s", s], ["t", t]].forEach(function (pair) {
            if (!pair[1]) return;
            const sl = pair[1];
            const dt = document.createElement("dt");
            dt.textContent = pair[0];
            const dd = document.createElement("dd");
            dd.textContent = show(sl) + "  len " + sl.len + "  cap " + cap(sl) + "  → " + sl.arr.name + "[" + sl.off + "]";
            heads.append(dt, dd);
        });

        // turn buttons on and off depending on what makes sense right now
        toy.querySelectorAll("[data-op]").forEach(function (b) {
            const need = b.dataset.need;
            let ok = !busy;
            if (need === "s1") ok = ok && s.len >= 1;
            if (need === "s2") ok = ok && s.len >= 2;
            if (need === "t") ok = ok && !!t;
            if (need === "t1") ok = ok && !!t && t.len >= 1;
            if (need === "room") ok = ok && s.len < cap(s);
            b.disabled = !ok;
        });
    }

    // append, with the copy shown one square at a time when the array is full
    async function append(sl, value) {
        if (sl.len < cap(sl)) {
            const i = sl.off + sl.len;
            sl.arr.cells[i] = value;
            sl.len++;
            return { grew: false, idx: i };
        }
        const oldCap = cap(sl);
        const fresh = newArray(oldCap === 0 ? 1 : oldCap * 2);
        const old = sl.arr;
        const from = sl.off;
        render();
        for (let i = 0; i < sl.len; i++) {
            fresh.cells[i] = old.cells[from + i];
            render({ arr: fresh, idx: [i] });
            await golearn.wait(160);
        }
        fresh.cells[sl.len] = value;
        sl.arr = fresh;
        sl.off = 0;
        sl.len++;
        return { grew: true, old: old, oldCap: oldCap, fresh: fresh, idx: sl.len - 1 };
    }

    const OPS = [
        {
            label: "s = append(s, n)", need: "",
            run: async function () {
                const v = next++;
                log("s = append(s, " + v + ")");
                const r = await append(s, v);
                if (r.grew) {
                    dropped = (t && t.arr === r.old) ? null : r.old;
                    note("s was full (cap " + r.oldCap + "), so append made array " + r.fresh.name + " with room for " + r.fresh.cells.length + ", copied everything over, then added " + v + "." +
                        (t && t.arr === r.old ? " t still points at the old array, so s and t no longer share anything." : ""));
                } else {
                    note("There was spare room, so " + v + " went straight into the same array. No copy needed.");
                }
                render({ arr: s.arr, idx: [r.idx] });
            }
        },
        {
            label: "s = s[1:]", need: "s1",
            run: function () {
                log("s = s[1:]");
                s.off++; s.len--;
                note("The window slides right by one. The array doesn't change, so the first slot is still there, just out of sight. Capacity drops by one too.");
                render();
            }
        },
        {
            label: "s = s[:len(s)-1]", need: "s1",
            run: function () {
                log("s = s[:len(s)-1]");
                s.len--;
                note("Length shrinks by one, capacity stays the same. The last value is still in the array as spare room, and the next append will overwrite it.");
                render();
            }
        },
        {
            label: "s = s[:cap(s)]", need: "room",
            run: function () {
                log("s = s[:cap(s)]");
                const from = s.off + s.len;
                s.len = cap(s);
                const idx = [];
                for (let i = from; i < s.off + s.len; i++) idx.push(i);
                note("You can stretch a slice back out up to its capacity. Whatever was sitting in the spare room shows up again.");
                render({ arr: s.arr, idx: idx });
            }
        },
        {
            label: "t := s[:2]", need: "s2",
            run: function () {
                log("t := s[:2]");
                t = { arr: s.arr, off: s.off, len: 2 };
                note("t is a new window onto the same array. Nothing was copied. t's capacity runs to the end of the array, same as s.");
                render({ arr: t.arr, idx: [t.off, t.off + 1] });
            }
        },
        {
            label: "t[0] = 99", need: "t1",
            run: function () {
                log("t[0] = 99");
                t.arr.cells[t.off] = 99;
                const shared = t.arr === s.arr && t.off >= s.off && t.off < s.off + s.len;
                note(shared ? "t and s share the array, so s changed as well. This catches everyone at least once." : "t has its own array now, so s didn't change.");
                render({ arr: t.arr, idx: [t.off] });
            }
        },
        {
            label: "t = append(t, 7)", need: "t",
            run: async function () {
                log("t = append(t, 7)");
                const before = t.arr;
                const r = await append(t, 7);
                if (r.grew) {
                    dropped = before === s.arr ? null : before;
                    note("t was full, so it moved to its own new array. From now on t and s are independent.");
                } else if (t.arr === s.arr && r.idx < s.off + s.len) {
                    note("Sneaky one. t had spare capacity, so append wrote 7 into the shared array, right over a value s was still using. Look at s.");
                } else {
                    note("t had spare room, so 7 went into the same array.");
                }
                render({ arr: t.arr, idx: [r.idx] });
            }
        }
    ];

    const ops = slot("ops");
    OPS.forEach(function (op) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "watr-btn watr-btn--small";
        b.style.fontFamily = "var(--mono)";
        b.textContent = op.label;
        b.dataset.op = "1";
        b.dataset.need = op.need;
        b.addEventListener("click", async function () {
            if (busy) return;
            busy = true;
            dropped = null;
            render();
            await op.run();
            busy = false;
            render();
        });
        ops.appendChild(b);
    });
    const r = document.createElement("button");
    r.type = "button";
    r.className = "watr-btn watr-btn--small watr-btn--quiet";
    r.textContent = "Reset";
    r.addEventListener("click", function () { if (!busy) reset(); });
    ops.appendChild(r);

    reset();
}

function mapToy() {
    const toy = document.getElementById("map-toy");
    if (!toy) return;
    const slot = function (n) { return toy.querySelector('[data-slot="' + n + '"]'); };
    const form = toy.querySelector("form");
    const keyIn = toy.querySelector("#map-key");
    const valIn = toy.querySelector("#map-val");
    const m = new Map([["ana", 31], ["bo", 25], ["cy", 40]]);

    function render(hot) {
        const rows = slot("rows");
        rows.innerHTML = "";
        if (!m.size) {
            rows.innerHTML = '<tr><td colspan="2" class="muted">empty map</td></tr>';
            return;
        }
        // shown sorted here so the table doesn't jump about. range is where the order goes wild
        Array.from(m.keys()).sort().forEach(function (k) {
            const tr = document.createElement("tr");
            if (k === hot) tr.className = "is-selected";
            const a = document.createElement("td");
            a.textContent = JSON.stringify(k);
            const b = document.createElement("td");
            b.className = "num";
            b.textContent = m.get(k);
            tr.append(a, b);
            rows.appendChild(tr);
        });
    }

    function say(code, result, text) {
        slot("out").textContent = code + (result ? "\n// " + result : "");
        slot("note").textContent = text;
    }

    function act(which) {
        const k = keyIn.value.trim();
        const v = parseInt(valIn.value, 10) || 0;
        const q = JSON.stringify(k);
        if (which === "set") {
            const had = m.has(k);
            m.set(k, v);
            say("m[" + q + "] = " + v, "", had ? "The key was already there, so its value was replaced." : "A new key. Maps grow on their own, no append needed.");
            render(k);
        }
        if (which === "get") {
            const ok = m.has(k);
            say("v, ok := m[" + q + "]", "v = " + (ok ? m.get(k) : 0) + ", ok = " + ok,
                ok ? "Found it." : "Not there. v is the zero value (0) and ok is false. Without ok you couldn't tell this apart from a stored 0.");
            render(ok ? k : null);
        }
        if (which === "del") {
            const had = m.delete(k);
            say("delete(m, " + q + ")", "", had ? "Gone." : "Deleting a key that isn't there is fine. Nothing happens, no error.");
            render();
        }
        if (which === "range") {
            // go randomizes map order on purpose, so we shuffle too
            const keys = Array.from(m.keys());
            for (let i = keys.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = keys[i]; keys[i] = keys[j]; keys[j] = tmp;
            }
            slot("out").textContent = "for k, v := range m {\n    fmt.Println(k, v)\n}\n\n" + keys.map(function (k2) { return k2 + " " + m.get(k2); }).join("\n");
            slot("note").textContent = "Run it again. Go deliberately changes the order between runs so nobody relies on it. Sort the keys when order matters.";
            render();
        }
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); act("set"); });
    toy.addEventListener("click", function (e) {
        const b = e.target.closest("[data-act]");
        if (b && b.type !== "submit") act(b.dataset.act);
    });
    render();
}
