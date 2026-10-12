// every quiz question on the site. the lesson pages show their own set, quiz.html mixes them all.
// answer is the index of the right option (options get shuffled on screen, so order here doesn't leak).
// `backticks` turn into code. keep "why" short: one or two sentences about the actual rule.

window.QUIZZES = {
    basics: [
        {
            q: "Which package must a program that you run with `go run` be in?",
            options: ["`package main`", "`package app`", "`package go`", "Any package, as long as it has a `main` function"],
            answer: 0,
            why: "An executable needs `package main` with a `func main()` in it. Every other package name builds a library."
        },
        {
            q: "What happens if you import a package and never use it?",
            options: ["Nothing, it's ignored", "A warning is printed", "The program won't compile", "It runs slower"],
            answer: 2,
            why: "Unused imports (and unused local variables) are compile errors in Go. `goimports` or your editor can remove them for you."
        },
        {
            q: "Which name can another package use?",
            code: "package shapes\n\nfunc area() float64 { return 0 }\nfunc Volume() float64 { return 0 }",
            options: ["`area`", "`Volume`", "Both", "Neither"],
            answer: 1,
            why: "Names that start with a capital letter are exported. Lowercase names stay inside their package."
        },
        {
            q: "What does `go fmt` do?",
            options: ["Checks your code for bugs", "Rewrites your code into the standard Go formatting", "Compiles the program", "Formats strings with `%v`"],
            answer: 1,
            why: "`gofmt` is the one true formatting. Nobody argues about tabs in Go, the tool decides."
        },
        {
            q: "Where does the opening brace of a function have to go?",
            options: ["On the same line as `func`", "On the next line", "Either, it's style", "Go doesn't use braces"],
            answer: 0,
            why: "Go inserts semicolons at line ends automatically, so a brace on its own line would end the statement too early and fail to compile."
        }
    ],

    variables: [
        {
            q: "What is the zero value of a `string`?",
            options: ["`nil`", "`\"\"` (empty string)", "`\" \"`", "It has none, using it is an error"],
            answer: 1,
            why: "Every type has a zero value. Strings start as the empty string, never nil."
        },
        {
            q: "What type does `x` get?",
            code: "x := 3.0",
            options: ["`int`", "`float32`", "`float64`", "`number`"],
            answer: 2,
            why: "A literal with a decimal point defaults to `float64`. `x := 3` would be `int`."
        },
        {
            q: "Where can you use `:=`?",
            options: ["Anywhere", "Only inside functions", "Only at package level", "Only in `for` loops"],
            answer: 1,
            why: "Short declarations only work inside functions. At package level you need `var`."
        },
        {
            q: "Does this compile?",
            code: "var a int = 5\nvar b float64 = a",
            options: ["Yes, Go converts it", "No, you need `float64(a)`", "Yes, but b is 0", "No, float64 doesn't exist"],
            answer: 1,
            why: "Go never converts between types for you. Write the conversion yourself: `float64(a)`."
        },
        {
            q: "What does `const Pi = 3.14` give you?",
            options: ["A variable you can change later", "A value fixed at compile time", "A pointer to 3.14", "A string"],
            answer: 1,
            why: "Constants are worked out when the program compiles and can't be reassigned."
        },
        {
            q: "What's a `rune`?",
            options: ["A single byte", "A Unicode code point (an alias for `int32`)", "A kind of string", "A goroutine"],
            answer: 1,
            why: "`'a'` is a rune. Strings are bytes, and ranging over a string gives you runes."
        }
    ],

    control: [
        {
            q: "How many loop keywords does Go have?",
            options: ["One: `for`", "Two: `for` and `while`", "Three: `for`, `while`, `do`", "None, you use recursion"],
            answer: 0,
            why: "`for` does everything. `for cond { }` is a while loop and `for { }` loops forever."
        },
        {
            q: "What does this print?",
            code: "for i := 0; i < 3; i++ {\n    fmt.Print(i)\n}",
            options: ["`123`", "`012`", "`0123`", "`3`"],
            answer: 1,
            why: "It starts at 0 and stops before 3."
        },
        {
            q: "In a Go `switch`, what happens after a matching `case` runs?",
            options: ["It falls into the next case", "The switch ends", "It checks the remaining cases too", "It loops"],
            answer: 1,
            why: "Go cases break on their own. You only get fall-through if you write `fallthrough`."
        },
        {
            q: "What does `range` give you over a slice?",
            options: ["Just the values", "Index and value", "Just the length", "A copy of the slice"],
            answer: 1,
            why: "`for i, v := range s`. Use `_` for the one you don't need: `for _, v := range s`."
        },
        {
            q: "Is `n` visible after the `if`?",
            code: "if n := len(s); n > 3 {\n    fmt.Println(\"long\")\n}\nfmt.Println(n)",
            options: ["Yes", "No, `n` only exists inside the if (and its else)", "Only if the condition was true", "Only in Go 1.22+"],
            answer: 1,
            why: "A variable declared in the if's short statement is scoped to the if and else blocks."
        }
    ],

    functions: [
        {
            q: "What does this function return?",
            code: "func div(a, b int) (int, error)",
            options: ["One int", "An int and an error", "A tuple object", "An error that contains an int"],
            answer: 1,
            why: "Go functions can return several values. `(value, error)` is the usual shape."
        },
        {
            q: "What's the usual way to handle an error?",
            options: ["`try { } catch { }`", "`if err != nil { return err }`", "Ignore it, Go panics for you", "`on error resume next`"],
            answer: 1,
            why: "Errors are ordinary values. You check them right where they happen."
        },
        {
            q: "In which order do deferred calls run?",
            options: ["The order they were written", "Last in, first out", "Random", "All at the same time"],
            answer: 1,
            why: "Defers stack up. When the function returns they run from the top of the stack down: last deferred, first run."
        },
        {
            q: "What does this print?",
            code: "defer fmt.Print(1)\ndefer fmt.Print(2)\nfmt.Print(3)",
            options: ["`123`", "`321`", "`312`", "`132`"],
            answer: 2,
            why: "3 prints straight away. Then the defers run newest first: 2, then 1."
        },
        {
            q: "What's `_` for in `v, _ := f()`?",
            options: ["It throws that value away", "It stores the value in a hidden variable", "It's a syntax error", "It means \"any type\""],
            answer: 0,
            why: "The blank identifier discards a value you don't need. Be careful doing that with errors."
        }
    ],

    collections: [
        {
            q: "What's the difference between `[3]int` and `[]int`?",
            options: ["None", "`[3]int` is an array with a fixed size, `[]int` is a slice", "`[]int` is faster", "`[3]int` holds 3 slices"],
            answer: 1,
            why: "Array length is part of its type. Slices are a view onto an array and can grow with `append`."
        },
        {
            q: "What happens when you `append` to a slice that's already at capacity?",
            options: ["Panic", "The value is dropped", "Go makes a bigger array, copies everything over, and adds the value", "The oldest value is overwritten"],
            answer: 2,
            why: "That's why you always write `s = append(s, x)`. The result might point at a brand new array."
        },
        {
            q: "What does this print?",
            code: "a := []int{1, 2, 3}\nb := a[:2]\nb[0] = 9\nfmt.Println(a[0])",
            options: ["`1`", "`9`", "`2`", "It doesn't compile"],
            answer: 1,
            why: "`b` is a window onto the same array as `a`, so writing through `b` changes `a` too."
        },
        {
            q: "How do you tell \"key missing\" apart from \"key holds the zero value\" in a map?",
            options: ["`v, ok := m[k]`", "`m.has(k)`", "Check for `nil`", "You can't"],
            answer: 0,
            why: "The comma-ok form gives `ok == false` when the key isn't there."
        },
        {
            q: "What happens if you write to a `nil` map?",
            code: "var m map[string]int\nm[\"a\"] = 1",
            options: ["It works", "It panics", "It's silently ignored", "It won't compile"],
            answer: 1,
            why: "Reading a nil map is fine, writing panics. Make it first: `m := make(map[string]int)` or `map[string]int{}`."
        },
        {
            q: "What order does `range` visit a map in?",
            options: ["Insertion order", "Sorted by key", "Unspecified, and it changes between runs", "Reverse insertion order"],
            answer: 2,
            why: "Go randomizes map order on purpose so nobody depends on it. Sort the keys if you need an order."
        }
    ],

    pointers: [
        {
            q: "If `x` is an `int`, what is `&x`?",
            options: ["A copy of x", "The address of x, type `*int`", "x times two", "A reference count"],
            answer: 1,
            why: "`&` takes an address. `*` follows one."
        },
        {
            q: "What does this print?",
            code: "x := 1\np := &x\n*p = 5\nfmt.Println(x)",
            options: ["`1`", "`5`", "An address like `0xc000012345`", "It doesn't compile"],
            answer: 1,
            why: "`*p = 5` writes to whatever `p` points at, which is `x`."
        },
        {
            q: "Why doesn't this change `n` in the caller?",
            code: "func reset(n int) { n = 0 }",
            options: ["`n` is a constant", "Go passes a copy of `n`", "You need `return`", "It does change it"],
            answer: 1,
            why: "Everything in Go is passed by value. Take a `*int` and write `*n = 0` to change the caller's variable."
        },
        {
            q: "What's the zero value of a pointer?",
            options: ["`0`", "`nil`", "The address of a zero", "Pointers must be set"],
            answer: 1,
            why: "A nil pointer points at nothing. Following it (`*p`) panics."
        },
        {
            q: "Can a Go function return a pointer to one of its local variables?",
            options: ["Yes, Go keeps it alive", "No, it's a dangling pointer", "Only with `new`", "Only for structs"],
            answer: 0,
            why: "Escape analysis moves it to the heap when needed. Returning `&local` is completely normal Go."
        }
    ],

    types: [
        {
            q: "How does a type say it implements an interface?",
            options: ["`implements Shape`", "It just has the right methods", "`extends Shape`", "By registering with `interface.Add`"],
            answer: 1,
            why: "Interfaces are satisfied implicitly. If the methods are there, the type fits."
        },
        {
            q: "What's the difference between these methods?",
            code: "func (c Counter) A()  { c.n++ }\nfunc (c *Counter) B() { c.n++ }",
            options: ["None", "`B` changes the original Counter, `A` changes a copy", "`A` is faster so it's better", "`B` won't compile"],
            answer: 1,
            why: "A value receiver gets a copy. Use a pointer receiver when the method needs to change the value."
        },
        {
            q: "Which types satisfy `interface{}` (also written `any`)?",
            options: ["None", "Only structs", "Every type", "Only pointers"],
            answer: 2,
            why: "An interface with no methods asks for nothing, so everything fits."
        },
        {
            q: "What does Go use instead of inheritance?",
            options: ["Classes", "Embedding (composition)", "Prototypes", "Mixins via decorators"],
            answer: 1,
            why: "You embed one struct in another and its fields and methods get promoted. No class hierarchy."
        },
        {
            q: "What do you get from this?",
            code: "type Point struct{ X, Y int }\np := Point{X: 1}",
            options: ["A compile error, Y is missing", "`{1 0}`", "`{1 nil}`", "`{1 1}`"],
            answer: 1,
            why: "Fields you leave out get their zero value."
        }
    ],

    concurrency: [
        {
            q: "What does the `go` keyword do?",
            code: "go work()",
            options: ["Runs `work` and waits for it", "Starts `work` in a new goroutine and carries on immediately", "Compiles `work` separately", "Runs `work` on the GPU"],
            answer: 1,
            why: "A goroutine is a very cheap thread run by Go. The line doesn't wait for it."
        },
        {
            q: "On an unbuffered channel, when does a send finish?",
            options: ["Right away", "When a receiver takes the value", "After one second", "When the channel is closed"],
            answer: 1,
            why: "Unbuffered channels hand the value straight over, so the sender and receiver meet."
        },
        {
            q: "A channel made with `make(chan int, 2)` already holds 2 values. What happens to a third send?",
            options: ["It overwrites the oldest", "It blocks until someone receives", "It panics", "The buffer grows"],
            answer: 1,
            why: "A full buffer blocks senders, an empty one blocks receivers."
        },
        {
            q: "What's `sync.WaitGroup` for?",
            options: ["Locking a variable", "Waiting for a group of goroutines to finish", "Making goroutines run in order", "Timing out a channel"],
            answer: 1,
            why: "`Add` before you start them, `Done` at the end of each, `Wait` blocks until the count hits zero."
        },
        {
            q: "What does `select` do?",
            options: ["Picks a random goroutine to kill", "Waits on several channel operations and runs whichever is ready first", "Selects items from a slice", "Sorts a channel"],
            answer: 1,
            why: "If several are ready it picks one at random. A `default` case makes it not wait at all."
        },
        {
            q: "What happens to goroutines that are still running when `main` returns?",
            options: ["main waits for them", "They keep running in the background", "The program exits and they stop", "They panic"],
            answer: 2,
            why: "When main returns, the program ends. That's why you wait with a WaitGroup or a channel."
        }
    ]
};
