// cheat sheet filter. sorting comes free from watr.js

document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("sheet-filter");
    const table = document.getElementById("sheet");
    const empty = document.getElementById("sheet-empty");
    if (!input || !table) return;

    input.addEventListener("input", function () {
        const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
        let shown = 0;
        Array.from(table.tBodies[0].rows).forEach(function (row) {
            const text = row.textContent.toLowerCase();
            const hit = words.every(function (w) { return text.indexOf(w) >= 0; });
            row.hidden = !hit;
            if (hit) shown++;
        });
        empty.hidden = shown > 0;
    });
});
