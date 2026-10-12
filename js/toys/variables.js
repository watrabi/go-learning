// lesson 2 toys: zero value explorer, and a (very) small type checker for x := ...

document.addEventListener("DOMContentLoaded", function () {
    // ---------- zero values ----------
    const zero = document.getElementById("zero-toy");
    if (zero) {
        const TYPES = [
            { t: "int",            v: "0",       note: "Numbers start at 0." },
            { t: "float64",        v: "0",       note: "Floats start at 0 too. Println shows it as 0, not 0.0." },
            { t: "string",         v: "\"\"",    note: "An empty string. Never nil: a string can't be nil in Go." },
            { t: "bool",           v: "false",   note: "Booleans start false." },
            { t: "*int",           v: "nil",     note: "A pointer that points at nothing. Following it with *x would panic." },
            { t: "[]int",          v: "nil",     note: "A nil slice. You can still len() it, range over it and append to it. Prints as []." },
            { t: "map[string]int", v: "nil",     note: "A nil map. Reading from it is fine, writing panics. make() it first." },
            { t: "error",          v: "nil",     note: "nil means \"no error\". That's why you see if err != nil everywhere." },
            { t: "struct{X int; S string}", v: "{0 \"\"}", note: "A struct's zero value is every field at its own zero value." }
        ];
        const controls = zero.querySelector(".toy__controls");
        const pre = zero.querySelector('[data-slot="code"]');
        const cell = zero.querySelector('[data-slot="cell"]');
        const note = zero.querySelector('[data-slot="note"]');

        const show = function (item, btn) {
            controls.querySelectorAll("button").forEach(function (b) {
                b.classList.toggle("watr-btn--quiet", b !== btn);
            });
            pre.innerHTML = "<code>" + golearn.highlight("var x " + item.t) + "</code>";
            cell.innerHTML = "<small>x</small>" + golearn.esc(item.v);
            cell.classList.toggle("is-in", item.v !== "nil");
            cell.classList.toggle("is-ghost", item.v === "nil");
            golearn.flash(cell);
            note.textContent = item.note;
        };

        TYPES.forEach(function (item, i) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "watr-btn watr-btn--small watr-btn--quiet";
            btn.textContent = item.t.length > 14 ? "struct" : item.t;
            btn.addEventListener("click", function () { show(item, btn); });
            controls.appendChild(btn);
            if (i === 0) show(item, btn);
        });
    }

    // ---------- inference ----------
    const infer = document.getElementById("infer-toy");
    if (!infer) return;
    const form = infer.querySelector("form");
    const result = infer.querySelector('[data-slot="result"]');
    const note = infer.querySelector('[data-slot="note"]');
    const presets = infer.querySelector('[data-slot="presets"]');

    // a recursive descent parser for number arithmetic. go rules: if every literal is a whole
    // number the result is an int and / throws the remainder away. one float anywhere = float64
    function arith(src) {
        const toks = src.match(/\d+(?:_\d+)*(?:\.\d*)?(?:e[+-]?\d+)?|\.\d+|[-+*/%()]/gi);
        if (!toks || toks.join("") !== src.replace(/\s+/g, "")) return null;
        let pos = 0;
        let isFloat = toks.some(function (t) { return /[.e]/i.test(t); });
        function num() {
            const t = toks[pos++];
            if (t === "(") { const v = expr(); if (toks[pos++] !== ")") throw new Error("missing )"); return v; }
            if (t === "-") return -num();
            if (t === "+") return num();
            if (t === undefined || /[-+*/%()]/.test(t)) throw new Error("expected a number");
            return Number(t.replace(/_/g, ""));
        }
        function term() {
            let v = num();
            while (toks[pos] === "*" || toks[pos] === "/" || toks[pos] === "%") {
                const op = toks[pos++];
                const r = num();
                if (op !== "*" && r === 0) throw new Error("division by zero");
                if (op === "%" && isFloat) throw new Error("% only works on integers");
                v = op === "*" ? v * r : op === "%" ? v % r : (isFloat ? v / r : Math.trunc(v / r));
            }
            return v;
        }
        function expr() {
            let v = term();
            while (toks[pos] === "+" || toks[pos] === "-") {
                v = toks[pos++] === "+" ? v + term() : v - term();
            }
            return v;
        }
        const value = expr();
        if (pos !== toks.length) throw new Error("unexpected " + toks[pos]);
        return { type: isFloat ? "float64" : "int", value: String(value) };
    }

    function judge(raw) {
        const src = raw.trim();
        if (!src) return { error: "Type something on the right of :=." };
        if (src === "nil") return { error: "use of untyped nil. Go can't tell what kind of nil you mean, so give it a type: var x *int = nil." };
        if (src === "true" || src === "false") return { type: "bool", value: src };
        if (/^"(?:\\.|[^"\\])*"(\s*\+\s*"(?:\\.|[^"\\])*")*$/.test(src)) {
            const parts = src.match(/"(?:\\.|[^"\\])*"/g).map(function (p) { return p.slice(1, -1); });
            return { type: "string", value: "\"" + parts.join("") + "\"" };
        }
        if (/^`[^`]*`$/.test(src)) return { type: "string", value: "\"" + src.slice(1, -1) + "\"", why: "Backticks make a raw string: no escapes, can span lines." };
        if (/^'(\\.|[^'\\])'$/u.test(src)) {
            const ch = src.slice(1, -1);
            const cp = ch.length === 1 || !ch.startsWith("\\") ? ch.codePointAt(0) : ({ "\\n": 10, "\\t": 9, "\\\\": 92, "\\'": 39 })[ch];
            return { type: "rune", value: String(cp), why: "Single quotes are a rune: the character's Unicode number, stored as an int32." };
        }
        if (/^len\(\s*"(?:\\.|[^"\\])*"\s*\)$/.test(src)) {
            const inner = src.match(/"((?:\\.|[^"\\])*)"/)[1];
            return { type: "int", value: String(new TextEncoder().encode(inner).length), why: "len counts bytes, not characters. Try len(\"héllo\")." };
        }
        let m = src.match(/^\[\](\w+)\{.*\}$/);
        if (m) return { type: "[]" + m[1], value: src.replace(/^\[\]\w+/, "[]").replace(/[{}]/g, "").replace(/\s*,\s*/g, " ").replace(/^\[\]/, "[") + "]" };
        m = src.match(/^map\[(\w+)\](\w+)\{.*\}$/);
        if (m) return { type: "map[" + m[1] + "]" + m[2], value: "(a map)" };
        m = src.match(/^(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|byte|rune|string)\((.+)\)$/);
        if (m) {
            const inner = m[2].trim();
            let a;
            try { a = arith(inner); } catch (err) { a = null; }
            if (a && /int|byte|rune/.test(m[1])) {
                if (!Number.isInteger(Number(a.value))) {
                    return { error: "cannot convert " + inner + " (untyped float constant) to type " + m[1] + " (truncated). Go won't silently chop a constant. With a variable it works: f := 9.99 then int(f) gives 9." };
                }
                return { type: m[1], value: a.value, why: "T(value) converts value to type T." };
            }
            return { type: m[1], value: a ? a.value : inner, why: "T(value) converts value to type T." };
        }
        try {
            const a = arith(src);
            if (a) {
                if (a.type === "int" && src.indexOf("/") >= 0) a.why = "Both sides are whole numbers, so this is integer division and the remainder is thrown away.";
                if (a.type === "float64") a.why = "There's a floating-point number in there (a decimal point or an exponent), so the whole thing is float64.";
                return a;
            }
        } catch (err) {
            return { error: err.message + "." };
        }
        return { error: "This little checker doesn't know that one. Try a number, some arithmetic, \"text\", 'r', true, []int{1, 2} or float64(3)." };
    }

    function check(src) {
        const r = judge(src);
        result.innerHTML = "";
        if (r.error) {
            note.textContent = r.error;
            return;
        }
        [["type", r.type], ["value", r.value]].forEach(function (pair) {
            const dt = document.createElement("dt");
            dt.textContent = pair[0];
            const dd = document.createElement("dd");
            dd.textContent = pair[1];
            result.append(dt, dd);
        });
        golearn.flash(result);
        note.textContent = r.why || "";
    }

    ["7 / 2", "7.0 / 2", "1_000_000", "\"go\" + \"pher\"", "'g'", "len(\"héllo\")", "int(9.99)", "[]int{1, 2, 3}", "nil"].forEach(function (p) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "watr-btn watr-btn--quiet watr-btn--small";
        b.textContent = p;
        b.style.fontFamily = "var(--mono)";
        b.addEventListener("click", function () { form.expr.value = p; check(p); });
        presets.appendChild(b);
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); check(form.expr.value); });
    check(form.expr.value);
});
