# Lesson 13: Loading, Errors, and Race Conditions

The starter app fetches study steps and has a search box, but it shows "No study steps yet." in five different situations: while loading, after a server error, when the server is down, when a search matches nothing, and sometimes it shows results for a search you already changed. Today you fix them one at a time, then move all of that handling into a custom hook any screen can reuse.

The starter app is the lesson 12 screen with three changes: it calls the local backend instead of JSONPlaceholder, it no longer maps `title` to `label` (the backend already sends `label`), and it has a search box.

## Setup

### 1. Start the backend

In a new terminal, from this lesson's folder. Keep it open all class:

```bash
cd backend
node server.js
```

No `npm install` needed. Check it in a browser: `http://localhost:3000/api/study-steps`

| Add to the URL | Effect |
| --- | --- |
| `q=che` | only steps whose label contains "che" |
| `delay=1500` | waits 1500 ms before answering |
| `error=1` | answers with a 500 error and a message |
| `race=1` | shorter searches answer slower: 2000 ms minus 400 ms per character |
| `flaky=2` | fails twice for the same URL, then succeeds once, then starts over |

The terminal logs every request, and logs `cancelled by the app` when your app cancels one.

### 2. Run the starter app

```bash
cd starter-app
npm install
npm start
```

Press `w` for the browser, or open your development build.

`src/lib/apiBaseUrl.js` picks the right address for your computer: `10.0.2.2` on the Android emulator, `localhost` everywhere else. On a physical phone, change `HOST` to your computer's LAN IP.

### 3. See what's wrong

`TEST_PARAMS` at the top of `src/app/details.js` is added to every request. Change it, save, then go back and reopen Study Steps.

| Try | You see |
| --- | --- |
| `'delay=1500'` | "No study steps yet." for 1.5 s, then the list |
| `'delay=1500&error=1'` | "No study steps yet." The error is only in the console |
| Stop the server (`Ctrl`+`C`) | "No study steps yet." |
| Search `zzz` | "No study steps yet." |
| `'race=1'`, then type `che` quickly | 9 results. Only 3 steps contain "che" |

Set it back to `'delay=1500'` and restart the server before you continue.

## How to build and commit a change

Build every change in this order:

1. Add the state, with a hard-coded starting value
2. Write every UI branch that state can produce
3. Check each branch by changing the hard-coded value and saving
4. Wire the logic that sets the state
5. Test against the backend
6. Commit

## Showing request status

Add `ActivityIndicator` to the `react-native` import, and a `status` state:

```js
const [status, setStatus] = useState('success'); // 'loading' | 'success' | 'error'
```

Replace the `steps.length === 0 ? ... : ...` block with one branch per status:

| `status` | Screen |
| --- | --- |
| `'loading'` | an `ActivityIndicator` and "Loading study steps..." |
| `'error'` | "Couldn't load study steps." |
| `'success'` with no results | No study steps match "`query`". |
| `'success'` with results | the list |

Check each branch by changing `useState('success')` to `'loading'` and `'error'`. Then set it to `'loading'` and wire it: set `'loading'` before the request, `'success'` after `setSteps`, and `'error'` in the `catch`.

| Test | Expected |
| --- | --- |
| `'delay=1500'` | spinner for 1.5 s, then the list |
| `'delay=1500&error=1'` | "Couldn't load study steps." |
| Search `zzz` | No study steps match "zzz". |

<details>
<summary>Solution</summary>

```js
const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
```

```js
async function loadSteps() {
  setStatus('loading');

  try {
    // ...the fetch and response.ok check are unchanged
    setSteps(await response.json());
    setStatus('success');
  } catch (error) {
    console.error('request failed', error);
    setStatus('error');
  }
}
```

```jsx
{status === 'loading' && (
  <View style={styles.card}>
    <ActivityIndicator size="large" color="#8c5d35" />
    <Text style={styles.cardTitle}>Loading study steps...</Text>
  </View>
)}

{status === 'error' && (
  <View style={[styles.card, styles.errorCard]}>
    <Text style={styles.cardTitle}>Couldn't load study steps.</Text>
  </View>
)}

{status === 'success' && steps.length === 0 && (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>No study steps match "{query}".</Text>
  </View>
)}

{status === 'success' && steps.length > 0 && (
  <FlatList
    data={steps}
    keyExtractor={(item) => item.id}
    renderItem={renderStep}
    ItemSeparatorComponent={() => <View style={styles.separator} />}
    style={styles.list}
  />
)}
```

One `status` value means the screen is always in exactly one state. With separate `isLoading` and `error` values, both can be set at once, and nothing says what the screen should show.

</details>

## Handling failed requests

Every HTTP response has a status code: 2xx means success, 4xx means the request was wrong, and 5xx means the server failed. A failed request still gets a response, and our backend explains the failure in the body: `{ "error": "..." }`.

`fetch` only cares whether a response arrived. It resolves for a 500 just like for a 200, and only rejects when nothing answered (server down, wrong address, offline). So checking `response.ok` is your job:

| What happened | What `fetch` does | What your code should do |
| --- | --- | --- |
| 2xx | resolves, `response.ok` is `true` | read the JSON, show the list |
| 4xx or 5xx | resolves, `response.ok` is `false` | read the body's `error`, throw it |
| No response | rejects with a `TypeError` | show the error |

Add an `errorMessage` state, throw the server's message when `response.ok` is `false`, and show the message in the error card.

| Test | Expected |
| --- | --- |
| `'delay=1500&error=1'` | "The server failed on purpose (error=1)." |
| Stop the server | `Failed to fetch` in the browser, `Network request failed` on a device |

<details>
<summary>Solution</summary>

```js
const [errorMessage, setErrorMessage] = useState('');
```

```js
if (!response.ok) {
  const body = await response.json().catch(() => ({}));
  throw new Error(body.error ?? `Server returned ${response.status}`);
}
```

```js
} catch (error) {
  setErrorMessage(error.message);
  setStatus('error');
}
```

```jsx
<View style={[styles.card, styles.errorCard]}>
  <Text style={styles.cardTitle}>Couldn't load study steps.</Text>
  <Text style={styles.cardBody}>{errorMessage}</Text>
</View>
```

Throwing for a bad status sends both kinds of failure to the same `catch`. `.catch(() => ({}))` covers an error response that isn't JSON.

</details>

## Retrying a request

Add a Retry button to the error card that runs the request again.

`loadSteps` is defined inside the effect, so a button can't call it. Instead, add a counter to the effect's dependencies. Changing the counter reruns the effect.

| Test | Expected |
| --- | --- |
| Stop the server, open Study Steps, start the server, press Retry | error, then spinner, then the list |

<details>
<summary>Solution</summary>

```js
const [reloadKey, setReloadKey] = useState(0);
```

```js
}, [query, reloadKey]);
```

```jsx
<Pressable style={styles.button} onPress={() => setReloadKey((key) => key + 1)}>
  <Text style={styles.buttonLabel}>Retry</Text>
</Pressable>
```

</details>

## Cancelling stale requests

Set `TEST_PARAMS = 'race=1'` and type `che` quickly. You get 9 results. Watch the server terminal: the request for `c` was sent first but answers last, and because every response calls `setSteps`, it overwrites the newer results.

Think of an `AbortController` as a bomb you attach to a request. `new AbortController()` builds it, passing `controller.signal` to `fetch` attaches it, and `controller.abort()` sets it off: the request stops and `fetch` rejects with an `AbortError`.

Build a new bomb in every run of the effect, and set off the old one in the effect's cleanup. React runs the cleanup before it runs the effect again, so by the time the slow answer for `c` would arrive, its request is already gone. Cancelled requests still land in `catch`, so return early there if `controller.signal.aborted` is `true`.

| Test | Expected |
| --- | --- |
| `'race=1'`, type `che` quickly | exactly 3 results |
| Server terminal | `cancelled by the app` for `?q=c` and `?q=ch` |

<details>
<summary>Solution</summary>

```js
useEffect(() => {
  const controller = new AbortController();

  async function loadSteps() {
    setStatus('loading');

    try {
      const url = `${API_BASE_URL}/study-steps?q=${encodeURIComponent(query)}&${TEST_PARAMS}`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${response.status}`);
      }

      setSteps(await response.json());
      setStatus('success');
    } catch (error) {
      if (controller.signal.aborted) return;
      setErrorMessage(error.message);
      setStatus('error');
    }
  }

  loadSteps();
  return () => controller.abort();
}, [query, reloadKey]);
```

An aborted `fetch` rejects, so the `catch` runs. Checking `controller.signal.aborted` keeps a cancelled request from showing an error.

</details>

## Refactoring into a custom hook

The screen now does two jobs: it manages a request (status, error message, retry, cancelling) and it decides what to show. The request half has nothing to do with study steps. Move it into a hook, `useFetch(url)`, so any screen can reuse it.

Work skeleton first:

1. Create `src/hooks/useFetch.js`. Write the hook's contract with hard-coded values: it takes a `url` and returns `{ status: 'success', data: [], errorMessage: '', retry: () => {} }`
2. Cut the state and the effect out of the screen. Build the URL in the screen, call `useFetch(url)`, and use `data ?? []` as the list. Save: the screen shows the no-matches message, which proves they're connected
3. Paste the state and the effect into the hook. Rename `steps` to `data` (starting as `null`), depend on `url` instead of `query`, and return a `retry` function instead of exposing `reloadKey`
4. In the screen, change Retry to `onPress={retry}`. Rerun every earlier test
5. Reuse it: show "10 study steps saved" on the Home screen with one call to `useFetch`

<details>
<summary>Solution</summary>

`src/hooks/useFetch.js`:

```js
import { useEffect, useState } from 'react';

// Fetches JSON from url. Refetches when url changes or retry() is called.
// Cancels the previous request whenever a new one starts.
export function useFetch(url) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus('loading');

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? `Server returned ${response.status}`);
        }

        setData(await response.json());
        setStatus('success');
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error.message);
        setStatus('error');
      }
    }

    load();
    return () => controller.abort();
  }, [url, reloadKey]);

  function retry() {
    setReloadKey((key) => key + 1);
  }

  return { status, data, errorMessage, retry };
}
```

In `src/app/details.js`, replace the state and the effect with:

```js
const url = `${API_BASE_URL}/study-steps?q=${encodeURIComponent(query)}&${TEST_PARAMS}`;
const { status, data, errorMessage, retry } = useFetch(url);
const steps = data ?? [];
```

In `src/app/index.js`:

```js
const { status, data } = useFetch(`${API_BASE_URL}/study-steps`);
```

```jsx
<Text style={styles.body}>
  {status === 'loading' && 'Loading study steps...'}
  {status === 'error' && "Couldn't load study steps."}
  {status === 'success' && `${data.length} study steps saved`}
</Text>
```

</details>

## Challenges

Pick one after class. Each one names a term to look up. Read until you understand it, then implement a solution in `useFetch` or alongside it, and commit it on its own.

### Debounce the search

Every keystroke sends a request. Typing `check` sends five, and four are cancelled right away. Look up **debounce**.

- **Trigger it:** `TEST_PARAMS = 'race=1'`. Type `check` and count the requests in the server terminal
- **Your solution:** send a request only after the user has stopped typing for 300 ms. Typing `check` quickly should log one request
- **Hint:** delay the value, not the request. Write a `useDebouncedValue(value, delayMs)` hook, and build the URL from the debounced query

<details>
<summary>Solution</summary>

`src/hooks/useDebouncedValue.js`:

```js
import { useEffect, useState } from 'react';

// Returns value, but only after it has stopped changing for delayMs.
export function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
```

In the screen:

```js
const debouncedQuery = useDebouncedValue(query, 300);
const url = `${API_BASE_URL}/study-steps?q=${encodeURIComponent(debouncedQuery)}&${TEST_PARAMS}`;
```

</details>

### Time out slow requests

`fetch` has no time limit. If a server accepts the connection but never answers, the spinner can stay up for minutes. Look up **fetch timeout with AbortController**.

- **Trigger it:** `TEST_PARAMS = 'delay=8000'`
- **Your solution:** give up after 5 seconds and show "The server took more than 5 seconds to answer."
- **Hint:** a timer can set off the same bomb the cleanup uses. Keep a flag, so `catch` can tell a timeout from a cleanup

<details>
<summary>Solution</summary>

In `useFetch`:

```js
useEffect(() => {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 5000);

  async function load() {
    setStatus('loading');

    try {
      // same as before
    } catch (error) {
      if (controller.signal.aborted && !timedOut) return;
      setErrorMessage(timedOut ? 'The server took more than 5 seconds to answer.' : error.message);
      setStatus('error');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  load();
  return () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
}, [url, reloadKey]);
```

</details>

### Retry automatically with backoff

Many failures are temporary: the network drops for a second, or the server is restarting. Production apps retry a few times before showing an error, and wait longer each time so they don't flood a server that's struggling. Look up **exponential backoff**.

- **Trigger it:** `TEST_PARAMS = 'flaky=2'`, then `'flaky=5'`
- **Your solution:** retry up to 3 times, waiting 500 ms, 1000 ms, then 2000 ms. With `flaky=2`, the list appears after the third request with no error. With `flaky=5`, the error appears after the fourth
- **Hint:** put the request in a loop, and wait between attempts. Check `controller.signal.aborted` after every wait

<details>
<summary>Solution</summary>

In `useFetch`, above the hook:

```js
const MAX_RETRIES = 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

Replace `load` inside the effect:

```js
async function load() {
  setStatus('loading');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${response.status}`);
      }

      setData(await response.json());
      setStatus('success');
      return;
    } catch (error) {
      if (controller.signal.aborted) return;

      if (attempt === MAX_RETRIES) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }

      await wait(500 * 2 ** attempt);
      if (controller.signal.aborted) return;
    }
  }
}
```

</details>

### Readable network errors

`Failed to fetch` and `Network request failed` mean nothing to a user, and the wording is different on every platform. Look up **fetch TypeError**.

- **Trigger it:** stop the server. Then also try a wrong port in `src/lib/apiBaseUrl.js`
- **Your solution:** when no response arrived, show "Can't reach the server. Check your connection and try again." Keep showing the server's own message for HTTP errors
- **Hint:** `fetch` rejects with a `TypeError` only when no response arrived. HTTP errors reach `catch` as the `Error` you threw yourself

<details>
<summary>Solution</summary>

In the `catch` in `useFetch`:

```js
setErrorMessage(
  error instanceof TypeError ? "Can't reach the server. Check your connection and try again." : error.message
);
```

</details>

## If you're stuck

| Problem | Try |
| --- | --- |
| `Failed to fetch` or `Network request failed` right away | Is `node server.js` running? On the Android emulator, is `HOST` `10.0.2.2`? On a phone, is it your computer's LAN IP, on the same Wi-Fi? |
| Stuck on loading forever | A path through your code never calls `setStatus('success')` or `setStatus('error')` |
| Error screen shows `Server returned 404` | The URL path is wrong. It must be `/api/study-steps` |
| Retry does nothing | `reloadKey` has to be in the effect's dependency array |
| After the refactor, the list never changes when you search | The hook's effect has to depend on `url`, not `query` |
| After adding cancelling, a cancelled request shows an error | You're missing `if (controller.signal.aborted) return;` in the `catch` |
| Still stuck | Compare with the class repository's commit for that step |

## Exercise

Do one challenge, then submit a write-up of 1 to 2 pages (Markdown or PDF):

1. **The problem:** in your own words, what the challenge's term means and what problem it solves. Name one source you read
2. **Your solution:** paste the code you changed, and explain how it works
3. **Proof:** the `TEST_PARAMS` you used, and the server terminal lines before and after your change
4. **The race:** explain why typing quickly showed the wrong results before you added cancelling, and how the effect's cleanup prevents it

Include one screenshot of your error state, with a caption saying how you triggered it.
