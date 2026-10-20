# Lesson 13: Loading, Errors, and Race Conditions

Your lesson 12 screen shows "No study steps yet." in three different situations: while it's loading, when the request fails, and when there really is no data. Today you make the screen tell those apart, then fix a bug that most React apps with a search box have.

Start from your lesson 12 project. If yours isn't working, use the lesson 12 `reference-app`.

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

The terminal logs every request, and logs `cancelled by the app` when your app cancels one.

### 2. Point your app at it

Create `src/lib/apiBaseUrl.js`:

```js
import { Platform } from 'react-native';

// The Android emulator reaches your computer at 10.0.2.2.
// The iOS simulator and the browser can use localhost.
// On a physical phone, replace HOST with your computer's LAN IP, e.g. '192.168.1.50'.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${HOST}:3000/api`;
```

In `src/app/details.js`, import it:

```js
import { API_BASE_URL } from '../lib/apiBaseUrl';
```

Change the fetch URL to `` `${API_BASE_URL}/study-steps` ``. The backend already returns `{ id, label }`, so replace the whole `setRemoteSteps(data.map(...))` call with:

```js
setRemoteSteps(data);
```

The list should show 10 study steps, starting with "Charge laptop before class".

## Challenge 1: Request states

Replace `remoteSteps` with three pieces of state:

```js
const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
const [steps, setSteps] = useState([]);
const [errorMessage, setErrorMessage] = useState('');
```

Add this above the component and add `?${TEST_PARAMS}` to the end of your fetch URL:

```js
// Test controls sent to the backend. Change, save, then press Retry.
const TEST_PARAMS = 'delay=1500';
```

Your screen must:

1. Show an `ActivityIndicator` and "Loading study steps..." while the request is running
2. Show the list on success
3. On a server error, show the message from the response body. The backend sends `{ "error": "..." }`
4. On any error, show a **Retry** button that runs the request again

Test all of these:

| Test | Expected |
| --- | --- |
| `TEST_PARAMS = 'delay=1500'` | spinner for 1.5 s, then the list |
| `TEST_PARAMS = 'delay=1500&error=1'` | "The server failed on purpose (error=1)." and Retry |
| Stop the server (`Ctrl`+`C`) and press Retry | a network error: `Failed to fetch` in the browser, `Network request failed` on a device |
| Start the server, set `TEST_PARAMS` back to `'delay=1500'`, press Retry | spinner, then the list |

<details>
<summary>Solution</summary>

```js
async function loadSteps() {
  setStatus('loading');

  try {
    const response = await fetch(`${API_BASE_URL}/study-steps?${TEST_PARAMS}`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? `Server returned ${response.status}`);
    }

    setSteps(await response.json());
    setStatus('success');
  } catch (error) {
    setErrorMessage(error.message);
    setStatus('error');
  }
}

useEffect(() => {
  loadSteps();
}, []);
```

```jsx
{status === 'loading' && (
  <View>
    <ActivityIndicator size="large" />
    <Text>Loading study steps...</Text>
  </View>
)}

{status === 'error' && (
  <View>
    <Text>Couldn't load study steps</Text>
    <Text>{errorMessage}</Text>
    <Pressable onPress={loadSteps}>
      <Text>Retry</Text>
    </Pressable>
  </View>
)}

{status === 'success' && (
  <FlatList
    data={steps}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <Text>{item.label}</Text>}
  />
)}
```

`fetch` only rejects when there's no response at all. A 404 or 500 resolves normally, so you check `response.ok` and throw yourself. `.catch(() => ({}))` covers an error response that isn't JSON.

</details>

## Challenge 2: Search without stale results

### Add the search

1. Add `query` state and a `TextInput` bound to it
2. Add `q=${encodeURIComponent(query)}` to the fetch URL
3. Move the request into an effect that reruns when the query changes. Replace Retry's `loadSteps` call with a counter:

```js
const [query, setQuery] = useState('');
const [reloadKey, setReloadKey] = useState(0);

useEffect(() => {
  async function loadSteps() {
    // your Challenge 1 code, with the new URL
  }

  loadSteps();
}, [query, reloadKey]);
```

```jsx
<Pressable onPress={() => setReloadKey((key) => key + 1)}>
```

### Reproduce the bug

Set `TEST_PARAMS = 'race=1'`. Type `che` quickly.

You should see 9 results instead of 3. Watch the server terminal: the request for `c` was sent first but answers last, and it overwrites the newer results.

### Fix it

Cancel the previous request whenever the effect runs again. The cleanup function you return from an effect runs before the next run of that effect, and when the screen unmounts.

The fix is done when:

- typing `che` quickly shows exactly 3 results
- the server terminal shows `cancelled by the app` for the older requests

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

The full finished screen is `reference-app/src/app/details.js`.

</details>

## Extensions

Do any of these once Challenge 2 works.

| Extension | Done when |
| --- | --- |
| **Debounce:** wait 300 ms after the last keystroke before sending the request | typing `che` quickly sends one request, not three |
| **Timeout:** give up after 5 seconds | `TEST_PARAMS = 'delay=8000'` shows "The server took more than 5 seconds to answer." |
| **Server down:** a readable message for network errors | with the server stopped, the screen says "Can't reach the server. Is it running?" |
| **Custom hook:** move the request into `useStudySteps(query, reloadKey)` in `src/hooks/useStudySteps.js` | the screen calls `const { status, steps, errorMessage } = useStudySteps(query, reloadKey);` and works the same |

<details>
<summary>Debounce</summary>

Replace the last two lines of the effect:

```js
const timeoutId = setTimeout(loadSteps, 300);
return () => {
  clearTimeout(timeoutId);
  controller.abort();
};
```

</details>

<details>
<summary>Timeout</summary>

```js
useEffect(() => {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 5000);

  async function loadSteps() {
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

  loadSteps();
  return () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
}, [query, reloadKey]);
```

</details>

<details>
<summary>Server down</summary>

A network failure rejects with a `TypeError`. In the `catch`:

```js
setErrorMessage(error instanceof TypeError ? "Can't reach the server. Is it running?" : error.message);
```

</details>

<details>
<summary>Custom hook</summary>

`src/hooks/useStudySteps.js`:

```js
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/apiBaseUrl';

const TEST_PARAMS = 'delay=1500';

export function useStudySteps(query, reloadKey) {
  const [status, setStatus] = useState('loading');
  const [steps, setSteps] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // the whole effect from Challenge 2
  }, [query, reloadKey]);

  return { status, steps, errorMessage };
}
```

In the screen, remove the three state values and the effect, and import the hook.

</details>

## If you're stuck

| Problem | Try |
| --- | --- |
| `Failed to fetch` or `Network request failed` right away | Is `node server.js` running? On the Android emulator, is `HOST` `10.0.2.2`? On a phone, is it your computer's LAN IP, on the same Wi-Fi? |
| Stuck on loading forever | A path through your code never calls `setStatus('success')` or `setStatus('error')` |
| Error screen shows `Server returned 404` | The URL path is wrong. It must be `/api/study-steps` |
| Retry does nothing | In Challenge 2, Retry has to change `reloadKey`, and `reloadKey` has to be in the effect's dependency array |
| The server terminal floods with requests | `onPress={loadSteps()}` runs the request on every render. Use `onPress={loadSteps}` |
| After the fix, a cancelled request shows an error | You're missing `if (controller.signal.aborted) return;` in the `catch` |
| Still stuck | Compare with `reference-app/src/app/details.js` |

## Exercise

Submit a write-up of 1 to 2 pages (Markdown or PDF):

1. **Status:** paste your request code. Explain why one `status` value is safer than separate `isLoading` and `error` values, with an example of a state the booleans allow that makes no sense
2. **Two kinds of failure:** explain the difference between a 500 response and a network error. How does your code handle each one?
3. **The race:** paste the server terminal lines from your race test, before and after the fix. Explain why the wrong results appeared, and how the cleanup function prevents it
4. **One extension:** which one you did, the code, and how you tested it

Include one screenshot of your error state, with a caption saying how you triggered it.
