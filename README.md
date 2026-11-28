# Playwright + TypeScript test automation framework

[![Tests](https://github.com/igorkoshkowskyi-cmyk/playwright-ts-framework/actions/workflows/tests.yml/badge.svg)](https://github.com/igorkoshkowskyi-cmyk/playwright-ts-framework/actions/workflows/tests.yml)

**[Latest Allure report](https://igorkoshkowskyi-cmyk.github.io/playwright-ts-framework/)** ·
**[Pipeline runs](https://github.com/igorkoshkowskyi-cmyk/playwright-ts-framework/actions)** ·
**[App under test](https://github.com/igorkoshkowskyi-cmyk/expense-tracker-app)**

API and end-to-end tests for a small expense tracker, written the way a production suite is built:
typed API layer, page objects, fixtures, database checks, network mocks, per-worker test accounts,
sharded CI with merged reports, and k6 load tests with thresholds.

**85 tests**: 36 through the API, 16 in the browser on each of three screen sizes, and the setup
that registers the accounts. CI runs them in two shards in under three minutes.

This repository holds only the tests. The app under test is a separate project,
[`expense-tracker-app`](https://github.com/igorkoshkowskyi-cmyk/expense-tracker-app)
(Express + PostgreSQL), published as a Docker image, the way a product team hands a build to QA.
Docker Compose locally and service containers in CI start that image next to a fresh database.

## What is inside

| What                                       | Where                                                                                                                               | What it gives                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| API and E2E tests                          | [`tests/api/`](tests/api/), [`tests/e2e/`](tests/e2e/)                                                                              | the same app checked through its API and in the browser on three screen sizes                                      |
| Page Object                                | [`app/pages/`](app/pages/)                                                                                                          | the locators and steps of a page live in one class; specs talk to pages, not to selectors                          |
| Abstract Factory                           | [`app/PageFactory.ts`](app/PageFactory.ts), `PageSet`                                                                               | one family of page objects per screen (web, tablet, mobile), picked by the project's `device` option               |
| Programming to an interface                | [`app/pages/interfaces/`](app/pages/interfaces/)                                                                                    | specs depend on page interfaces, never on a screen class, so one spec runs on every screen                         |
| Facade                                     | [`App`](app/App.ts), [`ApiClient`](api/ApiClient.ts), [`Db`](db/Db.ts)                                                              | one entry point each to the pages, the API services and the database tables                                        |
| Generic base class                         | [`api/BaseApiService.ts`](api/BaseApiService.ts)                                                                                    | create, read, update and delete for any REST resource from `BaseApiService<TInput, TEntity>`                       |
| Dependency injection with fixtures         | [`fixtures/`](fixtures/)                                                                                                            | a test declares what it needs (`api`, `db`, `account`, `expense`), Playwright builds, shares and tears it down     |
| Isolation per worker, auth by storageState | [`fixtures/accounts.ts`](fixtures/accounts.ts), [`tests/auth.setup.ts`](tests/auth.setup.ts), [`accounts.json`](data/accounts.json) | one account and one saved session per worker slot, for the browser and the API, so parallel tests never share data |
| Project dependencies                       | [`playwright.config.ts`](playwright.config.ts)                                                                                      | `setup` registers the accounts before `api` and the three `e2e-*` projects start                                   |
| Database checks                            | [`db/Db.ts`](db/Db.ts), [`db/tables/`](db/tables/)                                                                                  | API and E2E specs read what was really stored, not only what the API said                                          |
| Test data builders                         | [`data/builders.ts`](data/builders.ts)                                                                                              | valid, unique data by default; a test overrides only what it is about                                              |
| Data-driven tests                          | [`data/cases/`](data/cases/)                                                                                                        | a table of cases, one test per row, so the report names the exact case that failed                                 |
| Command: an undo stack for teardown        | `cleanup` in [`fixtures/api.ts`](fixtures/api.ts)                                                                                   | each created entity registers its undo step; the steps run in reverse order, and a failed one is never fatal       |
| Test doubles: stub and spy                 | `page.route` in [`expenses-mocked.spec.ts`](tests/e2e/expenses-mocked.spec.ts), `apiCalls`                                          | responses the real backend cannot easily give; proof that a request was or was not sent                            |
| Custom matchers                            | [`fixtures/expect.ts`](fixtures/expect.ts)                                                                                          | domain assertions: `toMatchSchema`, `toFailWithApiError`                                                           |
| Contract checks with JSON Schema           | [`api/schemas/`](api/schemas/), [`contract.api.spec.ts`](tests/api/contract.api.spec.ts)                                            | every response is held to its schema, and each schema is tied to its TypeScript type                               |
| Sharded CI with merged reports             | [`tests.yml`](.github/workflows/tests.yml)                                                                                          | two shards, each with its own app and database; one HTML and one Allure report, published to GitHub Pages          |
| Load tests                                 | [`perf/auth.ts`](perf/auth.ts), [`perf.yml`](.github/workflows/perf.yml)                                                            | k6 on sign-up and sign-in with thresholds that fail the job; results land in the same Allure report                |

## Test strategy

- **Rules are checked through the API.** A test there is fast and names the rule that broke:
  create, read, update and delete, validation with both sides of each boundary, access without a
  session and to another user's data, and the shape of every response.
- **The browser is for what only a browser can show.** The main flows from the form to the
  database (sign in, register, add and delete an expense), what a form stops before any request
  is sent, and the layout of each screen size. A rule proven through the API is not repeated
  field by field in the browser. Updating an expense has no browser test: the page has no edit
  form.
- **The database is read when a response cannot prove the point**: the row belongs to the right
  user, the amount is stored in cents, the password is stored as a hash.
- **Mocks only where the real backend cannot easily give the response**, such as a 500 or an
  empty list. Everything else runs against the real app and a real database.
- **Load tests cover sign-up and sign-in**, the two calls that hash a password.
- **Left out**: screenshot comparison, accessibility scans and Firefox.

## Run it locally

Requirements: Node 22.22.1 or newer and Docker.

```bash
cp .env.example .env   # works as it is: the app image is public
npm ci
npx playwright install chromium webkit
npm run env:up         # app on localhost:3000, PostgreSQL on localhost:DB_PORT
npm test               # setup, api and the three e2e projects
npm run report         # Playwright HTML report
npm run allure         # Allure report
```

`.env` is the one source of the environment settings:

| Variable                                                  | Used by                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `APP_IMAGE`                                               | Docker Compose: which app image to start                                           |
| `BASE_URL`                                                | `use.baseURL` in `playwright.config.ts`: pages, request contexts, fixtures         |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Docker Compose creates the database with them; the `db` fixture connects with them |

`playwright.config.ts` loads `.env`, and every worker loads the config, so the variables reach the
fixtures too. The app address lives only in `use.baseURL`: request contexts inherit it and specs use
relative paths. The database connection is the worker-scoped `db` fixture, which reads its five
variables through `requireEnv` from `utils/requireEnv.ts`.

There are no defaults in the code: a missing variable stops the run with
`BASE_URL is not set: copy .env.example to .env, or set it in CI.` In CI the workflow sets the same
variables, so no `.env` file is needed there.

If the app is not running, the setup project stops the run at once with
`The app is not reachable at http://localhost:3000. Start it with "npm run env:up".`

Other commands:

```bash
npm run test:api       # only API tests
npm run test:e2e       # browser tests on all three screen types
npm run test:mobile    # one screen type: test:web, test:tablet, test:mobile
npx playwright test --grep @expenses           # one area: @login, @registration, @expenses
npx playwright test --grep "@login|@registration"  # several at once
npm run check          # typecheck, lint and format check, as CI does
npm run env:down       # stop the app and the database, drop the data
```

`npm ci` also installs a Git pre-commit hook (husky). lint-staged takes only the staged files: it
runs `eslint --fix` and then Prettier on TypeScript and `.mjs` files, and Prettier on JSON, Markdown
and YAML. What ESLint can fix goes into the commit fixed; an error it cannot fix, such as a comment
that is not in English, stops the commit. The hook does not typecheck the whole project:
`npm run check` is the full check, as in CI.

## Structure

```
api/             typed API layer: ApiClient container, BaseApiService, services, ApiError,
                 types.ts and the JSON Schemas of the responses in schemas/, one file per schema
app/
  App.ts         page container: the pages of the running project's screen type
  PageFactory.ts maps web, tablet and mobile to their page sets
  pages/
    interfaces/  LoginPage, RegisterPage, ExpensesPage: what tests may call
    base/        BasePage: helpers any page can use, no page-specific code
    web/         page objects for 1024 px and wider
    tablet/      page objects for 768 to 1023 px
    mobile/      page objects below 768 px
data/            test accounts and data builders
  cases/         tables of data-driven tests, one file per topic: signIn, registration,
                 protectedCalls
db/
  Db.ts          database container: connection pool and one helper per table
  tables/        UsersTable, ExpensesTable: queries for checks and cleanup
fixtures/        accounts, api, db, cleanup and app fixtures, merged in fixtures/index.ts,
                 and expect.ts with the custom matchers
perf/            k6 load tests in TypeScript and their reporting
docker-compose.yml  the test environment: the app image and its PostgreSQL
tests/
  auth.setup.ts  setup project: registers the accounts and saves their sessions
  api/           API specs
  e2e/           browser specs
utils/           requireEnv for the environment settings, money formatting
```

## How it works

### Accounts and sessions

The `setup` project runs first (`dependencies: ['setup']` in the config). It find-or-creates every
account from `data/accounts.json`, signs in through the API, checks the session works and saves it
to `playwright/.auth/<email>.json`. The session is a cookie, so the same file serves the browser
context and the API request context.

Each worker gets its own account, so parallel tests never touch each other's data:

```
slot = (shard - 1) x workers + parallelIndex
```

With 4 workers and 2 CI shards, shard 1 uses accounts 1 to 4 and shard 2 uses accounts 5 to 8.
The shard part of the formula is for an environment that all shards share, such as one staging
server: without it two shards would sign in as the same accounts. In this CI every shard also
has its own database, so there the shards are isolated twice.

The `storageState` option is overridden per worker, so every browser test starts signed in. Tests
about signing in opt out with `test.use({ storageState: { cookies: [], origins: [] } })`.

### Page objects per screen size

Every e2e test runs on three screen types, one project each:

| Project      | Device profile | Engine   | Page set            |
| ------------ | -------------- | -------- | ------------------- |
| `e2e-web`    | Desktop Chrome | Chromium | `app/pages/web/`    |
| `e2e-tablet` | iPad (gen 7)   | WebKit   | `app/pages/tablet/` |
| `e2e-mobile` | Pixel 7        | Chromium | `app/pages/mobile/` |

The pages are built from two parts:

1. **Interfaces** in `app/pages/interfaces/` say what a test may do on a page: `LoginPage`,
   `RegisterPage`, `ExpensesPage`. Tests only ever see these types.
2. **Screen classes** in `web/`, `tablet/` and `mobile/` implement them. Each class is complete on
   its own: its locators and its steps for that screen. Each folder exports its page set from
   `index.ts`.

The screen classes share no page code on purpose. This is an Abstract Factory: each screen folder
is a family of page objects built for that screen, with its own elements, buttons and order of
steps, and `PageFactory` hands out the family of the running project. A screen
can change, or become a separate mobile site, without touching the other two. The price is that
identical parts, such as the sign-in form, which looks the same everywhere today, are written in
each class. `BasePage` holds only helpers that any page can use: `openPage()`, `clickAndWaitForApi()`
and `expand()` for a disclosure button.

The expenses page really differs by screen. On web the form and the account area are always
visible and expenses are a table. On a tablet the form opens with "New expense". On a phone
expenses are cards and the user name and "Sign out" sit behind "Menu". So, for example,
`fillForm()` opens the form first only on tablet and mobile, `signOut()` opens the menu first only
on mobile, and `item()` is a table row or a card.

`App` is the one page object tests use. It reads the project's `device` option and asks
`PageFactory` for that screen's page set, so the same spec runs on all three screens without a
single `if`:

```ts
await app.expensesPage.add(form); // opens the form first where the screen hides it
await expect(app.expensesPage.item(form.title)).toBeVisible(); // a row or a card
```

`PageFactory` maps devices with a `Record<Device, PageSet>`, and `PageSet` requires all three pages,
so a new screen type without a complete page set fails to compile.

Screen-specific checks are tagged `@web`, `@tablet` or `@mobile`. Each project filters out the
other two tags with `grepInvert`, so they run only where they apply and never show up as skipped.

### Tags

Besides the device tags, every test carries the area it works with, so a run can be cut with
`--grep`, and Allure shows the same tags:

- `@login`: sign-in, sign-out and the signed-in user's profile (`GET /api/me`);
- `@registration`: sign-up;
- `@expenses`: everything done with expenses, in the API, on the page, in each screen's layout
  and with a mocked backend. The expense specs set it once on their `describe`.

The specs write tags as plain strings, the usual Playwright form. The list of allowed tags is in
`eslint.config.mjs` (`allowedTags` of `playwright/valid-test-tags`), so a misspelled tag fails the
lint instead of silently dropping a test out of a filtered run. The rule reads only string
literals. The table of protected endpoints is the one place where the tag comes from data: each
row keeps it in a field typed as `'@expenses' | '@login'`, TypeScript checks it there, and the
loop that applies it switches the rule off for that one line.
`setup` is a dependency, so it runs with any filter.

### API layer

Tests never build URLs or parse JSON. `ApiClient` exposes typed services, `BaseApiService` gives
CRUD for a REST resource, and `unwrap()` returns the typed body or throws `ApiError` with `status`,
`code`, `field` and the raw error body.

### Contract checks and custom matchers

`api/schemas/` describes every response as a JSON Schema, one file per schema: the user, the
expense, the list and the common error body. Each schema is typed with ajv's `JSONSchemaType<T>`, so it cannot drift from the
TypeScript type: a field added to one and not the other fails to compile. `additionalProperties:
false` makes an unexpected field fail, so a leaked password hash would be caught.

`fixtures/expect.ts` extends Playwright's `expect` with two matchers, and specs get that `expect`
from `fixtures/index.ts`:

```ts
expect(expense).toMatchSchema(expenseSchema);
await expect(api.auth.register(user)).toFailWithApiError(400, 'validation', 'email');
```

- `toMatchSchema` validates with ajv and lists every mismatch, such as
  `value/amountCents must be integer`.
- `toFailWithApiError` awaits the call and checks the status, the error code and, when given, the
  invalid field. It also checks the error body against the error schema, so every negative test
  checks the error contract along the way. It says what happened instead: another error, a
  successful call, or a broken error body. ESLint makes sure it is awaited
  (`customMatchers` of `playwright/missing-playwright-await`).

`tests/api/contract.api.spec.ts` holds one contract check per endpoint.

### Data-driven tests

A table of cases becomes one test per row, so the report names the exact case that failed. The
tables live in `data/cases/`, one file per topic, and the specs only loop over them:

```ts
for (const { name, credentials } of WRONG_CREDENTIALS) {
    test(`${name} shows an error and creates no session`, async ({ app, account, context }) => {
        const { email, password } = credentials(account);
        ...
    });
}
```

- **Sign-in**, `data/cases/signIn.ts`, in the API and the e2e specs: an unknown email, a wrong password, both wrong, and empty
  email, password or both. Rows build their values from the worker's real account, so only the
  intended part is wrong. The API responds to every row with the same `401 invalid_credentials`,
  so it never tells which part was wrong. On the page the wrong pairs reach the server and show
  its error, while the form itself stops the empty ones: the `apiCalls` fixture records the page's
  API requests and proves no sign-in request was sent.
- **Registration**, boundary values in `data/cases/registration.ts`, each boundary from both
  sides. Just outside the rules: an empty name, a name of 51 characters, an email without `@`, a
  password of 7 characters. Each must fail on its own field, and the database must have no such
  user. Just inside: a name of 1 and of 50 characters, a password of 8. Each must be accepted
  as it is.
- **Protected endpoints**, `data/cases/protectedCalls.ts`: every endpoint behind the session,
  called without one, must respond with `401 unauthorized`. The `:id` calls target a real expense
  of the worker's account, so the 401 proves the session check rather than a missing record, and
  the test then confirms the rejected call changed and deleted nothing.
- **Another user's data**, the `:id` rows of the same table: read, update and delete, called by a
  second signed-in user, must respond with `404 not_found`, and the expense must stay as it was.
  A 404 rather than a 403, so the API does not reveal that the expense exists.

### Database checks

The API response is not enough to prove something was stored correctly. Specs read the database
directly through `db`: the expense row belongs to the right user, the amount is stored in cents, the
password is stored as a hash, the UI total equals the sum in the database.

### Test data and cleanup

Data is built with unique names (`data/builders.ts`), created through the API and registered for
cleanup right after creation. The `cleanup` fixture undoes steps in reverse order after the test.
A failed step adds a `cleanup failed` annotation and a console warning but never fails the test:
the test result should describe the feature, not the teardown. A 404 when deleting is ignored,
because the test may have deleted the entity itself.

### Network checks and mocks

Network checks are part of the real UI flows. Page objects click through `clickAndWaitForApi` in
`BasePage`, which waits for the API response with `waitForResponse` and returns it, so a UI test
checks the request the page sent, the status of the response, what the screen shows and what the
database stored, all in one scenario:

```ts
const form = buildExpenseForm({ amount: '12.50' });
const response = await app.expensesPage.add(form);

expect(response.status()).toBe(201);
expect(response.request().postDataJSON()).toEqual({
    title: form.title,
    amountCents: 1250, // typed as "12.50"
    category: form.category,
    spentOn: form.spentOn,
});
```

Statuses checked this way: sign-in 200 or 401, registration 201, create 201, delete 204.

`expenses-mocked.spec.ts` covers what the real backend cannot easily produce. It replaces
responses with `page.route`, so nothing there reaches the database:

- a 500 on save: the error message appears and the form keeps its values;
- an empty list: the empty state appears;
- an invalid amount: the page sends no request at all, which the `apiCalls` fixture shows.

## CI on GitHub Actions

`tests.yml` runs on every push and pull request:

1. **check**: typecheck, ESLint and Prettier.
2. **test**: two shards in a matrix. Each shard runs in the Playwright image with two service
   containers: the app from `APP_IMAGE` and a fresh PostgreSQL, so shards never share data. The
   app image has a health check, so the runner waits until it responds. The Playwright image
   already has Chromium and WebKit, and its tag must match `@playwright/test` in `package.json`.
   A failed test shows up as an annotation on the run, at its file and line (`github` reporter).
3. **report**: merges the shard blob reports into one HTML report and builds Allure with history.
   It runs after failed tests too, but not when the tests never started.
4. **pages**: on `main`, publishes the Allure report to GitHub Pages, also when tests failed.

Every job has a time limit, so a hung browser cannot hold a runner for hours.

`perf.yml` runs the load tests against the same two containers, on a weekly schedule or by hand
with a profile to choose.

<details>
<summary>One-time setup on GitHub, for running this pipeline in a fork</summary>

1. In the `expense-tracker-app` repository, push a tag such as `v1.0.0`: its workflow publishes
   `ghcr.io/<user>/expense-tracker-app:1.0.0`. Then make the package public in its settings, or
   grant this repository read access to it. Or skip this step and use the public image named in
   `.env.example`.
2. Here, add a repository variable `APP_IMAGE` with that image name: Settings, Secrets and
   variables, Actions, Variables.
3. Enable Pages: Settings, Pages, Source: GitHub Actions.

</details>

## Load tests

`perf/auth.ts` loads sign-up and sign-in at the same time. Each scenario tags its requests, so each
has its own thresholds: p95 under 800 ms for sign-up, under 500 ms for sign-in, under 1% failed
requests, over 99% passed checks. A failed threshold makes k6 exit with a non-zero code, which
fails the CI job.

| Profile | Sign-ups per second | Sign-ins per second | Duration |
| ------- | ------------------- | ------------------- | -------- |
| smoke   | 1                   | 2                   | 20 s     |
| load    | 5                   | 10                  | 2 min    |

Run with a local k6 binary, or with Docker while the app is running:

```bash
mkdir -p allure-results
npm run perf:smoke
docker run --rm -v "$PWD":/work -w /work -e BASE_URL=http://host.docker.internal:3000 \
  grafana/k6:2.4.0 run perf/auth.ts
```

At the end each threshold is written as an Allure test result, so load results appear in the same
Allure report as the functional tests, with measured values as parameters.
