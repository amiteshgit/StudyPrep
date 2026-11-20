---
id: spring-boot-interview
slug: /spring-boot-interview
title: Spring Boot Interview Questions
sidebar_label: Spring Boot
sidebar_position: 2
description: Popular Spring Boot interview questions with simple answers and code.
---

# Spring Boot Interview Questions

This page walks through Spring Boot the way a good interview does. We start with **what Boot is**, then go down into **beans**, **configuration**, **web**, **data**, **production**, **security**, **testing**, and finish with the **design questions** that senior interviewers love.

Each answer starts with a short line you can say out loud, followed by the detail behind it.

:::tip[How to use this page]
Read one section at a time. Use the list on the right to jump to a question. Try the code in a small project, because answers you have run yourself are easier to explain.
:::

---

## 1. The Basics

Everything starts here. If you can explain these clearly, the rest of the interview gets easier.

### 1. What is Spring Boot, and why use it over plain Spring?

**In short:** Spring Boot is a layer on top of Spring that does the setup work for you, so you can start a service quickly and still change any default.

Plain Spring needs a lot of plumbing: matching library versions, web configuration, a server to deploy to. Boot gives you four things that remove this work:

- **Starters:** one dependency brings a matching set of libraries.
- **Auto-configuration:** Boot sets up beans based on what is on your classpath.
- **Embedded server:** Tomcat runs inside your app, so you just run a jar.
- **Production features:** health checks and metrics through Actuator.

### 2. What does `@SpringBootApplication` do?

**In short:** It is three annotations in one.

| Annotation | Job |
| --- | --- |
| `@Configuration` | The class can define beans |
| `@ComponentScan` | Find your classes in this package and below |
| `@EnableAutoConfiguration` | Let Boot set things up automatically |

```java
@SpringBootApplication
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
```

:::warning[Common trap]
Scanning starts from the package of this class. A controller in a package outside it will not be found, and you will get a 404.
:::

### 3. What are starters?

**In short:** A starter is one dependency that brings a whole group of libraries that work together.

For example, `spring-boot-starter-web` brings Spring MVC, Tomcat, and Jackson. You write no version number, because the Boot parent (or the Boot BOM) manages versions for you.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### 4. How does auto-configuration work?

**In short:** Boot reads a list of configuration classes, and applies each one only if its conditions match.

Step by step:

1. `@EnableAutoConfiguration` loads a list of classes from the file `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` inside Boot's jar.
2. Each class has conditions, like `@ConditionalOnClass`, `@ConditionalOnProperty`, and `@ConditionalOnMissingBean`.
3. If the conditions match, its beans are created.
4. `@ConditionalOnMissingBean` means **your own bean wins**. Boot's default backs off.

```java
@Bean
@ConditionalOnMissingBean
public ObjectMapper objectMapper() {
    return new ObjectMapper();   // used only if you did not define one
}
```

To see what Boot decided, start with `--debug` (or `debug=true`) and read the conditions report. The same data is at `/actuator/conditions`.

### 5. How do you turn off an auto-configuration?

**In short:** Use `exclude`, either in code or in properties.

```java
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class App { }
```

```properties
spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

### 6. What happens when `SpringApplication.run()` is called?

**In short:** Boot builds the context, loads settings, applies auto-configuration, and starts the server.

1. Create the `SpringApplication` and decide the app type (servlet, reactive, or none).
2. Prepare the `Environment` and load properties.
3. Create the `ApplicationContext` and load bean definitions.
4. Apply auto-configuration and refresh the context (beans are created).
5. Start the embedded web server.
6. Call `CommandLineRunner` and `ApplicationRunner` beans.

Events such as `ApplicationReadyEvent` are published along the way, so you can hook in code at the right moment.

### 7. How do you change the embedded server?

**In short:** Exclude Tomcat and add the starter for another server.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

---

## 2. Beans and Dependency Injection

Now that the app starts, the next question is how its objects get created and connected. This is the job of the Spring container.

### 8. Constructor, setter, or field injection: which is best?

**In short:** Constructor injection, in almost every case.

- **Constructor:** dependencies are clear, fields can be `final`, and tests are easy (just call `new`).
- **Setter:** fine for optional dependencies.
- **Field (`@Autowired` on a field):** hides dependencies and needs reflection to test. Avoid it.

```java
@Service
public class OrderService {

    private final PaymentClient paymentClient;
    private final OrderRepository orderRepository;

    // One constructor: @Autowired is not needed
    public OrderService(PaymentClient paymentClient, OrderRepository orderRepository) {
        this.paymentClient = paymentClient;
        this.orderRepository = orderRepository;
    }
}
```

### 9. `@Component` vs `@Service` vs `@Repository` vs `@Controller`?

**In short:** All of them register a bean. The difference is mostly meaning, plus one extra behavior on `@Repository`.

- `@Component`: a general bean.
- `@Service`: business logic. No extra behavior, it only tells readers what the class is.
- `@Repository`: data access. It also translates database exceptions into Spring's `DataAccessException`.
- `@Controller` / `@RestController`: web layer.

### 10. `@Bean` vs `@Component`?

**In short:** `@Component` goes on **your class**. `@Bean` goes on a **method** that creates the object.

Use `@Bean` when you cannot edit the class (a library class), or when creating the object needs some logic.

```java
@Configuration
public class AppConfig {

    @Bean
    public RestClient restClient(RestClient.Builder builder) {
        return builder.baseUrl("https://api.example.com").build();
    }
}
```

### 11. What are the bean scopes?

**In short:** `singleton` is the default. Others are `prototype`, and for web apps `request`, `session`, and `application`.

- **singleton:** one instance for the whole container.
- **prototype:** a new instance every time it is requested.
- **request / session:** one per HTTP request or session.

:::warning[Interview trap]
If you inject a prototype bean into a singleton, you get **one** instance, created when the singleton was built. To get a fresh one each time, inject `ObjectProvider<T>` and call `getObject()`.
:::

### 12. How does Spring handle circular dependencies?

**In short:** Constructor cycles fail. Since Boot 2.6, cycles are not allowed by default. The real fix is a better design.

If `A` needs `B` in its constructor and `B` needs `A`, Spring cannot create either one, and you get `BeanCurrentlyInCreationException`.

What to do:

- Move the shared logic into a third class that both use.
- Or use events, so one side does not depend on the other directly.
- As a last resort, use `@Lazy` on one injection point.

### 13. What is the bean lifecycle?

**In short:** Create, inject, initialize, use, destroy.

1. Spring creates the object (constructor).
2. It injects dependencies.
3. `Aware` callbacks run (like `BeanNameAware`).
4. `BeanPostProcessor` runs *before* initialization.
5. `@PostConstruct` and `afterPropertiesSet()` run.
6. `BeanPostProcessor` runs *after* initialization. This is where AOP proxies (like `@Transactional`) are created.
7. The bean is ready to use.
8. On shutdown, `@PreDestroy` and `destroy()` run.

### 14. What if there are two beans of the same type?

**In short:** Tell Spring which one to use, with `@Primary` or `@Qualifier`.

```java
@Bean @Primary
public Notifier emailNotifier() { return new EmailNotifier(); }

@Bean
public Notifier smsNotifier() { return new SmsNotifier(); }

// pick one by name
public AlertService(@Qualifier("smsNotifier") Notifier notifier) { ... }
```

You can also inject all of them at once as `List<Notifier>` or `Map<String, Notifier>`. This is a neat way to implement the strategy pattern.

---

## 3. Configuration and Profiles

Beans need settings: ports, URLs, passwords. Here is how Boot handles them.

### 15. In what order does Boot read properties?

**In short:** The more specific and external the source, the higher it wins.

From strongest to weakest (simplified):

1. Command-line arguments (`--server.port=9000`)
2. Java system properties (`-Dserver.port=9000`)
3. OS environment variables (`SERVER_PORT=9000`)
4. Profile files (`application-prod.yml`)
5. `application.yml` / `application.properties`
6. `@PropertySource` and built-in defaults

Files *outside* the jar beat files *inside* it. This is why one jar can run in every environment: you only change the outside settings.

### 16. `@Value` vs `@ConfigurationProperties`?

**In short:** `@Value` is fine for one value. `@ConfigurationProperties` is better for a group of settings.

`@ConfigurationProperties` gives type-safe binding, validation, and relaxed names (`max-retries`, `maxRetries`, and `MAX_RETRIES` all work).

```yaml
payment:
  base-url: https://pay.example.com
  timeout: 3s
  max-retries: 2
```

```java
@Validated
@ConfigurationProperties(prefix = "payment")
public record PaymentProperties(
        @NotBlank String baseUrl,
        Duration timeout,
        int maxRetries) { }
```

Register it with `@ConfigurationPropertiesScan` (or `@EnableConfigurationProperties`).

### 17. How do profiles work?

**In short:** A profile is a named set of settings and beans for one environment, like `dev` or `prod`.

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://prod-db:5432/app
```

```bash
java -jar app.jar --spring.profiles.active=prod
```

```java
@Bean
@Profile("dev")
public DataSeeder devSeeder() { return new DataSeeder(); }
```

:::tip[Real-world habit]
Keep secrets out of the repo. Pass them as environment variables, or use Kubernetes Secrets or a vault.
:::

---

## 4. Web and REST

With beans and settings in place, we can accept requests. This section follows a request from the moment it arrives.

### 18. `@Controller` vs `@RestController`?

**In short:** `@RestController` is `@Controller` plus `@ResponseBody`.

With `@RestController`, the return value is written straight to the response body, usually as JSON (through Jackson). With a plain `@Controller`, the return value is usually a view name, like for a Thymeleaf page.

### 19. How does a request travel through Spring MVC?

**In short:** Filter, then `DispatcherServlet`, then your controller, then back out through a message converter.

1. **Filters** run first (security, CORS, logging).
2. `DispatcherServlet` receives the request.
3. `HandlerMapping` finds the right controller method.
4. **Interceptors** run around the call (`preHandle`, `postHandle`).
5. Arguments are built (path variables, `@RequestBody` through Jackson).
6. Your method runs.
7. The return value is converted by an `HttpMessageConverter` (for example to JSON) and sent back.

### 20. Filter vs Interceptor vs AOP?

**In short:** They run at three different levels.

| | Level | Good for |
| --- | --- | --- |
| Filter | Servlet (before Spring MVC) | Security, CORS, request logging |
| Interceptor | Spring MVC (knows the handler) | Auth checks, timing a controller call |
| AOP | Any Spring bean method | Auditing, metrics, transactions |

### 21. How do you handle errors in one place?

**In short:** Use `@RestControllerAdvice` with `@ExceptionHandler`.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    public ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Order not found");
        return problem;
    }
}
```

`ProblemDetail` follows the standard RFC 7807 error format, and it is built in since Spring 6 / Boot 3.

### 22. How do you validate input?

**In short:** Add Jakarta Bean Validation annotations to your request class, and use `@Valid` in the controller.

```java
public record CreateUserRequest(
        @NotBlank String name,
        @Email String email,
        @Min(18) int age) { }

@PostMapping("/users")
public User create(@Valid @RequestBody CreateUserRequest request) {
    return userService.create(request);
}
```

If validation fails, Spring throws `MethodArgumentNotValidException`, which you can turn into a clean 400 response in your advice class. You need `spring-boot-starter-validation`.

:::note[Boot 3 change]
The package names moved from `javax.validation` to `jakarta.validation`.
:::

---

## 5. Data and Transactions

Most requests end in a database. This is also where the trickiest interview questions live.

### 23. How does `@Transactional` work, and what are its traps?

**In short:** Spring wraps your bean in a **proxy**. The proxy opens the transaction before your method and commits or rolls back after it.

Because it is proxy-based, there are classic traps:

**Trap 1: calling a method in the same class.** The call does not go through the proxy, so no transaction starts.

```java
@Service
public class OrderService {

    public void placeOrder() {
        saveOrder();          // called directly: NOT transactional
    }

    @Transactional
    public void saveOrder() { ... }
}
```

Fix: move `saveOrder()` into another bean, so the call goes through its proxy.

**Trap 2: checked exceptions do not roll back by default.** Only unchecked exceptions and `Error` do.

```java
@Transactional(rollbackFor = Exception.class)
public void pay() throws IOException { ... }
```

**Trap 3: new threads.** A transaction belongs to one thread. Work you start on another thread (`@Async`, executors) is outside it.

**Propagation, briefly:**

- `REQUIRED` (default): join the current transaction, or start one.
- `REQUIRES_NEW`: pause the current one and start a fresh one (useful for audit logs that must be saved even if the main work fails).
- `NESTED`: use a savepoint inside the current transaction.

### 24. What is the N+1 problem and how do you fix it?

**In short:** One query loads N parents, then N more queries load each parent's children.

```java
List<Author> authors = authorRepository.findAll();   // 1 query
for (Author a : authors) {
    a.getBooks().size();                              // +N queries (lazy load)
}
```

Fixes:

```java
// 1. Fetch together with a join
@Query("select a from Author a join fetch a.books")
List<Author> findAllWithBooks();

// 2. Or use an entity graph
@EntityGraph(attributePaths = "books")
List<Author> findAll();
```

Other options: batch fetching (`hibernate.default_batch_fetch_size`) and DTO projections. To spot the problem, turn on SQL logging and count the queries.

### 25. What is `open-in-view` and why do many teams turn it off?

**In short:** It keeps the database session open until the response is rendered, which allows lazy loading in controllers but hides problems.

It is **on by default** (Boot prints a warning). The downsides are held connections and hidden N+1 queries in the web layer. Many teams set:

```properties
spring.jpa.open-in-view=false
```

and load exactly what they need in the service layer.

### 26. How is connection pooling configured?

**In short:** HikariCP is the default pool. Tune it, but do not just make it bigger.

```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.max-lifetime=1800000
```

A bigger pool does not mean faster. The database has limits, and too many connections slow it down. Size the pool from your database capacity and your real load, then measure.

---

## 6. Production Features

The app works on your laptop. Now it must run well, and be easy to watch, in production.

### 27. What is Actuator?

**In short:** It adds ready-made endpoints to check on a running app.

Add `spring-boot-starter-actuator`. Useful endpoints: `/actuator/health`, `metrics`, `info`, `loggers`, `threaddump`, `prometheus`.

```properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
```

Only expose what you need, and protect the rest. Never expose `heapdump` or `env` publicly.

### 28. How do you do graceful shutdown and health probes for Kubernetes?

**In short:** Turn on graceful shutdown, and use the liveness and readiness probes.

```properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
management.endpoint.health.probes.enabled=true
```

- `/actuator/health/liveness`: is the app alive? (restart it if not)
- `/actuator/health/readiness`: can it take traffic right now?

With graceful shutdown, requests already running are allowed to finish before the server stops.

### 29. How do you add a custom health check?

**In short:** Implement `HealthIndicator`.

```java
@Component
public class PaymentGatewayHealth implements HealthIndicator {

    private final PaymentClient client;

    public PaymentGatewayHealth(PaymentClient client) {
        this.client = client;
    }

    @Override
    public Health health() {
        return client.isReachable()
                ? Health.up().build()
                : Health.down().withDetail("reason", "gateway unreachable").build();
    }
}
```

### 30. How do you do logging and tracing across microservices?

**In short:** Pass a trace ID between services and put it in every log line.

Use Micrometer Tracing (with OpenTelemetry) so trace and span IDs travel in request headers and appear in the logs. Combine this with JSON logs, a central place to search them (ELK or Loki), and metrics in Prometheus and Grafana.

### 31. How do you cache results, and run background work?

**In short:** `@Cacheable` for caching, `@Async` and `@Scheduled` for background work.

```java
@EnableCaching
@EnableAsync
@EnableScheduling
@SpringBootApplication
public class App { }

@Cacheable("products")
public Product findProduct(long id) { ... }

@Scheduled(cron = "0 0 2 * * *")        // every day at 2 AM
public void nightlyCleanup() { ... }

@Async
public CompletableFuture<Report> buildReport() { ... }
```

The default cache is a simple in-memory map. For several app instances, use Redis or another shared cache. And remember: `@Cacheable`, `@Async`, and `@Transactional` are all proxy-based, so the same "same-class call" trap applies.

---

## 7. Security

A running service needs to know who is calling it. This is where Spring Security comes in.

### 32. How does Spring Security work in a Boot app?

**In short:** It is a chain of servlet filters that checks every request before it reaches your controller.

Authentication ("who are you?") is handled by an `AuthenticationManager` and providers. Authorization ("are you allowed?") is checked after that. Since Spring Security 6, you define the rules with a `SecurityFilterChain` bean. The old `WebSecurityConfigurerAdapter` is gone.

### 33. How do you secure a REST API with JWT?

**In short:** Make the app a stateless **resource server** that checks tokens from an identity provider (Keycloak, Okta, Auth0, and so on).

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())   // fine for stateless token APIs
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
```

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://idp.example.com/realms/demo
```

Spring checks the token's signature, expiry, and issuer. Then use `@PreAuthorize("hasRole('ADMIN')")` on methods for finer rules. Use an existing identity provider instead of building your own login system.

---

## 8. Testing

Good tests let you change code with confidence. Boot gives you tests of different sizes, so you pay only for what you need.

### 34. `@SpringBootTest` vs slice tests?

**In short:** `@SpringBootTest` starts the whole app (slow). Slice tests start only one layer (fast).

| Annotation | Loads | Use for |
| --- | --- | --- |
| `@SpringBootTest` | The full context | A few end-to-end checks |
| `@WebMvcTest` | Controllers only | Request and response tests |
| `@DataJpaTest` | JPA and an embedded DB | Repository tests |
| `@JsonTest` | JSON mapping | Serialization tests |

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean OrderService orderService;   // @MockBean in older versions

    @Test
    void returnsOrder() throws Exception {
        given(orderService.find(1L)).willReturn(new Order(1L, "NEW"));

        mockMvc.perform(get("/orders/1"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.status").value("NEW"));
    }
}
```

A good order: plain unit tests first, then slices, then a few full tests.

### 35. How do you test against a real database?

**In short:** Use Testcontainers. It starts a real Postgres (or Kafka, Redis, ...) in Docker for the test.

```java
@SpringBootTest
@Testcontainers
class OrderRepositoryIT {

    @Container
    @ServiceConnection      // Boot 3.1+: connects the app to the container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired OrderRepository repository;

    @Test
    void savesOrder() {
        Order saved = repository.save(new Order(null, "NEW"));
        assertThat(saved.getId()).isNotNull();
    }
}
```

This catches problems that an in-memory H2 database hides, like SQL differences between H2 and your real database.

---

## 9. Modern Spring Boot (3.x and newer)

Interviewers like to check that you keep up. These are the topics that come up most.

### 36. What changed in Spring Boot 3?

**In short:** A new Java baseline, a package rename, and better support for native images and observability.

- Java 17 is the minimum.
- `javax.*` became `jakarta.*` (servlet, validation, persistence).
- Spring Framework 6 and Spring Security 6.
- GraalVM native image support through AOT processing.
- Micrometer Observation for metrics and tracing.
- Built-in RFC 7807 `ProblemDetail` errors.

Newer releases (Boot 4 and Spring Framework 7) carry this direction forward, so check the release notes of the version your target company uses.

### 37. How do virtual threads work in Spring Boot?

**In short:** On Java 21 and Boot 3.2 or newer, one property makes each request run on a cheap virtual thread.

```properties
spring.threads.virtual.enabled=true
```

Blocking calls (database, HTTP) no longer hold a heavy OS thread, so you can handle many more waiting requests with simple, normal code. Things to watch:

- Your database pool and other resources are still limits.
- Long `synchronized` blocks around blocking calls can "pin" the carrier thread.
- Do not use `ThreadLocal` to hold large objects.

### 38. Spring MVC or WebFlux?

**In short:** MVC for most apps. WebFlux when the whole stack is non-blocking and you need very high concurrency or streaming.

MVC is simpler to write, debug, and test. WebFlux only pays off if everything (database driver, HTTP clients) is also non-blocking. With virtual threads, MVC now covers many cases that used to push teams toward WebFlux.

### 39. What are GraalVM native images, and what is the trade-off?

**In short:** Your app is compiled ahead of time into one executable that starts in milliseconds and uses less memory.

- **Good:** fast startup, low memory, great for serverless and scale-to-zero.
- **Costs:** long build times, limits on reflection and dynamic proxies (they need extra hints), and peak speed can be lower than a warmed-up JVM.

---

## 10. Design and Scenario Questions

For a senior role, the interview shifts from "what is it" to "what would you do". These answers show how you think. The best answers say **what you would check first, and why**.

### 40. How do you make a Spring Boot service resilient?

**In short:** Assume every outside call can be slow or fail, and prepare for it.

- Set a **timeout** on every outbound call.
- Use **retry with backoff** and a **circuit breaker** (Resilience4j).
- Make operations **idempotent**, so retries are safe.
- Keep memory and thread use bounded (bulkheads, rate limits).

```java
@CircuitBreaker(name = "payment", fallbackMethod = "paymentFallback")
@Retry(name = "payment")
public PaymentResult pay(Order order) {
    return paymentClient.pay(order);
}

private PaymentResult paymentFallback(Order order, Throwable t) {
    return PaymentResult.pending();   // degrade gracefully
}
```

### 41. How do you keep data consistent across services?

**In short:** Avoid distributed transactions. Use sagas and the outbox pattern instead.

- **Saga:** a chain of local transactions, each with a "undo" step if a later step fails.
- **Outbox:** write your data **and** an event row in the same local transaction. A separate process then publishes the event. This avoids the "saved to the database but the message was lost" problem.

Design consumers to handle the same message twice (idempotency), because delivery is usually "at least once".

### 42. The service is slow in production. How do you find the cause?

**In short:** Measure first, guess later.

1. Check **metrics and traces**: is the time spent in the app, the database, or another service?
2. Take **thread dumps**: are threads stuck, waiting, or blocked on a lock?
3. Check the **connection pool** metrics: are requests waiting for a connection?
4. Look for **N+1 queries** and slow queries (SQL logs, database tools).
5. Look at **GC logs** and memory: long pauses or a growing heap?
6. Profile (JFR or async-profiler) if the cause is still unclear.
7. Fix the one thing you found, then load-test to prove it.

### 43. How do you reduce startup time and memory?

**In short:** Load less, and measure before you tune.

- Remove unused starters and auto-configurations.
- Try lazy initialization: `spring.main.lazy-initialization=true` (trade-off: errors show up later, on first use).
- Use class data sharing (CDS), layered jars for faster container builds, or a native image.
- Use the startup actuator endpoint to see which beans are slow.

### 44. Monolith or microservices?

**In short:** Start with a well-organized monolith. Split when you have a clear reason.

Good reasons to split: separate teams that need to release independently, parts that need to scale very differently, or strong isolation needs. Microservices add network failures, harder debugging, and data consistency problems, so each split should solve a real problem. Spring Modulith is a good way to keep a monolith clean and ready to split later.

### 45. How do you version an API?

**In short:** Prefer adding things over changing them, and version only when you must break something.

Common choices are a URL version (`/v1/orders`), a header, or a media type. Adding a new optional field is not a breaking change. Removing or renaming one is. Contract tests (Spring Cloud Contract or Pact) protect your consumers when you change things.

---

:::info[Next]
Spring Boot sits on top of Java, and interviewers jump between the two. Continue with [Java Interview Questions](./java-interview.md) for the language and JVM side.
:::
