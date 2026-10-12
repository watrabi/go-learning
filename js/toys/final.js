// the final quiz's results box. good score: a plain message. rough score: the thinking blob,
// plus links back to whichever lessons the misses came from

document.addEventListener("DOMContentLoaded", function () {
    const quiz = document.getElementById("final");
    const out = document.getElementById("result");
    if (!quiz || !out) return;

    quiz.addEventListener("quizdone", function (e) {
        const d = e.detail;
        const ratio = d.right / d.total;
        const lessons = golearn.LESSONS.filter(function (l) { return d.missed.indexOf(l.id) >= 0; });
        const links = lessons.map(function (l) {
            return '<a class="watr-btn watr-btn--quiet watr-btn--small" href="' + l.file + '">' + golearn.esc(l.title) + "</a>";
        }).join("");
        out.hidden = false;

        if (ratio >= 0.8) {
            out.innerHTML = '<div class="watr-msg watr-msg--info"><b>' + d.right + " of " + d.total + ".</b> " +
                (ratio === 1 ? "Every one. Go write something real: a CLI tool, a tiny web server with net/http, anything." :
                    "Nearly all of them. Have a look at the ones in red, then go and build something.") + "</div>" +
                (links ? '<p>Worth another look:</p><div class="watr-row" style="flex-wrap:wrap">' + links + "</div>" : "");
        } else {
            out.innerHTML =
                '<div class="blob-row">' +
                    "<div>" +
                        "<h2>" + d.right + " of " + d.total + "</h2>" +
                        "<p>Some of this hasn't stuck yet, which is normal. The lessons these came from are below. Play with the toys again, then come back for a new set.</p>" +
                        '<div class="watr-row" style="flex-wrap:wrap">' + links + "</div>" +
                    "</div>" +
                    '<img src="kit/assets/thinking.png" alt="a blob, thinking hard">' +
                "</div>";
        }
        out.scrollIntoView({ block: "nearest" });
    });
});
