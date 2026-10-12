// lesson 4 toys: follow an error through div(), and watch defers stack up and unwind

document.addEventListener("DOMContentLoaded", function () {
    function lighter(pre) {
        golearn.paint(pre);
        const lines = pre.querySelectorAll(".code-lines > span");
        return function (k) { lines.forEach(function (l, j) { l.classList.toggle("is-on", j === k); }); };
    }

    // ---------- errors ----------
    const errToy = document.getElementById("err-toy");
    if (errToy) {
        const light = lighter(errToy.querySelector("pre.go"));
        const slot = function (n) { return errToy.querySelector('[data-slot="' + n + '"]'); };
        const form = errToy.querySelector("form");
        let run = 0;

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            const me = ++run;
            const a = parseInt(form.querySelector("#err-a").value, 10) || 0;
            const b = parseInt(form.querySelector("#err-b").value, 10) || 0;
            slot("out").textContent = "";
            slot("q").textContent = "-";
            slot("err").textContent = "-";

            const path = [
                [8, "main calls div(" + a + ", " + b + ")."],
                [0, "Into div, with a = " + a + " and b = " + b + "."],
                [1, "Is b == 0? " + (b === 0 ? "Yes." : "No.")]
            ];
            if (b === 0) {
                path.push([2, "Return the zero value for the int, and a real error."]);
            } else {
                path.push([4, "Return the answer, and nil for the error: nothing went wrong."]);
            }
            const q = b === 0 ? 0 : Math.trunc(a / b);
            path.push([8, "Back in main. q = " + q + ", err = " + (b === 0 ? "the error" : "nil") + ".", true]);
            path.push([9, "Is err != nil? " + (b === 0 ? "Yes, so deal with it." : "No, carry on.")]);
            if (b === 0) {
                path.push([10, "Print the error.", false, "error: can't divide by zero"]);
                path.push([11, "And stop. We never touch q, it's meaningless when there's an error."]);
            } else {
                path.push([13, "Use the result.", false, "result: " + q]);
            }

            for (const [line, note, assign, print] of path) {
                if (me !== run) return;
                light(line);
                slot("note").textContent = note;
                if (assign) {
                    slot("q").textContent = q;
                    slot("err").textContent = b === 0 ? "\"can't divide by zero\"" : "nil";
                }
                if (print) slot("out").textContent += print + "\n";
                await golearn.wait(800);
            }
        });
    }

    // ---------- defer ----------
    const deferToy = document.getElementById("defer-toy");
    if (!deferToy) return;
    const light = lighter(deferToy.querySelector("pre.go"));
    const slot = function (n) { return deferToy.querySelector('[data-slot="' + n + '"]'); };
    const playBtn = deferToy.querySelector('[data-act="play"]');

    const STEPS = [
        { line: 0, phase: "run", note: "main starts. The defer stack is empty." },
        { line: 1, phase: "run", push: "one", note: "defer doesn't print yet. It puts the call on the stack." },
        { line: 2, phase: "run", push: "two", note: "Another one on top." },
        { line: 3, phase: "run", print: "working", note: "A normal call runs right away." },
        { line: 4, phase: "run", push: "three", note: "Defers can come anywhere in the function. This one goes on top." },
        { line: 5, phase: "run", print: "returning", note: "Still running normally." },
        { line: 6, phase: "unwind", pop: true, note: "main is returning, so the stack unwinds from the top: three first." },
        { line: 6, phase: "unwind", pop: true, note: "Then two." },
        { line: 6, phase: "unwind", pop: true, note: "And one, the first defer, runs last." },
        { line: -1, phase: "done", note: "main has returned. Last in, first out." }
    ];
    let at = -1;
    let stack = [];
    let timer = null;

    function drawStack() {
        const box = slot("stack");
        box.innerHTML = "";
        stack.forEach(function (word, i) {
            const c = document.createElement("span");
            c.className = "cell is-in";
            c.textContent = "Println(\"" + word + "\")";
            if (i === stack.length - 1) golearn.flash(c);
            box.appendChild(c);
        });
    }

    function reset() {
        stop();
        at = -1;
        stack = [];
        drawStack();
        light(-1);
        slot("out").textContent = "";
        slot("phase").textContent = "ready";
        slot("note").textContent = "Press Step.";
    }

    function step() {
        if (at >= STEPS.length - 1) { stop(); return; }
        const s = STEPS[++at];
        light(s.line);
        slot("phase").textContent = s.phase;
        slot("note").textContent = s.note;
        if (s.push) stack.push(s.push);
        if (s.print) slot("out").textContent += s.print + "\n";
        if (s.pop) slot("out").textContent += stack.pop() + "\n";
        drawStack();
        if (at >= STEPS.length - 1) stop();
    }

    function stop() {
        clearInterval(timer);
        timer = null;
        playBtn.textContent = "Play";
    }

    deferToy.addEventListener("click", function (e) {
        const act = e.target.closest("[data-act]");
        if (!act) return;
        if (act.dataset.act === "step") { stop(); if (at >= STEPS.length - 1) reset(); step(); }
        if (act.dataset.act === "reset") reset();
        if (act.dataset.act === "play") {
            if (timer) { stop(); return; }
            if (at >= STEPS.length - 1) reset();
            playBtn.textContent = "Pause";
            step();
            timer = setInterval(step, 900);
        }
    });
    reset();
});
