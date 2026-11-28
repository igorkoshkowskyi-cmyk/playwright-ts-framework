# Playwright + TypeScript test automation framework

API and end-to-end tests for a small expense tracker, written the way a production suite is built:
typed API layer, page objects, fixtures, database checks, network mocks, per-worker test accounts,
sharded CI with merged reports, and k6 load tests with thresholds.

This repository holds only the tests. The app under test is a separate project, `expense-tracker-app`
(Express + PostgreSQL), published as a Docker image, the way a product team hands a build to QA.
Docker Compose locally and service containers in CI start that image next to a fresh database.

## What is inside

| Topic                                   | Where                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2E tests                               | [`tests/e2e/`](tests/e2e/)                                                                                                                                        |
| API tests                               | [`tests/api/`](tests/api/)                                                                                                                                        |
| Auth via `storageState` for E2E and API | [`tests/auth.setup.ts`](tests/auth.setup.ts), [`fixtures/accounts.ts`](fixtures/accounts.ts)                                                                      |
| API fixtures                            | [`fixtures/api.ts`](fixtures/api.ts)                                                                                                                              |
| API container                           | [`api/ApiClient.ts`](api/ApiClient.ts) over [`api/BaseApiService.ts`](api/BaseApiService.ts)                                                                      |
| Page container                          | [`app/App.ts`](app/App.ts): picks the screen type of the running project                                                                                          |
| PageFactory, page objects per screen    | [`app/PageFactory.ts`](app/PageFactory.ts), folders [`web/`](app/pages/web/), [`tablet/`](app/pages/tablet/), [`mobile/`](app/pages/mobile/)                      |
| Page interfaces                         | [`app/pages/interfaces/`](app/pages/interfaces/)                                                                                                                  |
| Database checks                         | [`db/Db.ts`](db/Db.ts) container over [`db/tables/`](db/tables/), used in API and E2E specs                                                                       |
| Teardown: LIFO, non-fatal               | `cleanup` fixture in [`fixtures/api.ts`](fixtures/api.ts)                                                                                                         |
| Project dependencies                    | [`playwright.config.ts`](playwright.config.ts): `setup` runs before `api` and the three `e2e-*` projects                                                          |
| Accounts for 4 workers x 2 shards       | [`data/accounts.json`](data/accounts.json)                                                                                                                        |
| CI                                      | [`.github/workflows/tests.yml`](.github/workflows/tests.yml), [`.github/workflows/perf.yml`](.github/workflows/perf.yml)                                          |
| Load tests: sign-up and sign-in         | [`perf/auth.ts`](perf/auth.ts)                                                                                                                                    |
| Request interception and mocks          | [`tests/e2e/expenses-mocked.spec.ts`](tests/e2e/expenses-mocked.spec.ts)                                                                                          |
| Contract checks with JSON Schema        | [`api/schemas.ts`](api/schemas.ts), [`tests/api/contract.api.spec.ts`](tests/api/contract.api.spec.ts)                                                            |
| Custom matchers (`expect.extend`)       | [`fixtures/expect.ts`](fixtures/expect.ts): `toMatchSchema`, `toFailWithApiError`                                                                                 |
| Data-driven tests                       | tables in [`data/cases/`](data/cases/), used by [`tests/api/auth.api.spec.ts`](tests/api/auth.api.spec.ts) and [`tests/e2e/auth.spec.ts`](tests/e2e/auth.spec.ts) |

## Structure

```
api/             typed API layer: ApiClient container, BaseApiService, services, ApiError,
                 types.ts and the JSON Schemas of the answers in schemas.ts
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
```

## Run it locally

Requirements: Node 22.22.1 or newer and Docker.

```bash
cp .env.example .env   # set APP_IMAGE and a DB_PASSWORD
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
npm run check          # typecheck, lint and format check, as CI does
npm run env:down       # stop the app and the database, drop the data
```

`npm ci` also installs a Git pre-commit hook (husky). lint-staged takes only the staged files: it
runs `eslint --fix` and then Prettier on TypeScript and `.mjs` files, and Prettier on JSON, Markdown
and YAML. What ESLint can fix goes into the commit fixed; an error it cannot fix, such as a comment
that is not in English, stops the commit. The hook does not typecheck the whole project:
`npm run check` is the full check, as in CI.

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

The screen classes share no page code on purpose. This is the Factory Method setup for a page
that is built differently per screen: different elements, buttons and order of steps. A screen
can change, or become a separate mobile site, without touching the other two. The price is that
identical parts, such as the sign-in form, which looks the same everywhere today, are written in
each class. `BasePage` holds only helpers that any page can use: `open()`, `clickAndWaitForApi()`
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

### API layer

Tests never build URLs or parse JSON. `ApiClient` exposes typed services, `BaseApiService` gives
CRUD for a REST resource, and `unwrap()` returns the typed body or throws `ApiError` with `status`,
`code`, `field` and the raw error body.

### Contract checks and custom matchers

`api/schemas.ts` describes every answer as a JSON Schema: the user, the expense, the list and the
common error body. Each schema is typed with ajv's `JSONSchemaType<T>`, so it cannot drift from the
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
  intended part is wrong. The API answers every row with the same `401 invalid_credentials`, so it
  never tells which part was wrong. On the page the wrong pairs reach the server and show its
  error, while the form itself stops the empty ones: the `apiCalls` fixture records the page's API
  requests and proves no sign-in request was sent.
- **Registration**, boundary values in `data/cases/registration.ts`: an empty name, a name of 51
  characters, an email without `@`, a password of 7 characters. Each must fail on its own field,
  and the database must have no such user.
- **Protected endpoints**, `data/cases/protectedCalls.ts`: every endpoint behind the session,
  called without one, must answer `401 unauthorized`. The `:id` calls target a real expense of the
  worker's account, so the 401 proves the session check rather than a missing record, and the test
  then confirms the rejected call changed and deleted nothing.

### Database checks

The API answer is not enough to prove something was stored correctly. Specs read the database
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
`BasePage`, which waits for the API answer with `waitForResponse` and returns it, so a UI test
checks the request the page sent, the status of the answer, what the screen shows and what the
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

`expenses-mocked.spec.ts` covers what the real backend cannot easily produce. It replaces answers
with `page.route`, so nothing there reaches the database:

- a 500 on save: the error message appears and the form keeps its values;
- an empty list: the empty state appears;
- an invalid amount: the page sends no request at all, which the `apiCalls` fixture shows.

## CI on GitHub Actions

`tests.yml` runs on every push and pull request:

1. **check**: typecheck, ESLint and Prettier.
2. **test**: two shards in a matrix. Each shard runs in the Playwright image with two service
   containers: the app from `APP_IMAGE` and a fresh PostgreSQL, so shards never share data. The
   app image has a health check, so the runner waits until it answers. The Playwright image
   already has Chromium and WebKit, and its tag must match `@playwright/test` in `package.json`.
3. **report**: merges the shard blob reports into one HTML report and builds Allure with history.
4. **pages**: on `main`, publishes the Allure report to GitHub Pages, also when tests failed.

`perf.yml` runs the load tests against the same two containers, on a weekly schedule or by hand
with a profile to choose.

One-time setup on GitHub:

1. In the `expense-tracker-app` repository, push a tag such as `v1.0.0`: its workflow publishes
   `ghcr.io/<user>/expense-tracker-app:1.0.0`. Then make the package public in its settings, or
   grant this repository read access to it.
2. Here, add a repository variable `APP_IMAGE` with that image name: Settings, Secrets and
   variables, Actions, Variables.
3. Enable Pages: Settings, Pages, Source: GitHub Actions.

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

## Lessons recorded in the code

- **`toMatchObject` and interfaces.** In Playwright 1.64 `toMatchObject` expects an object type
  with an index signature, which interfaces do not have. The specs use exact `toEqual` with
  `expect.any()` instead, which is stricter anyway: an unexpected extra field fails the test.
- **Request contexts inherit `use` options.** Inside a test, `playwright.request.newContext()`
  receives the project's `use` options: `baseURL`, which is handy, and the worker's
  `storageState`, which is a trap. An anonymous client must pass an empty state explicitly.
- **Fixture teardown order.** `cleanup` depends on `api` and `db`, so both are still alive when
  the undo steps run.
- **First-load race.** The expenses page marks its list `aria-busy="false"` after the first load,
  and the page object waits for it. Without that a fast test could add an expense that the late
  list render then removes.
- **`.env` is not read by itself.** Docker Compose reads `.env`, Playwright does not.
  `playwright.config.ts` loads it with Node's built-in `process.loadEnvFile`, so one file serves
  both, with no `dotenv` dependency.
- **Database settings as fields, not a URL.** The pool gets host, port, name, user and password
  separately, so a password with `@` or `/` needs no URL escaping.
- **Changing `DB_PASSWORD` needs a fresh database.** PostgreSQL applies `POSTGRES_PASSWORD` only
  when it creates the data, so run `npm run env:down` and `npm run env:up` after changing it.
- **Allure history for load results.** Allure 3 builds the history id from the name and the
  parameters. Measured values change every run, so they are marked `excluded`.
- **A service named `app` breaks Chromium.** In CI the app's host name is its service name.
  `.app` is an HTTPS-only top-level domain on Chromium's HSTS preload list, so Chromium turned
  `http://app:3000` into https and failed with `ERR_SSL_PROTOCOL_ERROR`, while API tests and the
  local run (`localhost`) passed. The service is called `expense-app`.
- **`beforeEach` runs before the test's own fixtures.** A spec that opens the page in
  `beforeEach` requests the `expense` fixture there too; requested only by the test, the expense
  would be created after the page had loaded and never be shown.
