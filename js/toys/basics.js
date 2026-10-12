// lesson 1 toys: click-a-line anatomy, and a pretend terminal for the go command

document.addEventListener("DOMContentLoaded", function () {
    // ---------- anatomy ----------
    const anatomy = document.getElementById("anatomy");
    if (anatomy) {
        const pre = anatomy.querySelector("pre");
        golearn.paint(pre);
        const note = anatomy.querySelector(".toy__note");
        const NOTES = [
            "<b>package main</b> says which package this file belongs to. <code>main</code> is special: it's the one that builds into a program you can run.",
            "A blank line. gofmt keeps these between sections.",
            "<b>import \"fmt\"</b> pulls in the standard formatting package, so you can print things. Unused imports are a compile error.",
            "Another blank line.",
            "<b>func main()</b> is where the program starts. No arguments, no return value. When it returns, the program exits.",
            "<b>fmt.Println</b> prints its arguments and a newline. <code>Println</code> is capitalized, which is why you can call it from outside the fmt package.",
            "The closing brace ends <code>main</code>, and the program ends with it."
        ];
        const lines = Array.from(pre.querySelectorAll(".code-lines > span"));
        lines.forEach(function (line, i) {
            line.style.cursor = "pointer";
            line.tabIndex = 0;
            line.setAttribute("role", "button");
            const pick = function () {
                lines.forEach(function (l) { l.classList.toggle("is-on", l === line); });
                note.innerHTML = NOTES[i] || "";
            };
            line.addEventListener("click", pick);
            line.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
            });
        });
    }

    // ---------- terminal ----------
    const term = document.getElementById("terminal");
    if (!term) return;
    const screen = term.querySelector("pre.term");
    const note = term.querySelector(".toy__note");
    const COMMANDS = {
        init: {
            cmd: "go mod init example.com/hello",
            out: "go: creating new go.mod: module example.com/hello",
            note: "Makes a go.mod file. The module path is just a name; it only has to be a real URL if you publish it."
        },
        run: {
            cmd: "go run .",
            out: "hello, world",
            note: "Compiles to a temporary file and runs it straight away. Use this while you're working."
        },
        build: {
            cmd: "go build -o hello . && ./hello",
            out: "hello, world",
            note: "Builds a single file you can copy to another machine with no Go installed. Add GOOS=windows to build for Windows from anywhere."
        },
        fmt: {
            cmd: "go fmt ./...",
            out: "main.go",
            note: "Reformats every file and lists the ones it changed. ./... means this folder and everything under it."
        },
        vet: {
            cmd: "go vet ./...",
            out: "# example.com/hello\n./main.go:6:2: fmt.Println call has possible Printf formatting directive %d",
            note: "Looks for code that compiles but is probably wrong, like using %d in Println instead of Printf."
        }
    };

    let busy = false;
    async function run(key) {
        if (busy) return;
        if (key === "clear") {
            screen.innerHTML = '<span class="prompt">$ </span>';
            note.textContent = "";
            return;
        }
        busy = true;
        const c = COMMANDS[key];
        note.textContent = c.note;
        // type the command a letter at a time, like a person with somewhere to be
        const typed = document.createTextNode("");
        screen.appendChild(typed);
        for (const ch of c.cmd) {
            typed.data += ch;
            await golearn.wait(18);
        }
        await golearn.wait(350);
        screen.appendChild(document.createTextNode("\n" + c.out + "\n"));
        const prompt = document.createElement("span");
        prompt.className = "prompt";
        prompt.textContent = "$ ";
        screen.appendChild(prompt);
        screen.scrollTop = screen.scrollHeight;
        busy = false;
    }

    term.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-cmd]");
        if (btn) run(btn.dataset.cmd);
    });
});
