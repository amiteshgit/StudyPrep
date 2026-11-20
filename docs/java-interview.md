---
id: java-interview
slug: /java-interview
title: Java Interview Questions
sidebar_label: Java
sidebar_position: 3
description: Popular Java interview questions with simple answers and code.
---

# Java Interview Questions

Spring Boot is built on Java, so interviewers move between the two all the time. This page covers the Java questions that come up most, in an order that builds on itself: **the language**, then **strings**, **collections**, **generics and streams**, **memory and the JVM**, **concurrency**, **modern Java**, and **good design**.

Each answer begins with a short line you can say out loud, then explains the idea.

:::tip[How to use this page]
Pick a section, read the answers, and run the code. If you can explain *why* something works the way it does, not just *what* it does, you are ready for a senior interview.
:::

---

## 1. Core Language and OOP

We begin with the things every Java developer must explain clearly.

### 1. JDK vs JRE vs JVM?

**In short:** The JVM runs your program. The JRE is the JVM plus libraries. The JDK is the JRE plus tools to build programs.

- **JVM:** runs bytecode (`.class` files). It also handles memory and garbage collection.
- **JRE:** the JVM and the standard libraries. Needed to run Java.
- **JDK:** the JRE plus the compiler (`javac`), `jar`, `jcmd`, and other tools. Needed to develop.

Today you normally install a JDK only, since separate JREs are no longer shipped.

### 2. What is the difference between `==` and `equals()`?

**In short:** `==` compares **references** (the same object?). `equals()` compares **content**, if the class defines it.

```java
String a = new String("java");
String b = new String("java");

System.out.println(a == b);        // false: two different objects
System.out.println(a.equals(b));   // true: same characters
```

For primitives (`int`, `double`, ...), `==` compares the values.

### 3. What is the `equals()` and `hashCode()` contract?

**In short:** Equal objects **must** have the same hash code. If you override one, override both.

The rules: `equals` must be reflexive, symmetric, transitive, and consistent. And if `a.equals(b)`, then `a.hashCode() == b.hashCode()`.

```java
public final class Point {
    private final int x, y;

    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }

    @Override public int hashCode() { return Objects.hash(x, y); }
}
```

:::warning[What goes wrong]
If you break the contract, a `HashMap` or `HashSet` may not find an object you just put in. A `record` writes both methods for you.
:::

### 4. Abstract class vs interface?

**In short:** An interface describes **what** something can do. An abstract class is a **partial base** with shared state and code.

| | Abstract class | Interface |
| --- | --- | --- |
| State (fields) | Yes | Only constants |
| Constructors | Yes | No |
| Inherit from | One class only | Many interfaces |
| Method bodies | Yes | `default`, `static`, `private` methods |

Use an interface for a contract. Use an abstract class when subclasses share fields or common code.

### 5. Is Java pass-by-value or pass-by-reference?

**In short:** Always pass-by-value. For objects, the *value* that is copied is the reference.

```java
static void change(StringBuilder sb, int n) {
    sb.append("!");     // changes the real object
    sb = new StringBuilder("new");   // changes only the local copy of the reference
    n = 99;             // changes only the local copy
}
```

After the call, the caller's `StringBuilder` has the `!` added, but it is still the same object, and `n` is unchanged.

### 6. Overloading vs overriding?

**In short:** Overloading is chosen at **compile time** (same name, different parameters). Overriding is chosen at **run time** (a subclass replaces a method).

```java
class Animal { String sound() { return "..."; } }
class Dog extends Animal { @Override String sound() { return "Woof"; } }

Animal a = new Dog();
a.sound();   // "Woof": the real object type decides (overriding)
```

### 7. `final`, `finally`, and `finalize()`?

**In short:** Three unrelated things with similar names.

- `final`: a variable that cannot be reassigned, a method that cannot be overridden, or a class that cannot be extended.
- `finally`: a block that runs after `try`, whether or not an exception happened.
- `finalize()`: an old cleanup hook, now deprecated for removal. Do not use it. Use `try-with-resources` or `Cleaner`.

### 8. Checked vs unchecked exceptions?

**In short:** Checked exceptions must be handled or declared. Unchecked ones (runtime exceptions) need not be.

- **Checked** (`IOException`): the caller can reasonably recover.
- **Unchecked** (`NullPointerException`, `IllegalArgumentException`): usually a bug.

Always close resources with try-with-resources:

```java
try (var reader = Files.newBufferedReader(path)) {
    return reader.readLine();
}   // reader is closed automatically, even if an exception happens
```

Good habits: catch specific exceptions, never swallow them silently, and keep the original as the `cause` when you wrap one.

---

## 2. Strings

Strings are used everywhere, and they hide some of the best interview questions.

### 9. Why is `String` immutable?

**In short:** Safety, speed, and sharing.

- **String pool:** identical literals can share one object, which only works if nobody can change it.
- **Thread safety:** immutable objects can be shared freely.
- **Security:** values like file paths and class names cannot be changed after they are checked.
- **Cached hash code:** the hash is computed once, which makes strings fast `HashMap` keys.

### 10. What is the String pool? What does `new String("a")` do?

**In short:** Literals live in a shared pool. `new String(...)` always creates a separate object.

```java
String a = "java";
String b = "java";
String c = new String("java");

a == b;            // true: same pooled object
a == c;            // false: c is a new object
a == c.intern();   // true: intern() returns the pooled one
```

### 11. `String` vs `StringBuilder` vs `StringBuffer`?

**In short:** `String` cannot change. `StringBuilder` is a fast changeable string. `StringBuffer` is the same but synchronized (slower, rarely needed).

```java
StringBuilder sb = new StringBuilder();
for (String word : words) {
    sb.append(word).append(' ');
}
String result = sb.toString();
```

Using `+=` on a `String` inside a loop creates a new object each time. Use a `StringBuilder` there.

---

## 3. Collections

Next, the collections framework. These questions test whether you know what is happening *inside* the classes you use every day.

### 12. How does `HashMap` work internally?

**In short:** It is an array of buckets. The key's hash picks the bucket. Collisions are chained in a list that becomes a tree when it gets long.

1. `hashCode()` of the key is spread, then `index = (n - 1) & hash` picks a bucket.
2. If the bucket is empty, the entry goes there. If not, Java compares keys with `equals()` and either replaces the value or adds to the chain.
3. When a bucket reaches 8 entries (and the table is big enough, 64+), the chain becomes a red-black tree. Worst-case lookup improves from O(n) to O(log n).
4. When the map is more than 75% full (the load factor 0.75), the table **doubles** and entries are redistributed.

It allows one `null` key and is **not thread-safe**.

### 13. `HashMap` vs `ConcurrentHashMap` vs `Hashtable`?

**In short:** Use `ConcurrentHashMap` when many threads share a map.

- **`HashMap`:** fast, not thread-safe. Concurrent writes can corrupt it.
- **`Hashtable`:** every method locks the whole map. Old and slow.
- **`ConcurrentHashMap`:** reads need no lock. Writes lock only a small part (since Java 8, a single bucket, using CAS and `synchronized`). It does **not** allow null keys or values.

```java
Map<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge("java", 1, Integer::sum);   // atomic update
```

### 14. `ArrayList` vs `LinkedList`?

**In short:** Use `ArrayList` almost always.

| | ArrayList | LinkedList |
| --- | --- | --- |
| Get by index | O(1) | O(n) |
| Add at end | O(1) on average | O(1) |
| Insert/remove in middle | O(n) (shifts items) | O(1) *after* finding the spot (which is O(n)) |
| Memory | Compact | Extra object per item |

`ArrayList` is also better for the CPU cache, so it wins in practice, even where the theory says otherwise.

### 15. What is fail-fast, and how do you remove items safely?

**In short:** Changing a list while looping over it throws `ConcurrentModificationException`. Use `removeIf` or an iterator.

```java
// WRONG: throws ConcurrentModificationException
for (String s : list) {
    if (s.isEmpty()) list.remove(s);
}

// RIGHT
list.removeIf(String::isEmpty);
```

Iterators of `ArrayList` and `HashMap` are fail-fast (they check a modification counter). Iterators of `ConcurrentHashMap` and `CopyOnWriteArrayList` never throw it. They see a snapshot or a weakly consistent view.

### 16. `Comparable` vs `Comparator`?

**In short:** `Comparable` is the class's **natural order**. `Comparator` is an **outside** way to compare, so you can have many.

```java
record Person(String name, int age) { }

people.sort(Comparator.comparing(Person::age)
                      .thenComparing(Person::name));
```

### 17. Which `Map` should I use: `HashMap`, `LinkedHashMap`, or `TreeMap`?

**In short:** Pick by the order you need.

- `HashMap`: no order, fastest.
- `LinkedHashMap`: keeps insertion order (or access order, which is useful for caches).
- `TreeMap`: sorted by key, O(log n).

A small LRU cache using `LinkedHashMap`:

```java
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int max;

    LruCache(int max) {
        super(16, 0.75f, true);      // true = access order
        this.max = max;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > max;         // drop the least recently used
    }
}
```

### 18. What is the difference between `List.of()` and `Collections.unmodifiableList()`?

**In short:** `List.of()` is truly immutable. `unmodifiableList` is only a read-only **view** of a list that can still change underneath.

```java
List<String> original = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(original);
original.add("c");
System.out.println(view);   // [a, b, c]: the view changed!
```

---

## 4. Generics, Lambdas and Streams

Collections hold objects of some type. Generics make that type-safe, and lambdas and streams give us short, readable ways to work with them.

### 19. What is type erasure?

**In short:** Generic types are checked by the compiler, then **removed** from the compiled code.

At run time, `List<String>` and `List<Integer>` are both just `List`. This is why you cannot do these things:

```java
new T();                         // no: T is unknown at run time
if (obj instanceof List<String>) // no: the type argument is erased
```

It was done to keep old code (from before generics) working.

### 20. What does `? extends T` vs `? super T` mean (PECS)?

**In short:** **P**roducer **E**xtends, **C**onsumer **S**uper. Use `extends` to read from a collection, and `super` to write into it.

```java
// source PRODUCES numbers: extends. dest CONSUMES numbers: super.
static void copy(List<? extends Number> source, List<? super Number> dest) {
    for (Number n : source) {
        dest.add(n);
    }
}
```

### 21. What is a functional interface? Name the common ones.

**In short:** An interface with exactly one abstract method. A lambda can stand in for it.

| Interface | Shape | Example |
| --- | --- | --- |
| `Function<T, R>` | T in, R out | `s -> s.length()` |
| `Predicate<T>` | T in, boolean out | `s -> s.isEmpty()` |
| `Consumer<T>` | T in, nothing out | `s -> System.out.println(s)` |
| `Supplier<T>` | nothing in, T out | `() -> new ArrayList<>()` |

A lambda can use outside variables only if they are **effectively final** (never reassigned).

### 22. How do streams work? What is "lazy"?

**In short:** A stream is a pipeline. Intermediate steps (`filter`, `map`) do nothing until a terminal step (`collect`, `count`) starts it.

```java
Map<String, Double> avgSalaryByDept = employees.stream()
        .filter(e -> e.active())
        .collect(Collectors.groupingBy(
                Employee::dept,
                Collectors.averagingDouble(Employee::salary)));
```

Remember:

- A stream can be used **once**.
- Items flow through the pipeline one by one, so a `limit(3)` can stop work early.
- Streams do not change the original collection.

### 23. `map` vs `flatMap`?

**In short:** `map` changes each item into **one** item. `flatMap` changes each item into a **stream** and joins them all together.

```java
List<List<String>> nested = List.of(List.of("a", "b"), List.of("c"));

nested.stream().flatMap(List::stream).toList();   // [a, b, c]
```

### 24. When should you avoid parallel streams?

**In short:** When the work is small, blocking, or shares state.

Parallel streams use the shared common ForkJoin pool. One slow or blocking task can hold up other parts of the app. They help only for large, CPU-heavy, independent work. Always measure. Never change a shared variable inside a parallel stream.

### 25. How should you use `Optional`?

**In short:** As a **return type** that says "there might be no value". Not for fields or parameters.

```java
String city = findUser(id)
        .map(User::address)
        .map(Address::city)
        .orElse("Unknown");
```

- Prefer `orElseGet(() -> compute())` when the fallback is expensive. `orElse(compute())` always computes it.
- Avoid calling `get()` without checking. Use `orElseThrow()`.

---

## 5. Memory, Garbage Collection and the JVM

Now we look under the hood. These questions show whether you can find and fix problems that code review alone will not catch.

### 26. What lives on the heap and what lives on the stack?

**In short:** Objects live on the **heap** (shared). Method calls, local variables, and references live on each thread's **stack**.

- **Heap:** all objects. Managed by the garbage collector.
- **Stack:** one per thread. Holds a frame per method call. A very deep recursion causes `StackOverflowError`.
- **Metaspace:** class information. It replaced PermGen in Java 8 and uses native memory.

### 27. How does garbage collection work?

**In short:** The GC finds objects that nothing can reach any more, and frees their memory.

Most objects die young, so the heap is split into a **young** area (collected often, cheaply) and an **old** area (collected less often). Objects that survive several young collections move to the old area.

Common collectors:

- **G1:** the default since Java 9. Balances pause time and speed.
- **ZGC / Shenandoah:** very short pauses, good for large heaps. Java 21 added generational ZGC.
- **Parallel:** maximum throughput, longer pauses.

### 28. Can Java have memory leaks?

**In short:** Yes. The GC only frees objects nobody can reach. A leak is an object you can still reach but no longer need.

Usual causes:

- A `static` map or list that only ever grows.
- Listeners or callbacks that are never removed.
- `ThreadLocal` values left in a thread pool (call `remove()`).
- Caches with no size limit or expiry.
- Streams, connections, or files not closed.

To investigate: turn on `-XX:+HeapDumpOnOutOfMemoryError`, then open the dump in Eclipse MAT and look for what holds the most memory.

### 29. Strong, soft, weak, and phantom references?

**In short:** They control how willing the GC is to free an object.

| Type | Freed when |
| --- | --- |
| Strong (normal) | Never, while reachable |
| Soft | The JVM is low on memory (good for caches) |
| Weak | At the next GC if nothing strong points to it (`WeakHashMap`) |
| Phantom | After the object is finalized; used for cleanup hooks |

### 30. What is the JIT compiler?

**In short:** It compiles your "hot" bytecode into fast machine code while the app runs.

The JVM first interprets bytecode. It counts how often methods run, and compiles the busy ones (C1, then C2 for the hottest). That is why Java apps start slower and then speed up, and why benchmarks need a **warm-up**.

### 31. How do class loaders work?

**In short:** They load classes on demand, and they ask their **parent first**.

The chain is: bootstrap (core Java), platform, then application (your classes). A request goes up to the parent first, so you cannot replace `java.lang.String` with your own version. Frameworks like application servers use extra loaders to keep different apps apart.

### 32. What types of `OutOfMemoryError` are there, and what do you do?

**In short:** Read the message after the error. It tells you which area ran out.

- `Java heap space`: too many objects (or a leak). Take a heap dump.
- `Metaspace`: too many classes loaded (often a class loader leak).
- `unable to create native thread`: too many threads, or an OS limit.

Do not just raise `-Xmx` and hope. Find out *what* is using the memory first.

---

## 6. Concurrency

Every server app runs many things at once. This section starts with the basic tools, then moves to thread pools, and ends with virtual threads.

### 33. `synchronized` vs `ReentrantLock`?

**In short:** `synchronized` is simple and automatic. `ReentrantLock` gives you more control, but you must unlock it yourself.

| | `synchronized` | `ReentrantLock` |
| --- | --- | --- |
| Unlock | Automatic | You, in `finally` |
| Try without waiting | No | `tryLock()` |
| Timeout / interrupt | No | Yes |
| Fair ordering | No | Optional |

```java
lock.lock();
try {
    balance += amount;
} finally {
    lock.unlock();    // always unlock in finally
}
```

### 34. What does `volatile` do? Does it make `count++` safe?

**In short:** `volatile` makes sure every thread **sees the latest value**. It does **not** make a multi-step action atomic.

```java
private volatile boolean running = true;   // good use: a stop flag

void stop() { running = false; }
void work() { while (running) { /* ... */ } }
```

`count++` is three steps (read, add, write), so two threads can lose an update, even with `volatile`. Use `AtomicInteger`, or `LongAdder` when many threads update the same counter.

### 35. What does the Java Memory Model say about "happens-before"?

**In short:** It lists when one thread's changes are **guaranteed** to be visible to another.

Examples of a happens-before link: unlocking a monitor then locking the same one, writing a `volatile` then reading it, `Thread.start()` then the new thread's code, and a thread's end then `join()` returning. Without such a link, a thread may see stale values or see steps happen in a different order.

### 36. How does a `ThreadPoolExecutor` work? Which settings matter?

**In short:** It uses core threads first, then a queue, then extra threads up to a maximum, and finally rejects.

```java
ExecutorService pool = new ThreadPoolExecutor(
        4,                                    // core threads
        8,                                    // max threads
        60, TimeUnit.SECONDS,                 // idle time for extra threads
        new ArrayBlockingQueue<>(100),        // bounded queue
        new ThreadPoolExecutor.CallerRunsPolicy());   // what to do when full
```

:::warning[Why not just use `Executors.newFixedThreadPool`?]
It uses an **unbounded** queue, so a slow system keeps accepting work until memory runs out. `newCachedThreadPool` can create unlimited threads. For production, build a pool with a bounded queue like the one above.
:::

### 37. What is a deadlock, and how do you avoid it?

**In short:** Two threads each hold a lock the other one needs, and both wait forever.

```java
// Thread 1: locks A, then B        Thread 2: locks B, then A  -> deadlock
synchronized (a) {
    synchronized (b) { transfer(); }
}
```

Ways to avoid it:

- Always take locks in the **same order**.
- Use `tryLock(timeout)` and back off if you cannot get both.
- Hold locks for the shortest time, and take fewer of them.

To find one in a running app, take a thread dump (`jstack` or `jcmd Thread.print`). The JVM reports deadlocks it detects.

### 38. How do you combine async results with `CompletableFuture`?

**In short:** Start tasks, then chain or join them without blocking in the middle.

```java
CompletableFuture<User> user =
        CompletableFuture.supplyAsync(() -> userClient.get(id), executor);
CompletableFuture<List<Order>> orders =
        CompletableFuture.supplyAsync(() -> orderClient.list(id), executor);

Profile profile = user.thenCombine(orders, Profile::new)
                      .exceptionally(ex -> Profile.empty())
                      .join();
```

Pass your own executor for blocking calls. Without it, the shared common pool is used, which is not meant for that.

### 39. `CountDownLatch`, `CyclicBarrier`, `Semaphore`: what are they for?

**In short:** They help threads wait for each other.

- `CountDownLatch`: wait until N things finish. Used **once**.
- `CyclicBarrier`: N threads wait for each other at a meeting point. Can be **reused**.
- `Semaphore`: allow at most N threads into a section (like limiting connections).

### 40. What are virtual threads, and when should you use them?

**In short:** Very cheap threads (Java 21) that make blocking code scale, without callbacks.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> callSlowService());   // each task gets its own thread
    }
}
```

- **Good for:** many tasks that mostly **wait** (HTTP, database).
- **Not for:** heavy CPU work. More threads will not add more CPU.
- **Do not pool them.** Create one per task.
- Watch for pinning: a long `synchronized` block around a blocking call can hold the real thread.

---

## 7. Modern Java

The language has changed a lot since Java 8. Interviewers want to know that you write today's Java, not yesterday's.

### 41. What are the main features added since Java 8?

**In short:** Less boilerplate, better data modelling, and cheaper concurrency.

| Version | Feature |
| --- | --- |
| 8 | Lambdas, streams, `Optional`, default methods, `java.time` |
| 9 | Modules, `List.of`, `Map.of` |
| 10 | `var` for local variables |
| 11 | New `HttpClient`, more `String` methods |
| 14 | Switch expressions |
| 15 | Text blocks |
| 16 | Records, pattern matching for `instanceof` |
| 17 | Sealed classes |
| 21 | Virtual threads, pattern matching for `switch`, record patterns, sequenced collections |

The long-term support (LTS) versions are 8, 11, 17, 21, and 25.

### 42. What are records, sealed types, and pattern matching, and how do they work together?

**In short:** Records hold data. Sealed types list **all** the possible subtypes. Pattern matching lets a `switch` use both, and the compiler checks you covered every case.

```java
sealed interface Shape permits Circle, Rectangle { }
record Circle(double radius) implements Shape { }
record Rectangle(double width, double height) implements Shape { }

static double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
    };    // no default needed: the compiler knows these are all the cases
}
```

A record gives you the constructor, getters, `equals`, `hashCode`, and `toString` for free, and its fields are final.

### 43. What does `var` do?

**In short:** It lets the compiler work out the type of a local variable. The variable is still strongly typed.

```java
var users = new ArrayList<User>();   // type is ArrayList<User>
```

Use it when the type is obvious from the right side. Avoid it when it makes the code harder to read.

---

## 8. Design and Good Practice

Last, how you shape code so it stays easy to change. This ties everything above together.

### 44. How do you write a thread-safe singleton?

**In short:** Use the holder idiom or an `enum`.

```java
// Holder idiom: lazy and thread-safe, no locks needed
public class Config {
    private Config() { }

    private static class Holder {
        static final Config INSTANCE = new Config();
    }

    public static Config getInstance() { return Holder.INSTANCE; }
}

// Even simpler, and safe against reflection and serialization tricks
public enum AppSettings { INSTANCE }
```

If you use double-checked locking, the field **must** be `volatile`. In a Spring app, you usually just rely on singleton beans instead.

### 45. How do you create an immutable class?

**In short:** Make everything final, and never let outside code touch the internals.

```java
public final class Order {
    private final String id;
    private final List<String> items;

    public Order(String id, List<String> items) {
        this.id = id;
        this.items = List.copyOf(items);    // defensive copy
    }

    public List<String> items() { return items; }   // already immutable
}
```

Rules: `final` class, `final` fields, no setters, copy mutable inputs, and do not return mutable fields. Today a `record` with `List.copyOf` does the same job in less code.

### 46. What are the SOLID principles?

**In short:** Five guidelines for code that is easy to change.

| Letter | Idea | Simple example |
| --- | --- | --- |
| **S** | One reason to change | A class that sends email does not also save to the database |
| **O** | Open for extension, closed for edits | Add a new `PaymentMethod` class instead of editing a big `if` chain |
| **L** | Subtypes must work wherever the parent works | A `Square` that breaks a `Rectangle` promise is a violation |
| **I** | Small, focused interfaces | Do not force a class to implement methods it never uses |
| **D** | Depend on abstractions | A service uses a `Notifier` interface, not `EmailNotifier` directly |

Spring's dependency injection is the **D** in practice.

### 47. Which design patterns do you see in Java and Spring?

**In short:** More than you think.

- **Singleton:** Spring beans.
- **Factory:** `BeanFactory`, `List.of()`.
- **Builder:** `StringBuilder`, `HttpRequest.newBuilder()`.
- **Strategy:** a `Comparator`, or a `List<PaymentMethod>` injected into a service.
- **Proxy:** `@Transactional`, `@Cacheable`.
- **Observer:** Spring events and listeners.
- **Template method:** `JdbcTemplate`, `RestTemplate`.

### 48. What is `serialVersionUID`, and should you use Java serialization?

**In short:** It is a version number for a serialized class. And in new code, prefer JSON or Protobuf instead of Java serialization.

If the stored `serialVersionUID` differs from the class's, loading fails with `InvalidClassException`. Fields marked `transient` are skipped. Java serialization is slow, fragile, and has well-known security risks when reading untrusted data. Use it only when you must.

---

:::info[Where to next]
Now connect this to the framework side: go to [Spring Boot Interview Questions](./spring-boot-interview.md). Many Spring answers (proxies, threads, transactions) rest directly on the Java ideas above.
:::
