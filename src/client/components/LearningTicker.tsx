// ============================================================
// Binary Boxer — LearningTicker Component
// Cycling educational tips related to the player's two languages
// ============================================================

import { useState, useEffect, useCallback, type ReactElement } from 'react';

type LearningTickerProps = {
  language1: string;
  language2: string;
};

// --- 10 tips per language, synced with server/data/tips.ts ---

const TIPS: Record<string, string[]> = {
  rust: [
    'Ownership means each value has exactly one owner at a time',
    'Use &reference to borrow a value without taking ownership',
    'match expressions must cover every possible case',
    'String is heap-allocated, &str is a string slice reference',
    'Option<T> replaces null with Some(value) or None',
    'Result<T, E> handles errors with Ok(value) or Err(error)',
    'Lifetimes tell the compiler how long references are valid',
    'The compiler catches data races at compile time',
    'impl adds methods to a struct or enum',
    'Vec<T> is a growable array stored on the heap',
  ],
  javascript: [
    'const prevents reassignment, but objects and arrays can still be mutated',
    'Array.map() creates a new array by transforming each element',
    '=== checks both value and type, == only checks value with coercion',
    'Promises represent a value that may not exist yet',
    'async/await makes asynchronous code read like synchronous',
    'Destructuring lets you unpack values: const {a, b} = obj',
    'Arrow functions do not have their own this context',
    'The spread operator ... copies arrays and objects shallowly',
    'null is intentional absence, undefined means not yet assigned',
    'Array.filter() creates a new array with elements that pass a test',
  ],
  python: [
    'Indentation defines code blocks instead of braces',
    'List comprehensions create lists in a single expression',
    'Everything in Python is an object, including functions and classes',
    'Tuples are immutable sequences, lists are mutable',
    'Use with statements to manage resources like files safely',
    'Dictionaries store key-value pairs with O(1) average lookup',
    'Slicing with [start:stop:step] works on strings, lists, and tuples',
    'Generators yield values lazily, saving memory on large datasets',
    'The GIL allows only one thread to execute Python bytecode at a time',
    'f-strings format values inline: f"Hello {name}"',
  ],
  cpp: [
    'RAII ties resource management to object lifetime',
    'Use std::unique_ptr for single-owner heap objects',
    'References must be initialized and cannot be reseated',
    'Templates let you write code that works with any type',
    'The const keyword prevents modification and enables compiler optimizations',
    'std::vector is a dynamic array that manages its own memory',
    'Move semantics transfer ownership instead of copying',
    'Virtual functions enable runtime polymorphism through vtables',
    'The Standard Template Library provides containers and algorithms',
    'Undefined behaviour means the compiler can do anything',
  ],
  css: [
    'The box model is content + padding + border + margin',
    'Flexbox aligns items in a single row or column',
    'CSS Grid creates two-dimensional layouts with rows and columns',
    'Specificity determines which styles win when rules conflict',
    'CSS custom properties (variables) cascade through the DOM',
    'Transitions animate property changes smoothly over time',
    '@keyframes define multi-step animations',
    'rem units are relative to the root font size, em units to the parent',
    'Media queries apply styles based on viewport conditions',
    'position: relative creates a positioning context for children',
  ],
  go: [
    'Goroutines are lightweight threads managed by the Go runtime',
    'Channels send and receive values between goroutines safely',
    'Go has no classes; use structs with methods instead',
    'Errors are returned as values, not thrown as exceptions',
    'defer schedules a function call to run when the enclosing function returns',
    'Slices are flexible views into underlying arrays',
    'Interfaces in Go are satisfied implicitly without an implements keyword',
    'The select statement waits on multiple channel operations',
    'go fmt automatically formats your code to a standard style',
    'Maps are built-in hash tables with O(1) average access',
  ],
  typescript: [
    'TypeScript adds static types to JavaScript and compiles to plain JS',
    'Union types let a value be one of several types: string | number',
    'Type aliases create reusable type definitions with the type keyword',
    'Generics let you write functions and types that work with any type',
    'Strict null checks prevent accessing properties on null or undefined',
    'Enums define a set of named constants: enum Direction { Up, Down }',
    'Type guards narrow types in conditional blocks',
    'Utility types like Partial, Pick, and Omit transform existing types',
    'The as keyword performs type assertions when you know better than the compiler',
    'Discriminated unions use a shared literal field for exhaustive narrowing',
  ],
  c: [
    'Pointers store memory addresses and are dereferenced with *',
    'malloc allocates memory on the heap; always pair it with free',
    'Arrays in C have no bounds checking at runtime',
    'Strings are null-terminated arrays of characters',
    'The preprocessor runs before compilation and handles #include and #define',
    'struct groups related variables into a single composite type',
    'sizeof returns the size in bytes of a type or variable at compile time',
    'The stack is fast and automatic, the heap is flexible but manual',
    'Function pointers store the address of a function for callbacks',
    'Bitwise operators manipulate individual bits: &, |, ^, ~, <<, >>',
  ],
  haskell: [
    'Functions in Haskell are pure by default with no side effects',
    'Pattern matching deconstructs values and selects behaviour',
    'Haskell is lazily evaluated: values are computed only when needed',
    'Type classes define shared behaviour, like interfaces in other languages',
    'The Maybe type handles absence: Just value or Nothing',
    'All variables in Haskell are immutable once bound',
    'List comprehensions filter and transform lists concisely',
    'Currying means every function takes exactly one argument',
    'The type system catches errors at compile time without running code',
    'Monads sequence computations that carry context like state or failure',
  ],
  lua: [
    'Tables are the only data structure in Lua and serve as arrays and maps',
    'Lua arrays are 1-indexed, not 0-indexed',
    'Functions are first-class values that can be stored in variables',
    'Metatables add custom behaviour to tables, enabling OOP patterns',
    'Lua uses nil to represent absence; accessing missing keys returns nil',
    'Coroutines provide cooperative multitasking within a single thread',
    'Local variables are scoped to their block; globals are the default',
    'String patterns in Lua use % instead of \\\\ for special characters',
    'Multiple return values are a native feature of Lua functions',
    'Lua is designed for embedding and is the most popular game scripting language',
  ],
};

const CYCLE_INTERVAL_MS = 8000;
const FADE_DURATION_MS = 500;

export const LearningTicker = ({
  language1,
  language2,
}: LearningTickerProps): ReactElement => {
  // Build a combined tip pool from both languages
  const tipPool = useCallback((): Array<{ language: string; tip: string }> => {
    const pool: Array<{ language: string; tip: string }> = [];
    const lang1Key = language1.toLowerCase();
    const lang2Key = language2.toLowerCase();

    const lang1Tips = TIPS[lang1Key] ?? [];
    const lang2Tips = TIPS[lang2Key] ?? [];

    for (const tip of lang1Tips) {
      pool.push({ language: language1.toUpperCase(), tip });
    }
    for (const tip of lang2Tips) {
      pool.push({ language: language2.toUpperCase(), tip });
    }

    return pool;
  }, [language1, language2]);

  const pool = tipPool();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (pool.length === 0) return;

    const interval = setInterval(() => {
      // Start fade out
      setIsFading(true);

      // After fade completes, change tip and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % pool.length);
        setIsFading(false);
      }, FADE_DURATION_MS);
    }, CYCLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pool.length]);

  if (pool.length === 0) {
    return <div style={{ height: '24px' }} />;
  }

  const currentTip = pool[currentIndex % pool.length];

  if (!currentTip) {
    return <div style={{ height: '24px' }} />;
  }

  return (
    <div
      className="bb-panel"
      style={{ padding: 'var(--bb-space-xs) var(--bb-space-md)', fontSize: '0.72rem', overflow: 'hidden', minHeight: '28px' }}
    >
      <div
        style={{ opacity: isFading ? 0 : 1, transition: 'opacity 500ms' }}
      >
        <span style={{ color: 'var(--bb-text-dim)', marginRight: '4px' }}>{'>'}</span>
        <span style={{ color: 'var(--bb-xp)', fontWeight: 700, marginRight: '4px' }}>
          [{currentTip.language}]
        </span>
        <span style={{ color: 'var(--bb-text-secondary)' }}>{currentTip.tip}</span>
      </div>
    </div>
  );
};
