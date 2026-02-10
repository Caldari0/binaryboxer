// ============================================================
// Binary Boxer — Learning Tips
// Static data: real programming tips per language (10 each)
// ============================================================

import type { LearningTip } from '../../shared/types';

export const LEARNING_TIPS: LearningTip[] = [
  // --- Rust (10 tips) ---
  {
    language: 'rust',
    tip: 'Ownership means each value has exactly one owner at a time',
    detail:
      'When the owner goes out of scope, Rust automatically drops the value and frees its memory. This eliminates the need for a garbage collector.',
  },
  {
    language: 'rust',
    tip: 'Use &reference to borrow a value without taking ownership',
    detail:
      'Borrowing lets you pass values to functions without moving them. You can have many immutable references or exactly one mutable reference at a time.',
  },
  {
    language: 'rust',
    tip: 'match expressions must cover every possible case',
    detail:
      'The Rust compiler enforces exhaustive matching. Use a wildcard pattern _ as a catch-all if you only care about specific variants.',
  },
  {
    language: 'rust',
    tip: 'String is heap-allocated, &str is a string slice reference',
    detail:
      'String owns its data and can be mutated. &str is an immutable view into a string and is more efficient to pass around when you do not need ownership.',
  },
  {
    language: 'rust',
    tip: 'Option<T> replaces null with Some(value) or None',
    detail:
      'Rust has no null. Instead, Option<T> forces you to explicitly handle the case where a value might be absent, preventing null pointer errors at compile time.',
  },
  {
    language: 'rust',
    tip: 'Result<T, E> handles errors with Ok(value) or Err(error)',
    detail:
      'Instead of throwing exceptions, Rust functions return Result types. The ? operator propagates errors concisely by returning early on Err.',
  },
  {
    language: 'rust',
    tip: 'Lifetimes tell the compiler how long references are valid',
    detail:
      'Lifetime annotations like \'a do not change how long values live. They describe the relationship between reference lifetimes so the compiler can verify safety.',
  },
  {
    language: 'rust',
    tip: 'The compiler catches data races at compile time',
    detail:
      'Rust prevents data races by enforcing that either multiple threads can read data or one thread can write, but never both simultaneously. This is checked before your code runs.',
  },
  {
    language: 'rust',
    tip: 'impl adds methods to a struct or enum',
    detail:
      'You define methods inside an impl block. Methods that take &self as the first parameter are called on instances, while associated functions without self act like static methods.',
  },
  {
    language: 'rust',
    tip: 'Vec<T> is a growable array stored on the heap',
    detail:
      'Vec dynamically resizes as you push elements. It owns its contents and drops them all when it goes out of scope. Use slices (&[T]) to borrow a view into a Vec.',
  },

  // --- JavaScript (10 tips) ---
  {
    language: 'javascript',
    tip: 'const prevents reassignment, but objects and arrays can still be mutated',
    detail:
      'const binds the variable name to a reference. You cannot reassign it, but the contents of an object or array it points to can still change. Use Object.freeze() for shallow immutability.',
  },
  {
    language: 'javascript',
    tip: 'Array.map() creates a new array by transforming each element',
    detail:
      'map() calls a function on every element and returns a new array of the results. It never modifies the original array, making it a key tool for functional-style programming.',
  },
  {
    language: 'javascript',
    tip: '=== checks both value and type, == only checks value with coercion',
    detail:
      'The loose equality operator == converts types before comparing, so 0 == "" is true. Strict equality === requires both type and value to match, which prevents unexpected results.',
  },
  {
    language: 'javascript',
    tip: 'Promises represent a value that may not exist yet',
    detail:
      'A Promise is in one of three states: pending, fulfilled, or rejected. You handle results with .then() and errors with .catch(). Promises enable non-blocking asynchronous code.',
  },
  {
    language: 'javascript',
    tip: 'async/await makes asynchronous code read like synchronous',
    detail:
      'An async function always returns a Promise. The await keyword pauses execution until the Promise resolves, letting you write cleaner code without deeply nested .then() chains.',
  },
  {
    language: 'javascript',
    tip: 'Destructuring lets you unpack values: const {a, b} = obj',
    detail:
      'Destructuring assignment extracts values from objects or arrays into distinct variables. You can also set default values and rename properties during extraction.',
  },
  {
    language: 'javascript',
    tip: 'Arrow functions do not have their own this context',
    detail:
      'Arrow functions inherit this from the enclosing scope. Traditional function declarations create their own this binding, which is why arrow functions are preferred in callbacks.',
  },
  {
    language: 'javascript',
    tip: 'The spread operator ... copies arrays and objects shallowly',
    detail:
      'Spread syntax creates a shallow copy, meaning nested objects still share references. For deep copies of plain objects, use structuredClone() in modern JavaScript.',
  },
  {
    language: 'javascript',
    tip: 'null is intentional absence, undefined means not yet assigned',
    detail:
      'Variables declared but not initialized are undefined. null is explicitly assigned to indicate no value. typeof null returns "object", which is a longstanding quirk of the language.',
  },
  {
    language: 'javascript',
    tip: 'Array.filter() creates a new array with elements that pass a test',
    detail:
      'filter() calls a predicate function on each element and returns a new array containing only the elements for which the function returned true. The original array is unchanged.',
  },

  // --- Python (10 tips) ---
  {
    language: 'python',
    tip: 'Indentation defines code blocks instead of braces',
    detail:
      'Python uses whitespace to delimit blocks of code. Consistent indentation (typically 4 spaces) is mandatory. Mixing tabs and spaces causes IndentationError.',
  },
  {
    language: 'python',
    tip: 'List comprehensions create lists in a single expression',
    detail:
      'The syntax [x*2 for x in range(5)] produces [0, 2, 4, 6, 8]. Comprehensions are often faster and more readable than equivalent for-loop-based list building.',
  },
  {
    language: 'python',
    tip: 'Everything in Python is an object, including functions and classes',
    detail:
      'Functions can be assigned to variables, passed as arguments, and stored in data structures. This makes Python highly flexible for patterns like decorators and callbacks.',
  },
  {
    language: 'python',
    tip: 'Tuples are immutable sequences, lists are mutable',
    detail:
      'Tuples use parentheses (1, 2, 3) and cannot be changed after creation. Lists use brackets [1, 2, 3] and support append, remove, and other in-place modifications.',
  },
  {
    language: 'python',
    tip: 'Use with statements to manage resources like files safely',
    detail:
      'The with statement ensures cleanup happens automatically. For files, with open("f.txt") as f: guarantees the file is closed even if an exception is raised inside the block.',
  },
  {
    language: 'python',
    tip: 'Dictionaries store key-value pairs with O(1) average lookup',
    detail:
      'Python dicts use hash tables internally. Keys must be hashable (strings, numbers, tuples). Since Python 3.7, dictionaries maintain insertion order as a language guarantee.',
  },
  {
    language: 'python',
    tip: 'Slicing with [start:stop:step] works on strings, lists, and tuples',
    detail:
      'my_list[1:4] returns elements at indices 1, 2, and 3. Negative indices count from the end. my_list[::-1] reverses the sequence. Slicing always returns a new object.',
  },
  {
    language: 'python',
    tip: 'Generators yield values lazily, saving memory on large datasets',
    detail:
      'A generator function uses yield instead of return. It produces values one at a time and pauses between each. This avoids loading an entire sequence into memory at once.',
  },
  {
    language: 'python',
    tip: 'The GIL allows only one thread to execute Python bytecode at a time',
    detail:
      'The Global Interpreter Lock means CPU-bound threads do not run in true parallel. Use the multiprocessing module for CPU-bound parallelism or asyncio for I/O-bound concurrency.',
  },
  {
    language: 'python',
    tip: 'f-strings format values inline: f"Hello {name}"',
    detail:
      'Introduced in Python 3.6, f-strings evaluate expressions inside curly braces at runtime. They are faster and more readable than .format() or percent-style formatting.',
  },

  // --- C++ (10 tips) ---
  {
    language: 'cpp',
    tip: 'RAII ties resource management to object lifetime',
    detail:
      'Resource Acquisition Is Initialization means constructors acquire resources and destructors release them. When an object goes out of scope, cleanup happens automatically.',
  },
  {
    language: 'cpp',
    tip: 'Use std::unique_ptr for single-owner heap objects',
    detail:
      'unique_ptr is a smart pointer that automatically deletes the object it owns when it goes out of scope. It cannot be copied, only moved, enforcing clear ownership.',
  },
  {
    language: 'cpp',
    tip: 'References must be initialized and cannot be reseated',
    detail:
      'A reference (int& r = x) is an alias for an existing variable. Unlike pointers, references cannot be null and always refer to the same object once bound.',
  },
  {
    language: 'cpp',
    tip: 'Templates let you write code that works with any type',
    detail:
      'template<typename T> generates specialized code at compile time for each type used. This enables generic containers and algorithms without runtime overhead.',
  },
  {
    language: 'cpp',
    tip: 'The const keyword prevents modification and enables compiler optimizations',
    detail:
      'Marking variables and parameters as const documents intent and catches accidental mutations at compile time. const methods promise not to modify the object state.',
  },
  {
    language: 'cpp',
    tip: 'std::vector is a dynamic array that manages its own memory',
    detail:
      'vector grows automatically when you push_back elements. It stores elements contiguously in memory for cache-friendly access and provides O(1) indexing.',
  },
  {
    language: 'cpp',
    tip: 'Move semantics transfer ownership instead of copying',
    detail:
      'std::move casts an object to an rvalue reference, allowing the move constructor to steal its resources. This avoids expensive deep copies of temporary objects.',
  },
  {
    language: 'cpp',
    tip: 'Virtual functions enable runtime polymorphism through vtables',
    detail:
      'Declaring a method virtual lets derived classes override it. The correct function is selected at runtime via the virtual table. Always make destructors virtual in base classes.',
  },
  {
    language: 'cpp',
    tip: 'The Standard Template Library provides containers and algorithms',
    detail:
      'The STL includes vector, map, set, and more, plus algorithms like sort, find, and transform. Using STL avoids reinventing common data structures and keeps code portable.',
  },
  {
    language: 'cpp',
    tip: 'Undefined behaviour means the compiler can do anything',
    detail:
      'Accessing out-of-bounds memory, signed integer overflow, and dereferencing null are all undefined behaviour. The compiler assumes UB never happens and may optimize based on that assumption.',
  },

  // --- CSS (10 tips) ---
  {
    language: 'css',
    tip: 'The box model is content + padding + border + margin',
    detail:
      'Every element is a rectangular box. By default, width and height set content size only. Use box-sizing: border-box to include padding and border in the element dimensions.',
  },
  {
    language: 'css',
    tip: 'Flexbox aligns items in a single row or column',
    detail:
      'Set display: flex on a container to enable flexible layout. Use justify-content for main-axis alignment and align-items for cross-axis alignment of child elements.',
  },
  {
    language: 'css',
    tip: 'CSS Grid creates two-dimensional layouts with rows and columns',
    detail:
      'display: grid lets you define rows and columns with grid-template-rows and grid-template-columns. Items can span multiple cells, making complex layouts straightforward.',
  },
  {
    language: 'css',
    tip: 'Specificity determines which styles win when rules conflict',
    detail:
      'Inline styles beat IDs, IDs beat classes, classes beat elements. When specificity ties, the last rule declared wins. Avoid !important as it breaks the natural cascade.',
  },
  {
    language: 'css',
    tip: 'CSS custom properties (variables) cascade through the DOM',
    detail:
      'Define variables with --name: value on a parent element and use them with var(--name). They inherit down the tree and can be overridden at any level.',
  },
  {
    language: 'css',
    tip: 'Transitions animate property changes smoothly over time',
    detail:
      'transition: opacity 0.3s ease animates opacity changes over 300 milliseconds. Only some properties can be transitioned. Combine with hover or class toggles for interactive effects.',
  },
  {
    language: 'css',
    tip: '@keyframes define multi-step animations',
    detail:
      'Use @keyframes name { from { } to { } } to define an animation, then apply it with animation: name 2s infinite. Keyframes support percentage stops for complex sequences.',
  },
  {
    language: 'css',
    tip: 'rem units are relative to the root font size, em units to the parent',
    detail:
      '1rem always equals the html element font size (usually 16px). 1em equals the computed font-size of the element itself. rem is more predictable for consistent sizing.',
  },
  {
    language: 'css',
    tip: 'Media queries apply styles based on viewport conditions',
    detail:
      '@media (max-width: 768px) { } applies styles only when the viewport is 768px wide or less. This is the foundation of responsive design for adapting layouts to different screens.',
  },
  {
    language: 'css',
    tip: 'position: relative creates a positioning context for children',
    detail:
      'A relatively positioned parent lets absolutely positioned children place themselves relative to that parent instead of the viewport. This is a key pattern for overlay and tooltip layouts.',
  },

  // --- Go (10 tips) ---
  {
    language: 'go',
    tip: 'Goroutines are lightweight threads managed by the Go runtime',
    detail:
      'Start a goroutine with the go keyword: go myFunc(). Goroutines use only a few kilobytes of stack and are multiplexed onto OS threads, so you can run thousands concurrently.',
  },
  {
    language: 'go',
    tip: 'Channels send and receive values between goroutines safely',
    detail:
      'Create a channel with make(chan int). Use ch <- value to send and value := <-ch to receive. Channels synchronize goroutines and prevent data races without explicit locks.',
  },
  {
    language: 'go',
    tip: 'Go has no classes; use structs with methods instead',
    detail:
      'Define a struct type and attach methods with a receiver: func (s MyStruct) Method(). Interfaces are satisfied implicitly by implementing all required methods.',
  },
  {
    language: 'go',
    tip: 'Errors are returned as values, not thrown as exceptions',
    detail:
      'Functions return an error as the last value: result, err := doWork(). The caller checks if err != nil to handle failures. This makes the error path explicit and visible.',
  },
  {
    language: 'go',
    tip: 'defer schedules a function call to run when the enclosing function returns',
    detail:
      'defer f.Close() ensures the file is closed no matter how the function exits. Deferred calls are executed in last-in-first-out order and are commonly used for cleanup.',
  },
  {
    language: 'go',
    tip: 'Slices are flexible views into underlying arrays',
    detail:
      'A slice has a length and capacity. Use append() to add elements, which may allocate a new backing array if capacity is exceeded. Slices are reference types and share underlying data.',
  },
  {
    language: 'go',
    tip: 'Interfaces in Go are satisfied implicitly without an implements keyword',
    detail:
      'If a type has all the methods an interface requires, it automatically satisfies that interface. This enables loose coupling and makes testing with mocks straightforward.',
  },
  {
    language: 'go',
    tip: 'The select statement waits on multiple channel operations',
    detail:
      'select blocks until one of its cases can proceed. If multiple are ready, one is chosen at random. A default case makes select non-blocking, useful for timeouts and polling.',
  },
  {
    language: 'go',
    tip: 'go fmt automatically formats your code to a standard style',
    detail:
      'Go enforces a single code style with the go fmt tool. Tabs for indentation, no debates about formatting. This eliminates style arguments and keeps all Go code visually consistent.',
  },
  {
    language: 'go',
    tip: 'Maps are built-in hash tables with O(1) average access',
    detail:
      'Declare a map with make(map[string]int). Access with m[key] and check existence with value, ok := m[key]. Maps are not safe for concurrent use; use sync.Map or a mutex.',
  },

  // --- TypeScript (10 tips) ---
  {
    language: 'typescript',
    tip: 'TypeScript adds static types to JavaScript and compiles to plain JS',
    detail:
      'Type annotations are checked at compile time and stripped from the output. This means zero runtime overhead while catching type errors before your code runs.',
  },
  {
    language: 'typescript',
    tip: 'Union types let a value be one of several types: string | number',
    detail:
      'Use unions to express that a variable can hold different types. TypeScript narrows the type inside conditional checks, so you can safely access type-specific properties.',
  },
  {
    language: 'typescript',
    tip: 'Type aliases create reusable type definitions with the type keyword',
    detail:
      'type Point = { x: number; y: number } defines a reusable shape. Aliases can represent unions, intersections, tuples, and mapped types for powerful type composition.',
  },
  {
    language: 'typescript',
    tip: 'Generics let you write functions and types that work with any type',
    detail:
      'function identity<T>(value: T): T returns whatever type is passed in. Generics preserve type information through function calls, avoiding the need for type assertions.',
  },
  {
    language: 'typescript',
    tip: 'Strict null checks prevent accessing properties on null or undefined',
    detail:
      'With strictNullChecks enabled, you must explicitly handle null and undefined. Use optional chaining (obj?.prop) and nullish coalescing (val ?? default) for safe access.',
  },
  {
    language: 'typescript',
    tip: 'Enums define a set of named constants: enum Direction { Up, Down }',
    detail:
      'Numeric enums auto-increment from 0. String enums require explicit values. const enums are inlined at compile time and produce no runtime object.',
  },
  {
    language: 'typescript',
    tip: 'Type guards narrow types in conditional blocks',
    detail:
      'typeof, instanceof, and custom type predicates (x is Type) narrow a union type inside an if block. This lets TypeScript know the exact type and allow safe property access.',
  },
  {
    language: 'typescript',
    tip: 'Utility types like Partial, Pick, and Omit transform existing types',
    detail:
      'Partial<T> makes all properties optional. Pick<T, "a" | "b"> selects specific properties. Record<K, V> creates an object type with keys K and values V.',
  },
  {
    language: 'typescript',
    tip: 'The as keyword performs type assertions when you know better than the compiler',
    detail:
      'Use const el = document.getElementById("app") as HTMLDivElement when you are certain of the type. Overusing assertions bypasses type safety, so prefer type guards instead.',
  },
  {
    language: 'typescript',
    tip: 'Discriminated unions use a shared literal field for exhaustive narrowing',
    detail:
      'Give each variant a kind or type field with a unique literal value. TypeScript can then narrow the union in switch statements and warn if a case is missing.',
  },

  // --- C (10 tips) ---
  {
    language: 'c',
    tip: 'Pointers store memory addresses and are dereferenced with *',
    detail:
      'int *p = &x stores the address of x. *p accesses the value at that address. Pointer arithmetic lets you traverse arrays efficiently, as arrays decay to pointers in most expressions.',
  },
  {
    language: 'c',
    tip: 'malloc allocates memory on the heap; always pair it with free',
    detail:
      'int *arr = malloc(n * sizeof(int)) reserves n integers on the heap. Forgetting to call free(arr) causes a memory leak. Always check if malloc returns NULL before using the pointer.',
  },
  {
    language: 'c',
    tip: 'Arrays in C have no bounds checking at runtime',
    detail:
      'Accessing an index outside the array size is undefined behaviour. C trusts the programmer to stay within bounds. Buffer overflow vulnerabilities come from this lack of safety.',
  },
  {
    language: 'c',
    tip: 'Strings are null-terminated arrays of characters',
    detail:
      'A C string is a char array ending with the byte 0x00. The strlen function counts characters until it hits the null terminator. Forgetting the terminator causes reads past the buffer.',
  },
  {
    language: 'c',
    tip: 'The preprocessor runs before compilation and handles #include and #define',
    detail:
      '#include copies the contents of a header file into your source. #define creates macros that are text-substituted. Use include guards (#ifndef) to prevent duplicate definitions.',
  },
  {
    language: 'c',
    tip: 'struct groups related variables into a single composite type',
    detail:
      'struct Point { int x; int y; }; creates a type holding two integers. Access members with dot notation (p.x) for values or arrow notation (p->x) for pointers to structs.',
  },
  {
    language: 'c',
    tip: 'sizeof returns the size in bytes of a type or variable at compile time',
    detail:
      'sizeof(int) is typically 4 bytes on modern platforms. Always use sizeof when allocating memory or iterating over arrays to keep code portable across different architectures.',
  },
  {
    language: 'c',
    tip: 'The stack is fast and automatic, the heap is flexible but manual',
    detail:
      'Local variables live on the stack and are freed when the function returns. Heap memory from malloc persists until you call free. Stack allocation is faster but limited in size.',
  },
  {
    language: 'c',
    tip: 'Function pointers store the address of a function for callbacks',
    detail:
      'void (*fp)(int) = &myFunc declares a pointer to a function taking int and returning void. Function pointers enable callback patterns and are the basis for polymorphism in C.',
  },
  {
    language: 'c',
    tip: 'Bitwise operators manipulate individual bits: &, |, ^, ~, <<, >>',
    detail:
      'Use & for masking, | for setting bits, ^ for toggling, and << / >> for shifting. Bit manipulation is essential for low-level programming, hardware registers, and efficient flags.',
  },

  // --- Haskell (10 tips) ---
  {
    language: 'haskell',
    tip: 'Functions in Haskell are pure by default with no side effects',
    detail:
      'A pure function always returns the same output for the same input and changes nothing outside itself. Side effects are isolated in the IO monad, keeping most code predictable.',
  },
  {
    language: 'haskell',
    tip: 'Pattern matching deconstructs values and selects behaviour',
    detail:
      'Define multiple equations for a function based on input shape: factorial 0 = 1; factorial n = n * factorial (n-1). The compiler warns if patterns are non-exhaustive.',
  },
  {
    language: 'haskell',
    tip: 'Haskell is lazily evaluated: values are computed only when needed',
    detail:
      'Expressions are not evaluated until their result is required. This enables infinite data structures like [1..] and avoids unnecessary computation, but can cause space leaks if misused.',
  },
  {
    language: 'haskell',
    tip: 'Type classes define shared behaviour, like interfaces in other languages',
    detail:
      'class Eq a where (==) :: a -> a -> Bool defines an equality interface. Types opt in with instance declarations. Type classes power overloading for show, compare, and more.',
  },
  {
    language: 'haskell',
    tip: 'The Maybe type handles absence: Just value or Nothing',
    detail:
      'Maybe replaces null in other languages. Functions that might fail return Maybe a, forcing callers to handle the Nothing case. Use fmap or >>= to chain operations on Maybe values.',
  },
  {
    language: 'haskell',
    tip: 'All variables in Haskell are immutable once bound',
    detail:
      'You cannot reassign a variable after it is defined. Instead of mutation, you create new values derived from existing ones. This eliminates entire categories of bugs related to shared state.',
  },
  {
    language: 'haskell',
    tip: 'List comprehensions filter and transform lists concisely',
    detail:
      '[x*2 | x <- [1..10], even x] produces [4, 8, 12, 16, 20]. Guards filter elements and the notation closely mirrors set-builder notation from mathematics.',
  },
  {
    language: 'haskell',
    tip: 'Currying means every function takes exactly one argument',
    detail:
      'A function add x y is actually a chain: add takes x and returns a function that takes y. This makes partial application natural: map (add 1) [1,2,3] gives [2,3,4].',
  },
  {
    language: 'haskell',
    tip: 'The type system catches errors at compile time without running code',
    detail:
      'Haskell infers types automatically with Hindley-Milner inference. Adding explicit type signatures serves as documentation and helps the compiler give clearer error messages.',
  },
  {
    language: 'haskell',
    tip: 'Monads sequence computations that carry context like state or failure',
    detail:
      'The >>= (bind) operator chains monadic operations. IO monad sequences side effects. Maybe monad short-circuits on Nothing. The do notation provides syntactic sugar for monadic code.',
  },

  // --- Lua (10 tips) ---
  {
    language: 'lua',
    tip: 'Tables are the only data structure in Lua and serve as arrays and maps',
    detail:
      'A Lua table can be used as an array ({1, 2, 3}), a dictionary ({name = "bot"}), or an object with methods. Tables are the foundation of all complex data in Lua.',
  },
  {
    language: 'lua',
    tip: 'Lua arrays are 1-indexed, not 0-indexed',
    detail:
      'The first element of a table used as an array is t[1], not t[0]. The # length operator and standard library functions all assume 1-based indexing.',
  },
  {
    language: 'lua',
    tip: 'Functions are first-class values that can be stored in variables',
    detail:
      'You can assign functions to table fields, pass them as arguments, and return them from other functions. This makes Lua highly flexible for callback-driven designs.',
  },
  {
    language: 'lua',
    tip: 'Metatables add custom behaviour to tables, enabling OOP patterns',
    detail:
      'Set a metatable with setmetatable(t, mt). The __index metamethod enables inheritance by redirecting failed lookups to another table. This is how classes are implemented in Lua.',
  },
  {
    language: 'lua',
    tip: 'Lua uses nil to represent absence; accessing missing keys returns nil',
    detail:
      'Any table key that has not been set returns nil. Setting a key to nil effectively deletes it from the table. There is no separate undefined concept.',
  },
  {
    language: 'lua',
    tip: 'Coroutines provide cooperative multitasking within a single thread',
    detail:
      'Create a coroutine with coroutine.create() and resume it with coroutine.resume(). The coroutine yields control back with coroutine.yield(). Unlike threads, only one coroutine runs at a time.',
  },
  {
    language: 'lua',
    tip: 'Local variables are scoped to their block; globals are the default',
    detail:
      'Without the local keyword, variables are global. Always use local x = 10 to limit scope. Local variables are also faster because they are stored in CPU registers.',
  },
  {
    language: 'lua',
    tip: 'String patterns in Lua use % instead of \\ for special characters',
    detail:
      'Lua patterns use %d for digits, %s for whitespace, and %a for letters. The string.match and string.gmatch functions support these patterns for text searching and extraction.',
  },
  {
    language: 'lua',
    tip: 'Multiple return values are a native feature of Lua functions',
    detail:
      'A function can return several values: return x, y, z. The caller captures them with a, b, c = myFunc(). Extra values are discarded, and missing ones become nil.',
  },
  {
    language: 'lua',
    tip: 'Lua is designed for embedding and is the most popular game scripting language',
    detail:
      'The Lua runtime is tiny (under 300KB) and has a clean C API. Games like World of Warcraft, Roblox, and many others use Lua for modding and scripting game logic.',
  },
];
