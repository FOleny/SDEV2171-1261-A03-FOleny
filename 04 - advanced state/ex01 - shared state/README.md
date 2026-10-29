# Lesson 15: Sharing State Between Screens

The starter app lets you build a study plan on the Study Steps screen and view it on the Plan screen. Remove a step on the Plan screen, go back, and Study Steps still counts it. The two screens each keep their own copy of the plan, and nothing keeps the copies in step.

Part 1 works out why that happens and where the plan should live. Part 2 moves the plan into a React context that every screen reads, in small steps that keep the app running after each one.

The starter app is the lesson 13 app with a plan added. `useFetch` is the hook you wrote at the end of lesson 13, unchanged.

## Setup

### 1. Start the backend

The same backend as lesson 13. In a new terminal, from this lesson's folder, and keep it open all class:

```bash
cd backend
node server.js
```

Check it in a browser: `http://localhost:3000/api/study-steps`

### 2. Run the starter app

```bash
cd starter-app
npm install
npm start
```

Press `w` for the browser, or open your development build. The app's config and dependencies match lesson 13's, so the development build from lesson 13 still works.

`src/lib/apiBaseUrl.js` picks the address of your computer: `10.0.2.2` on the Android emulator, `localhost` everywhere else. On a physical phone, change `HOST` to your computer's LAN IP.

### Going back in the browser

Go back with the app's header back arrow or the Go back button, not the browser's Back button. The browser's Back button remounts the whole app on the web, which resets the plan. [The browser's Back button](#the-browsers-back-button) explains why.

## Part 1: The problem

### See the screens disagree

Do these in order, and read the count after each one:

| Do this | Study Steps shows | Plan shows |
| --- | --- | --- |
| Add three steps | 3 in your plan | |
| Press Open plan | | 3 in your plan |
| Remove one step | | 2 in your plan |
| Go back | 3 in your plan | |
| Press Open plan again | | 3 in your plan |

The removal is lost. Study Steps never found out about it, and the second Open plan sent Study Steps' list again.

### Route params are strings

Study Steps sends the plan to the Plan screen like this:

```js
function openPlan() {
  // Route params are strings, so the selected steps are sent as JSON.
  router.push({ pathname: '/plan', params: { steps: JSON.stringify(selectedSteps) } });
}
```

Expo Router puts params in the URL, so a param can only be a string, and an array has to travel as JSON. In the browser, open the plan and look at the address bar. Decoded, it reads:

```
/plan?steps=[{"id":"1","label":"Charge laptop before class"},{"id":"2","label":"Check the emulator still boots"}]
```

The Plan screen gets a copy of the list as it was when you pressed Open plan. Nothing connects that copy to the array in Study Steps.

### The Plan screen keeps its own copy

```js
const { steps } = useLocalSearchParams();
// The useState initializer runs once, when this screen mounts.
const [planSteps, setPlanSteps] = useState(() => JSON.parse(steps ?? '[]'));
```

The function you pass to `useState` runs once, on the first render. After that, `planSteps` belongs to the Plan screen, and `removeStep` changes only the Plan screen's copy.

The app now has two arrays that each claim to be the plan. That's **duplicated state**: two owners of the same data, with nothing keeping them in step.

### The stack keeps Study Steps mounted

Pushing a screen puts it on top of the stack. The screen underneath stays mounted, with all its state, behind the new one. Going back pops the top screen and unmounts it.

Check it. Add `useEffect` to the `react` import in `details.js`, and this inside `DetailsScreen`:

```js
useEffect(() => {
  console.log('Details mounted');
  return () => console.log('Details unmounted');
}, []);
```

Add the same to `plan.js`, with `'Plan mounted'` and `'Plan unmounted'`. Then open Study Steps, open the plan, go back, and open the plan again.

| Do this | Console |
| --- | --- |
| Open Study Steps | `Details mounted` |
| Open plan | `Plan mounted` |
| Go back | `Plan unmounted` |
| Open plan again | `Plan mounted` |

`Details unmounted` only appears when you go back to Home. Study Steps keeps its list the whole time. The Plan screen is created fresh each time, from whatever params it was sent.

Remove the logs when you're done. Don't commit them.

### Why the screens drift apart

Three facts combine:

1. Route params are a string snapshot, taken when you navigate
2. The Plan screen copies that snapshot into its own state once, when it mounts
3. Study Steps stays mounted underneath, holding its own list

Each screen changes its own copy, and neither can see the other's changes.

Sending the plan back to Study Steps with more params doesn't fix it. Every screen that shows the plan would need a copy sent to it, and each copy is another snapshot that can go stale.

### What route params are for

Params are good for telling a screen **which** thing to show. They're poor at carrying the thing itself.

| A good param | Why it works |
| --- | --- |
| the `3` in `/step/3` | an id. The screen looks up step 3 itself, so it always shows current data |
| `q=che` in `/details?q=che` | a search the user could bookmark or share |
| a title for the next screen's header | read-only, and harmless if it's out of date |

On the web and in deep links, the URL is all a screen gets. A bookmarked `/plan?steps=[...]` shows a plan that may not exist anymore. A bookmarked `/step/3` still works.

### Local, duplicated, and shared state

| Kind | Meaning | In the starter app |
| --- | --- | --- |
| Local | one component owns it, and only that component uses it | `status` and `errorMessage` inside `useFetch` |
| Duplicated | two components each keep a copy of the same data | `selectedSteps` in Study Steps, and `planSteps` in Plan |
| Shared | one owner, and every component that needs it reads it from that owner | the goal for the plan |

Local state isn't a problem, and most state should stay local. Duplicated state is the problem.

For any value, ask: if it changes on this screen, does another screen need to see the change?

| Value | Does another screen need it? | Where it lives |
| --- | --- | --- |
| `status` and `errorMessage` for the request | No | local, in `useFetch` |
| the fetched study steps | No. Only Study Steps lists them | local, in `useFetch` |
| the plan | Yes: Study Steps, Plan, and soon Home | shared |
| whether one row is selected | It's computed from the plan | nowhere. It isn't state |

The last row is a **derived value**. `details.js` computes it during render with `selectedSteps.some(...)` instead of storing it. Storing it would make a third copy to keep in step.

### Lifting state up, and why a layout can't do it with props

React's standard fix for two components that need the same state is to **lift the state up**: move it into their closest common parent, and pass it down as props. The parent owns the state. The children read it from props, and change it by calling functions the parent passes down.

The closest common parent of Study Steps and Plan is the root layout, `src/app/_layout.tsx`:

```tsx
<Stack>
  <Stack.Screen name="index" options={{ title: 'Home' }} />
  <Stack.Screen name="details" options={{ title: 'Study Steps' }} />
  <Stack.Screen name="plan" options={{ title: 'Plan' }} />
</Stack>
```

Nowhere do you write `<DetailsScreen steps={...} />`. Expo Router renders each screen from its file, so the layout has nowhere to pass props. The layout can own the state, but it needs another way to hand it down.

That's what **Context** is for. A component above the screens provides a value once, and any component below it reads that value directly, without props.

### Part 1 checkpoint

- Why doesn't removing a step on the Plan screen change the count on Study Steps?
- Which screen stays mounted when you open the plan, and how did you check?
- Name one value in this app that should stay local, and one that should be shared
- Give one thing route params are good for, and one thing they're bad for

## Part 2: Moving the plan into context

### How context works

```js
const StudyPlanContext = createContext(null);

// A component above the screens provides the value:
<StudyPlanContext value={value}>{children}</StudyPlanContext>

// Any component below it reads the value:
const value = useContext(StudyPlanContext);
```

| Piece | Its job |
| --- | --- |
| `createContext(defaultValue)` | creates the context. The default is used only when there's no provider above |
| the provider | supplies the current value to every component inside it |
| `useContext(SomeContext)` | reads the value from the nearest provider above |

When the provided value changes, every component that reads it re-renders with the new value.

React 19 lets you render the context itself as the provider, as above. Older code and tutorials write `<StudyPlanContext.Provider value={value}>`. It still works, but React plans to deprecate it.

### How to build and commit a change

Build every change in this order:

1. Write the shape first, with hard-coded values
2. Connect everything that uses it
3. Check that the app runs and shows the hard-coded values
4. Replace the hard-coded values with the real logic
5. Test the whole flow
6. Commit

In this refactor, the shape is the context's value: what it holds, and which functions it offers. Once both screens read that shape, replacing the hard-coded values with real state changes one file and no screens.

The refactor is four commits on top of the starter, and the app runs after each one:

| Change | What you check after it |
| --- | --- |
| Add the context file with a hard-coded value, and wrap the layout in its provider | the app works exactly as before |
| Read the plan from context on both screens | both screens show 0, and Add does nothing yet |
| Keep the plan's state in the provider | both screens agree |
| Show the plan count on Home | a third screen agrees too |

The second row looks like a step backwards, and that's on purpose. The screens are connected to the context before it holds anything real. If a screen shows the wrong thing after the third commit, the bug is in the provider, because the screens already worked with the hard-coded value.

### The context's contract

Create `src/context/StudyPlanContext.js`. The provider's `value` is hard-coded for now. It's the contract: the three names every screen will use.

Below the provider, write a hook called `useStudyPlan` that screens call instead of `useContext`. Make it throw a clear error when there's no provider above. Without the guard, `useContext` returns the default, `null`, and a screen that destructures `null` crashes with a `Cannot destructure` error that doesn't say what's missing.

Test the guard before the provider is in place: add `useStudyPlan(); // temporary: test the guard` to the top of `HomeScreen` in `index.js` (and import the hook), then save.

| Test | Expected |
| --- | --- |
| Save with the temporary line in Home | error screen: `useStudyPlan must be used inside StudyPlanProvider` |

Leave the temporary line there for the next step.

<details>
<summary>Solution</summary>

`src/context/StudyPlanContext.js`:

```js
import { createContext, useContext } from 'react';

const StudyPlanContext = createContext(null);

export function StudyPlanProvider({ children }) {
  // TODO: replace these hard-coded values with real state
  const value = {
    selectedSteps: [],
    toggleStep: () => {},
    removeStep: () => {},
  };

  return <StudyPlanContext value={value}>{children}</StudyPlanContext>;
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);

  if (!context) {
    throw new Error('useStudyPlan must be used inside StudyPlanProvider');
  }

  return context;
}
```

The context object isn't exported, so `useStudyPlan` is the only way to read it.

</details>

### Provide the plan above every screen

Wrap the `Stack` in `src/app/_layout.tsx` in `StudyPlanProvider`. The root layout is the closest component above all three screens. A provider in `details.js` would only reach Study Steps.

| Test | Expected |
| --- | --- |
| Save | the guard's error is gone, because Home is now inside the provider |
| Remove the temporary line from Home, and use the app | everything works exactly as before |

Commit: `2. Add StudyPlan context with a hard-coded value`

<details>
<summary>Solution</summary>

`src/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { StudyPlanProvider } from '../context/StudyPlanContext';

export default function Layout() {
  return (
    <StudyPlanProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="details" options={{ title: 'Study Steps' }} />
        <Stack.Screen name="plan" options={{ title: 'Plan' }} />
      </Stack>
    </StudyPlanProvider>
  );
}
```

</details>

### Read the plan from context on both screens

In `details.js`, replace the `selectedSteps` state and the `toggleStep` function with a call to `useStudyPlan`, and stop sending params. In `plan.js`, replace `useLocalSearchParams` and the `planSteps` state. Remove the imports you no longer use.

| Test | Expected |
| --- | --- |
| Open Study Steps | 0 in your plan. Add does nothing |
| Open the plan | 0 in your plan, and the empty message |

That's the right result: the screens are connected, and the context still holds the hard-coded value.

Commit: `3. Read the plan from context on both screens`

<details>
<summary>Solution</summary>

In `details.js`, remove `import { useState } from 'react';`, and add:

```js
import { useStudyPlan } from '../context/StudyPlanContext';
```

Replace the `selectedSteps` state and the whole `toggleStep` function with:

```js
const { selectedSteps, toggleStep } = useStudyPlan();
```

and `openPlan` with:

```js
function openPlan() {
  router.push('/plan');
}
```

In `plan.js`, change the imports to:

```js
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStudyPlan } from '../context/StudyPlanContext';
```

Replace `useLocalSearchParams`, the `planSteps` state, and `removeStep` with:

```js
const { selectedSteps: planSteps, removeStep } = useStudyPlan();
```

Renaming `selectedSteps` to `planSteps` leaves the rest of `plan.js` unchanged.

</details>

### Keep the plan's state in the provider

Replace the hard-coded value in the provider with real state. The code is the state and functions that used to be in Study Steps, moved up into the provider. Neither screen changes.

| Do this | Study Steps shows | Plan shows |
| --- | --- | --- |
| Add three steps | 3 in your plan | |
| Press Open plan | | 3 in your plan |
| Remove one step | | 2 in your plan |
| Go back | 2 in your plan | |
| Press Open plan again | | 2 in your plan |

There's one array now, owned by the provider. When its state changes, React re-renders every component that calls `useStudyPlan`, including Study Steps while it sits under the plan.

Commit: `4. Keep the plan state in the provider`

<details>
<summary>Solution</summary>

`src/context/StudyPlanContext.js`:

```js
import { createContext, useContext, useState } from 'react';

const StudyPlanContext = createContext(null);

export function StudyPlanProvider({ children }) {
  const [selectedSteps, setSelectedSteps] = useState([]);

  function toggleStep(step) {
    setSelectedSteps((currentSteps) => {
      const alreadySelected = currentSteps.some((entry) => entry.id === step.id);

      if (alreadySelected) {
        return currentSteps.filter((entry) => entry.id !== step.id);
      }

      return [...currentSteps, step];
    });
  }

  function removeStep(id) {
    setSelectedSteps((currentSteps) => currentSteps.filter((step) => step.id !== id));
  }

  const value = { selectedSteps, toggleStep, removeStep };

  return <StudyPlanContext value={value}>{children}</StudyPlanContext>;
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);

  if (!context) {
    throw new Error('useStudyPlan must be used inside StudyPlanProvider');
  }

  return context;
}
```

</details>

### Home reads the same plan

Show `3 in your plan` on Home, under the title. A third screen that needs the plan takes one import and one hook call. With params, Home would need a copy sent to it by every screen that can go back to it.

| Test | Expected |
| --- | --- |
| Add three steps, then go back to Home | 3 in your plan |
| Remove one on the plan, then go back to Home | 2 in your plan |

Commit: `5. Show the plan count on Home`

<details>
<summary>Solution</summary>

`src/app/index.js`:

```js
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStudyPlan } from '../context/StudyPlanContext';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedSteps } = useStudyPlan();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Text style={styles.eyebrow}>SDEV2171 lesson 15</Text>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.body}>{selectedSteps.length} in your plan</Text>
      <Pressable style={styles.button} onPress={() => router.push('/details')}>
        <Text style={styles.buttonLabel}>Open study steps</Text>
      </Pressable>
    </View>
  );
}

// Includes a body style that later steps use.
const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, paddingTop: 42, backgroundColor: '#f5efe7' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: '#8c5d35' },
  title: { fontSize: 30, fontWeight: '800', color: '#1f1b18' },
  body: { fontSize: 15, color: '#5d554d' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
```

</details>

### What stays out of the context

| Value | Where it stays | Why |
| --- | --- | --- |
| `status`, `data`, `errorMessage` | `useFetch`, in Study Steps | only Study Steps shows the request |
| text the user is typing in a form | the screen with the form | nothing else needs it until it's submitted |
| whether a row is selected | computed in `renderStep` | it's derived from the plan |

Every component that reads a context re-renders when that context's value changes. Put only the data that more than one screen needs into a context.

### The browser's Back button

In the browser, the browser's own Back button remounts the app's root layout. That unmounts the provider, and the plan resets to empty. The app's header back arrow and the Go back button keep the plan, because they pop the stack inside the app. On a phone, Android's Back button and the iOS swipe gesture pop the stack too.

Saving the plan to storage, the first challenge, fixes this as well.

## How production apps do this

Production apps split state into two kinds and use a different tool for each:

| | Server state | Client state |
| --- | --- | --- |
| Example | the study steps from the API | the plan the user is building |
| Owned by | the server. The app holds a copy that can go stale | the app |
| Needs | caching, refetching, retries, cancelling | sharing between screens, sometimes saving to the device |
| Common tools | TanStack Query, RTK Query, SWR | Context, Zustand, Redux Toolkit, Jotai |

The TanStack Query docs call the client state that's left after moving async data into a server-state library "usually very tiny" ([Does TanStack Query replace Redux, MobX or other global state managers?](https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state)). A context or two often covers it.

**When a context gets expensive.** React re-renders every component that reads a context when the provider's value changes, comparing old and new values with `Object.is`. A new object counts as a change even when its contents are the same. Our provider builds a new `value` every render, which is fine because it only renders when the plan changes. A provider that re-renders for other reasons should wrap the value in `useMemo` and its functions in `useCallback` ([useContext, "Optimizing re-renders when passing objects and functions"](https://react.dev/reference/react/useContext)). A context holding unrelated data should be split, so a screen that reads only the user doesn't re-render when the plan changes.

**The same plan in Zustand.** [Zustand](https://github.com/pmndrs/zustand) is a small client-state library. A store is a hook created outside any component, with no provider:

```js
import { create } from 'zustand';

export const useStudyPlan = create((set) => ({
  selectedSteps: [],
  toggleStep: (step) =>
    set((state) => ({
      selectedSteps: state.selectedSteps.some((entry) => entry.id === step.id)
        ? state.selectedSteps.filter((entry) => entry.id !== step.id)
        : [...state.selectedSteps, step],
    })),
  removeStep: (id) => set((state) => ({
    selectedSteps: state.selectedSteps.filter((step) => step.id !== id),
  })),
}));
```

Today's screens work with this store unchanged, and the layout drops `StudyPlanProvider`. A component can pass a **selector**, and it re-renders only when the selected value changes:

```js
const count = useStudyPlan((state) => state.selectedSteps.length);
```

A context can't do that: every reader re-renders on every change to its value. Zustand's `persist` middleware saves a store to AsyncStorage, which the first challenge does by hand.

Choose Context when a few screens share a small value that changes rarely. Reach for a store like Zustand when many components read different parts of a large, frequently changing state.

## Challenges

Pick one after class. Each one names a term to look up. Read until you understand it, then implement a solution on top of your finished context, and commit it on its own.

### Save the plan between launches

The plan lives in memory, so it's gone whenever the app restarts. Look up **AsyncStorage**.

- **Trigger it:** add three steps, then reload the app (press `r` in the Expo terminal, or refresh the browser). Home shows 0 in your plan
- **Your solution:** load the saved plan when the provider mounts, and save it whenever it changes. After a reload, Home shows the same count as before
- **Hint:** use two effects in the provider, one that loads once and one that saves when `selectedSteps` changes. The save mustn't run until the load has finished, or it writes the empty starting plan over the saved one. AsyncStorage stores only strings, so the plan goes in and out as JSON

Install it with:

```bash
npx expo install @react-native-async-storage/async-storage
```

It's a native module, so rebuild your development build afterwards (`npm run android:dev`, or `npm run ios:dev`). In the browser it uses `localStorage`, and needs no rebuild.

<details>
<summary>Solution</summary>

`src/context/StudyPlanContext.js`:

```js
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'study-plan';

const StudyPlanContext = createContext(null);

export function StudyPlanProvider({ children }) {
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the saved plan once, when the provider mounts.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setSelectedSteps(JSON.parse(saved));
      setIsLoaded(true);
    });
  }, []);

  // Save the plan whenever it changes, but not before the saved one has loaded.
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSteps));
  }, [selectedSteps, isLoaded]);

  function toggleStep(step) {
    setSelectedSteps((currentSteps) => {
      const alreadySelected = currentSteps.some((entry) => entry.id === step.id);

      if (alreadySelected) {
        return currentSteps.filter((entry) => entry.id !== step.id);
      }

      return [...currentSteps, step];
    });
  }

  function removeStep(id) {
    setSelectedSteps((currentSteps) => currentSteps.filter((step) => step.id !== id));
  }

  const value = { selectedSteps, toggleStep, removeStep };

  return <StudyPlanContext value={value}>{children}</StudyPlanContext>;
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);

  if (!context) {
    throw new Error('useStudyPlan must be used inside StudyPlanProvider');
  }

  return context;
}
```

Without `isLoaded`, the save effect runs on the first render with `[]` and overwrites the saved plan before the load finishes.

</details>

### Show the plan count in the header

Every screen should show the plan's size, without each screen adding its own count. The header is drawn by the `Stack` in the layout. Look up **headerRight** in the Expo Router Stack docs.

- **Trigger it:** open any screen. Nothing in the header shows the plan
- **Your solution:** show `Plan: 3` at the right end of every screen's header, and keep it current as you add and remove steps
- **Hint:** `screenOptions` on `<Stack>` applies to every screen, and `headerRight` takes a function that returns a component. Calling `useStudyPlan` in `Layout` itself throws: `Layout` renders the provider, so it's above it, not inside it. Write a small component that calls the hook, and render that in the header

<details>
<summary>Solution</summary>

`src/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { StudyPlanProvider, useStudyPlan } from '../context/StudyPlanContext';

function PlanBadge() {
  const { selectedSteps } = useStudyPlan();
  return <Text style={{ fontWeight: '700', marginRight: 16 }}>Plan: {selectedSteps.length}</Text>;
}

export default function Layout() {
  return (
    <StudyPlanProvider>
      <Stack screenOptions={{ headerRight: () => <PlanBadge /> }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="details" options={{ title: 'Study Steps' }} />
        <Stack.Screen name="plan" options={{ title: 'Plan' }} />
      </Stack>
    </StudyPlanProvider>
  );
}
```

</details>

### Clear the plan with a reducer

Each new action on the plan adds another function to the provider, each with its own `setSelectedSteps` call. Look up **useReducer**.

- **Trigger it:** try to empty a plan of five steps. You have to remove them one at a time
- **Your solution:** move every change to the plan into one reducer function with `toggle`, `remove` and `clear` actions. Add a Clear plan button to the Plan screen, shown only when the plan isn't empty. The screens keep calling `toggleStep` and `removeStep` exactly as before
- **Hint:** a reducer takes the current state and an action, and returns the next state. The provider turns each function in the contract into a `dispatch` call, so the contract only grows by `clearPlan`

<details>
<summary>Solution</summary>

`src/context/StudyPlanContext.js`:

```js
import { createContext, useContext, useReducer } from 'react';

const StudyPlanContext = createContext(null);

function planReducer(selectedSteps, action) {
  switch (action.type) {
    case 'toggle': {
      const alreadySelected = selectedSteps.some((entry) => entry.id === action.step.id);
      return alreadySelected
        ? selectedSteps.filter((entry) => entry.id !== action.step.id)
        : [...selectedSteps, action.step];
    }
    case 'remove':
      return selectedSteps.filter((step) => step.id !== action.id);
    case 'clear':
      return [];
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export function StudyPlanProvider({ children }) {
  const [selectedSteps, dispatch] = useReducer(planReducer, []);

  const value = {
    selectedSteps,
    toggleStep: (step) => dispatch({ type: 'toggle', step }),
    removeStep: (id) => dispatch({ type: 'remove', id }),
    clearPlan: () => dispatch({ type: 'clear' }),
  };

  return <StudyPlanContext value={value}>{children}</StudyPlanContext>;
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);

  if (!context) {
    throw new Error('useStudyPlan must be used inside StudyPlanProvider');
  }

  return context;
}
```

In `plan.js`, read `clearPlan` too:

```js
const { selectedSteps: planSteps, removeStep, clearPlan } = useStudyPlan();
```

and add the button above Go back:

```jsx
{planSteps.length > 0 && (
  <Pressable style={styles.secondaryButton} onPress={clearPlan}>
    <Text style={styles.secondaryButtonLabel}>Clear plan</Text>
  </Pressable>
)}
```

The `default` case throws, so a typo in an action type fails loudly instead of silently returning `undefined` as the plan.

</details>

### A step screen from an id

This is the job route params are good at. Look up **dynamic routes** in the Expo Router docs.

- **Trigger it:** tap a step's name on the Plan screen. Nothing happens
- **Your solution:** tapping a step's name opens `/step/3`, which shows that step's label and a Remove from plan button. Removing goes back to the plan, which now has one fewer step. Opening `/step/99` shows "Step 99 isn't in your plan."
- **Hint:** a file named `src/app/step/[id].js` matches `/step/` followed by any id. The URL carries only the id. Look the step up in the plan from context, so the screen always shows current data

<details>
<summary>Solution</summary>

`src/app/step/[id].js`:

```js
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStudyPlan } from '../../context/StudyPlanContext';

export default function StepScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { selectedSteps, removeStep } = useStudyPlan();

  // The URL carries only the id. The step itself comes from the shared plan.
  const step = selectedSteps.find((entry) => entry.id === id);

  function removeAndGoBack() {
    removeStep(id);
    router.back();
  }

  return (
    <View style={styles.screen}>
      {step ? (
        <>
          <Text style={styles.title}>{step.label}</Text>
          <Text style={styles.body}>Step {id} in your plan.</Text>
          <Pressable style={styles.button} onPress={removeAndGoBack}>
            <Text style={styles.buttonLabel}>Remove from plan</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.body}>Step {id} isn't in your plan.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  title: { fontSize: 24, fontWeight: '800', color: '#1f1b18' },
  body: { fontSize: 15, color: '#5d554d' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
```

In `plan.js`, wrap each step's label in a `Pressable`:

```jsx
<Pressable style={styles.rowLabelButton} onPress={() => router.push(`/step/${step.id}`)}>
  <Text style={styles.rowLabel}>{step.label}</Text>
</Pressable>
```

and change the label styles, so the `Pressable` takes the row's spare width and the label looks tappable:

```js
rowLabelButton: { flex: 1 },
rowLabel: { fontSize: 15, color: '#2d2620', textDecorationLine: 'underline' },
```

In `_layout.tsx`, give the new screen a title:

```tsx
<Stack.Screen name="step/[id]" options={{ title: 'Step' }} />
```

</details>

## If you're stuck

| Problem | Try |
| --- | --- |
| `useStudyPlan must be used inside StudyPlanProvider` | The component calling the hook isn't inside the provider. Check that `_layout.tsx` wraps the whole `Stack`, and that you aren't calling the hook in `Layout` itself |
| `Cannot destructure property 'selectedSteps'` | Something calls `useContext` directly instead of `useStudyPlan`, or the hook doesn't throw when the context is `null` |
| Both screens show 0 and Add does nothing | Expected right after you connect the screens. Once the provider has real state, check that its `value` isn't still the hard-coded one |
| The plan is empty after going back in the browser | You used the browser's Back button. Use the app's back arrow or Go back |
| `Unable to resolve "../context/StudyPlanContext"` | The file belongs in `src/context/`, next to `src/app/`, not inside `src/app/`. From `src/app/step/`, the path is `../../context/StudyPlanContext` |
| After adding AsyncStorage: `NativeModule: AsyncStorage is null` | Rebuild your development build. The old build doesn't include the native module |
| Still stuck | Compare with the class repository's commit for that step |

## Exercise

Do one challenge, then submit a write-up of 1 to 2 pages (Markdown or PDF):

1. **The problem:** in your own words, what the challenge's term means and what problem it solves. Name one source you read
2. **Your solution:** paste the code you changed, and explain how it works
3. **Proof:** the steps you took to test it, and a screenshot of the result
4. **The drift:** explain why the starter app's two screens disagreed after you removed a step, using the three causes from Part 1, and how one provider fixed it
