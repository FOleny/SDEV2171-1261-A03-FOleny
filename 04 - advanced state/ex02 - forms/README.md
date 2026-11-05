# Lesson 16: Forms and Saved State

The starter app is the finished lesson 15 app: the plan lives in `StudyPlanContext`, and Home, Study Steps and Plan all read it. Today you add a form that saves the plan as a named study session. The form keeps what the user types in its own state, checks it, and only puts the result into the context when the user presses Save. Plan and Home then show the saved session.

## Setup

### 1. Start the backend

The same backend as lessons 13 and 15. In a new terminal, from this lesson's folder, and keep it open all class:

```bash
cd backend
node server.js
```

### 2. Run the starter app

```bash
cd starter-app
npm install
npm start
```

Press `w` for the browser, or open your development build. The app's config and dependencies haven't changed since lesson 13, so your development build still works.

Add three steps on Study Steps, and check that Study Steps, Plan and Home all show 3 before you change anything.

Go back with the app's header back arrow or the Go back button, not the browser's Back button. On the web, the browser's Back button remounts the app and resets the plan.

## Draft state and saved state

A form has two kinds of state, and they live in different places:

| | Draft | Saved session |
| --- | --- | --- |
| What it is | what the user is typing right now | what the user chose to keep |
| Changes | on every keystroke | once, when the user presses Save |
| Who needs it | the form screen only | the form, Plan, and Home |
| Where it lives | `useState` in the form screen | the context |
| If the user leaves | it's thrown away | it stays |

In lesson 15, the Plan screen kept its own copy of the plan, and that was the bug: two copies of data that was supposed to be one list. A draft is also a copy, but on purpose. The user should be able to type, change their mind, and leave without touching the saved data. Duplicated state is two owners of data that should always match. A draft is data that isn't supposed to match yet.

Why not type straight into the context? Every component that reads the context would re-render on every keystroke, Home and Plan would show a half-typed title, and there'd be no way to cancel.

## How to build and commit a change

Build every change in this order:

1. Write the shape first, with hard-coded values
2. Connect everything that uses it
3. Check that the app runs and shows the hard-coded values
4. Replace the hard-coded values with the real logic
5. Test the whole flow
6. Commit

Today's changes, and what to check after each one:

| Change | What you check after it |
| --- | --- |
| Add the form screen with controlled inputs | typing works, and Save logs the draft |
| Validate the draft | errors appear after the first Save, and clear as you fix them |
| Add the saved session to the context, hard-coded | Plan and Home show a test session |
| Save the session and leave the form | the saved session appears on Plan and Home |
| Extract a field component | nothing visible changes |

## The session form

Create `src/app/session-form.js`, register it in `src/app/_layout.tsx` with the title `Save Session`, and add a Save as session button on the Plan screen, above Go back, that opens it.

The form has two **controlled inputs**: each `TextInput` shows a value from state (`value={title}`) and sends every change back to state (`onChangeText={setTitle}`).

- `onChangeText` gives you the new text as a string. `onChange` gives you an event, with the text in `event.nativeEvent.text`
- A `TextInput` value is always a string, even with `keyboardType="numeric"`
- The input shows the state, not what was typed. Remove `onChangeText`, and typing does nothing

For now, Save only logs the draft.

**Trim when you save, not while typing.** `onChangeText={(text) => setTitle(text.trim())}` breaks typing: after `Week ` the trailing space is removed before the `3` arrives, and you get `Week3`. Let the draft hold exactly what was typed, and trim when you validate and save.

| Test | Expected |
| --- | --- |
| Add three steps, open Plan, press Save as session | the Save Session screen, with `Steps in this session: 3` |
| Type `  Week 3  ` as the title, and a goal, then press Save session | the console logs the draft, spaces included |
| Type or paste more than 40 characters into Title | it stops at 40 |

Commit: `2. Add the session form with controlled inputs`

<details>
<summary>Solution</summary>

`src/app/session-form.js`:

```js
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStudyPlan } from '../context/StudyPlanContext';

export default function SessionFormScreen() {
  const { selectedSteps } = useStudyPlan();
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');

  function handleSave() {
    // TODO: validate, then save to the context
    console.log('draft', { title, goal });
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Steps in this session: {selectedSteps.length}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Week 3 lab prep"
          maxLength={40}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Goal (optional)</Text>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="What should this session get done?"
          multiline
          style={[styles.input, styles.multiline]}
        />
      </View>

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonLabel}>Save session</Text>
      </Pressable>
    </ScrollView>
  );
}

// Includes the error styles that later steps use.
const styles = StyleSheet.create({
  screen: { flexGrow: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  intro: { fontSize: 15, color: '#5d554d' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#4d3214' },
  input: {
    borderWidth: 1,
    borderColor: '#d2c4b5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fffdfb',
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: '#b4533a' },
  errorText: { fontSize: 13, color: '#b4533a' },
  formError: { padding: 12, borderRadius: 12, fontSize: 14, color: '#7a2e1c', backgroundColor: '#fff4f1' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
```

In `src/app/_layout.tsx`, after the `plan` screen:

```tsx
<Stack.Screen name="session-form" options={{ title: 'Save Session' }} />
```

In `src/app/plan.js`, above the Go back button:

```jsx
<Pressable style={styles.button} onPress={() => router.push('/session-form')}>
  <Text style={styles.buttonLabel}>Save as session</Text>
</Pressable>
```

`keyboardShouldPersistTaps="handled"` matters on a phone: without it, the first tap on Save while the keyboard is open only closes the keyboard.

</details>

## Validating the draft

A session is valid when:

| Rule | Message | Shown |
| --- | --- | --- |
| The title isn't blank after trimming | Give the session a title. | under the Title field |
| The plan has at least one step | Add at least one step to your plan before saving. | above the Save button |

The first is a **field error**: it belongs to one input, so it appears next to it. The second is a **form error**: no field can fix it, so it appears near the button.

Write validation as a function, `validateSession({ title, steps })`, that returns one message per problem, and `{}` when the draft is valid. Call it on every render, and don't store its result in state. An `errorMessage` state goes stale: it keeps showing after the user fixes the title, until they press Save again. Errors **derived** from the draft are always current.

An empty form is invalid, but showing errors before the user has typed anything tells them nothing. Keep a `hasTriedToSave` flag, and only show errors once it's `true`. The flag is state, because it records something that happened. The errors aren't, because they're computed from the draft.

Follow the build order: start `hasTriedToSave` as `useState(true)` to check how the errors look, then change it to `false` and set it in `handleSave`.

| Test | Expected |
| --- | --- |
| Open the form with an empty plan, press Save session | both errors |
| Type a title | the title error disappears as you type |
| Type only spaces as the title | the title error comes back |
| Add steps, open the form, enter a title, press Save session | the console logs the trimmed draft |

Commit: `3. Validate the session draft`

<details>
<summary>Solution</summary>

`src/app/session-form.js`:

```js
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStudyPlan } from '../context/StudyPlanContext';

// Returns one message per problem. An empty object means the draft is valid.
function validateSession({ title, steps }) {
  const errors = {};

  if (title.trim() === '') {
    errors.title = 'Give the session a title.';
  }

  if (steps.length === 0) {
    errors.steps = 'Add at least one step to your plan before saving.';
  }

  return errors;
}

export default function SessionFormScreen() {
  const { selectedSteps } = useStudyPlan();
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [hasTriedToSave, setHasTriedToSave] = useState(false);

  // Errors are worked out from the draft on every render, so they're never out of date.
  const errors = validateSession({ title, steps: selectedSteps });
  const isValid = Object.keys(errors).length === 0;

  // Don't show errors before the first save attempt.
  const titleError = hasTriedToSave ? errors.title : undefined;
  const stepsError = hasTriedToSave ? errors.steps : undefined;

  function handleSave() {
    setHasTriedToSave(true);
    if (!isValid) return;

    // TODO: save to the context
    console.log('valid draft', { title: title.trim(), goal: goal.trim() });
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Steps in this session: {selectedSteps.length}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Week 3 lab prep"
          maxLength={40}
          style={[styles.input, titleError && styles.inputError]}
        />
        {titleError && <Text style={styles.errorText}>{titleError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Goal (optional)</Text>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="What should this session get done?"
          multiline
          style={[styles.input, styles.multiline]}
        />
      </View>

      {stepsError && <Text style={styles.formError}>{stepsError}</Text>}

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonLabel}>Save session</Text>
      </Pressable>
    </ScrollView>
  );
}

// Includes the error styles that later steps use.
const styles = StyleSheet.create({
  screen: { flexGrow: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  intro: { fontSize: 15, color: '#5d554d' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#4d3214' },
  input: {
    borderWidth: 1,
    borderColor: '#d2c4b5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fffdfb',
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: '#b4533a' },
  errorText: { fontSize: 13, color: '#b4533a' },
  formError: { padding: 12, borderRadius: 12, fontSize: 14, color: '#7a2e1c', backgroundColor: '#fff4f1' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
```

`titleError` is either a message or `undefined`, so `titleError && ...` is safe. Be careful with `&&` on a value that can be an empty string: `{goal && <Text>...</Text>}` renders `''` when the goal is empty, and React Native crashes with "Text strings must be rendered within a `<Text>` component." Compare explicitly instead: `{goal !== '' && ...}`.

</details>

## Adding the session to the context

Extend the context's contract with `savedSession` and `saveSession`, hard-coded for now: `savedSession` is `null`, and `saveSession` does nothing. A saved session will look like `{ title, goal, steps }`.

Then show it:

- **Plan:** above the count, a card with the title, the goal if there is one, and `Steps saved: 3`. With no session, "No saved session yet."
- **Home:** below the plan count, `Saved session: Week 3 prep`, only when there is one

| Test | Expected |
| --- | --- |
| Open Plan | No saved session yet. |
| Change `savedSession` to `{ title: 'Test session', goal: '', steps: [] }` in the provider and save | Plan shows the card with `Steps saved: 0` and no goal line. Home shows `Saved session: Test session` |

Put `savedSession` back to `null` before you commit.

Commit: `4. Add the saved session to the context with a hard-coded value`

<details>
<summary>Solution</summary>

In `src/context/StudyPlanContext.js`, replace the `value` line:

```js
// TODO: replace these hard-coded values with real state
const savedSession = null;
function saveSession() {}

const value = { selectedSteps, toggleStep, removeStep, savedSession, saveSession };
```

In `src/app/plan.js`, read `savedSession` too:

```js
const { selectedSteps: planSteps, removeStep, savedSession } = useStudyPlan();
```

and add this as the first child of the `ScrollView`:

```jsx
{savedSession ? (
  <View style={styles.card}>
    <Text style={styles.cardLabel}>Saved session</Text>
    <Text style={styles.cardTitle}>{savedSession.title}</Text>
    {savedSession.goal !== '' && <Text style={styles.cardBody}>{savedSession.goal}</Text>}
    <Text style={styles.cardBody}>Steps saved: {savedSession.steps.length}</Text>
  </View>
) : (
  <Text style={styles.empty}>No saved session yet.</Text>
)}
```

In `src/app/index.js`:

```js
const { selectedSteps, savedSession } = useStudyPlan();
```

and below the plan count:

```jsx
{savedSession && <Text style={styles.body}>Saved session: {savedSession.title}</Text>}
```

</details>

## Saving the session

Replace the hard-coded values in the provider with real state. `saveSession` takes `{ title, goal }` and stores them with the current plan's steps. The provider owns the plan, so it attaches the steps; the form only sends what the user typed.

In the form, replace the `console.log` with a call to `saveSession` with the trimmed values, then leave the form with `router.back()`.

Why `router.back()` and not `router.push('/plan')`? Pushing adds a second Plan screen on top of the form. Press back from that Plan, and you land on the form, still filled in. The form opened from Plan, so going back returns to the same Plan screen, which already shows the new session.

| Do this | Expected |
| --- | --- |
| Add three steps, open the form, type `  Week 3 prep  ` and a goal, press Save session | back on Plan: a card with `Week 3 prep`, the goal, and `Steps saved: 3` |
| Remove a step on Plan | the plan shows 2. The card still shows 3 |
| Press back from Plan | Study Steps, not the form |
| Go back to Home | `Saved session: Week 3 prep` |
| Open the form again | the fields are empty |

**The card still says 3, and that's correct.** The session is a record of the plan when it was saved, so it shouldn't follow later changes. In lesson 15, a copy that didn't update was a bug, because both copies were meant to be the same list. This copy is meant to stay as it was. It also costs nothing: `steps: selectedSteps` keeps a reference to the current array, and every plan update creates a new array instead of changing the old one, so the array the session points to never changes.

The form opens empty again because it unmounted when you left it. Each visit starts a new draft.

Commit: `5. Save the session and leave the form`

<details>
<summary>Solution</summary>

`src/context/StudyPlanContext.js`:

```js
import { createContext, useContext, useState } from 'react';

const StudyPlanContext = createContext(null);

export function StudyPlanProvider({ children }) {
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [savedSession, setSavedSession] = useState(null);

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

  function saveSession({ title, goal }) {
    // The session keeps the plan as it was when it was saved.
    setSavedSession({ title, goal, steps: selectedSteps });
  }

  const value = { selectedSteps, toggleStep, removeStep, savedSession, saveSession };

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

In `src/app/session-form.js`, import `useRouter` from `expo-router`, and:

```js
const router = useRouter();
const { selectedSteps, saveSession } = useStudyPlan();
```

```js
function handleSave() {
  setHasTriedToSave(true);
  if (!isValid) return;

  saveSession({ title: title.trim(), goal: goal.trim() });
  router.back();
}
```

</details>

## Refactoring into a field component

Each field repeats the same markup: a label, an input, an error message, and the error border. Move that into `src/components/FormField.js`, a component that takes `label`, `error` and `style`, and passes every other prop straight to its `TextInput` with `...inputProps`. Move the field styles with it.

The screen still owns the state and the validation. `FormField` only handles layout and showing the error.

| Test | Expected |
| --- | --- |
| Run every test from the last two sections | the same results. A refactor changes the code, not the behaviour |

Commit: `6. Extract a FormField component`

<details>
<summary>Solution</summary>

`src/components/FormField.js`:

```js
import { StyleSheet, Text, TextInput, View } from 'react-native';

// A labelled text input with its error message underneath.
// Every prop except label, error and style goes straight to the TextInput.
export function FormField({ label, error, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...inputProps} style={[styles.input, style, error && styles.inputError]} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#4d3214' },
  input: {
    borderWidth: 1,
    borderColor: '#d2c4b5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fffdfb',
  },
  inputError: { borderColor: '#b4533a' },
  errorText: { fontSize: 13, color: '#b4533a' },
});
```

`src/app/session-form.js`:

```js
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useStudyPlan } from '../context/StudyPlanContext';
import { FormField } from '../components/FormField';

// Returns one message per problem. An empty object means the draft is valid.
function validateSession({ title, steps }) {
  const errors = {};

  if (title.trim() === '') {
    errors.title = 'Give the session a title.';
  }

  if (steps.length === 0) {
    errors.steps = 'Add at least one step to your plan before saving.';
  }

  return errors;
}

export default function SessionFormScreen() {
  const router = useRouter();
  const { selectedSteps, saveSession } = useStudyPlan();
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [hasTriedToSave, setHasTriedToSave] = useState(false);

  // Errors are worked out from the draft on every render, so they're never out of date.
  const errors = validateSession({ title, steps: selectedSteps });
  const isValid = Object.keys(errors).length === 0;

  // Don't show errors before the first save attempt.
  const titleError = hasTriedToSave ? errors.title : undefined;
  const stepsError = hasTriedToSave ? errors.steps : undefined;

  function handleSave() {
    setHasTriedToSave(true);
    if (!isValid) return;

    saveSession({ title: title.trim(), goal: goal.trim() });
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Steps in this session: {selectedSteps.length}</Text>

      <FormField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Week 3 lab prep"
        maxLength={40}
        error={titleError}
      />

      <FormField
        label="Goal (optional)"
        value={goal}
        onChangeText={setGoal}
        placeholder="What should this session get done?"
        multiline
        style={styles.multiline}
      />

      {stepsError && <Text style={styles.formError}>{stepsError}</Text>}

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonLabel}>Save session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  intro: { fontSize: 15, color: '#5d554d' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  formError: { padding: 12, borderRadius: 12, fontSize: 14, color: '#7a2e1c', backgroundColor: '#fff4f1' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
```

</details>

## How production apps do this

**Form libraries.** Large forms get repetitive: state per field, touched flags, errors, submit handling. Most production apps use a library, and [React Hook Form](https://react-hook-form.com/) is a common choice in React Native. React Native has no HTML form elements, so each input is connected through `Controller`, and `handleSubmit(onValid)` validates before calling `onValid`. Here's a cut-down version of the form (title only), tested against the lesson app:

```js
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStudyPlan } from '../context/StudyPlanContext';
import { FormField } from '../components/FormField';

const sessionSchema = z.object({
  title: z.string().trim().min(1, 'Give the session a title.'),
  goal: z.string().trim(),
});

export default function SessionFormScreen() {
  const router = useRouter();
  const { saveSession } = useStudyPlan();
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: { title: '', goal: '' },
  });

  function onValid(values) {
    saveSession(values);
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormField
            label="Title"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Week 3 lab prep"
            error={errors.title?.message}
          />
        )}
      />
      <Pressable style={styles.button} onPress={handleSubmit(onValid)}>
        <Text style={styles.buttonLabel}>Save session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, gap: 16, padding: 24, backgroundColor: '#f5efe7' },
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8c5d35' },
  buttonLabel: { fontSize: 14, fontWeight: '700', color: '#fffdfb' },
});
```

**Schema validation.** [Zod](https://zod.dev/) describes valid data once, as a schema. `safeParse` returns `{ success: true, data }` or `{ success: false, error }`, and `data` has already been trimmed. The same schema can run on a Node server, so the app and the API enforce the same rules. A server still has to validate, because anyone can send a request without using your app.

**Forms on a phone.** The browser hides problems a phone shows:

- With the keyboard open, a `ScrollView` uses the first tap to close the keyboard, and buttons don't get it. `keyboardShouldPersistTaps="handled"` fixes that
- The keyboard can cover the inputs. `KeyboardAvoidingView` moves the content up; the [Expo keyboard handling guide](https://docs.expo.dev/guides/keyboard-handling/) says to set its `behavior` on both platforms
- For long forms, `react-native-keyboard-controller` adds a `KeyboardAwareScrollView` that scrolls to the focused input
- `keyboardType`, `autoCapitalize`, `autoComplete` and `returnKeyType` choose the keyboard and what its Enter key does

## Challenges

Pick one after class. Each one names a term to look up. Read until you understand it, then implement a solution on top of your finished form, and commit it on its own.

### Edit the saved session

Every time the form opens, it starts empty, even when a session is already saved. Look up **initializing state from props** in the React docs.

- **Trigger it:** save a session, then press Save as session again. Both fields are empty
- **Your solution:** when a session is saved, the form opens with its title and goal filled in, and the button says Update session. On Plan, the button says Edit session. Saving replaces the session, with the current plan's steps
- **Hint:** `useState` only uses its starting value on the first render. In lesson 15, that made the Plan screen's copy go stale. For a draft, it's exactly right: the draft starts as a copy of the saved session, then changes on its own until the user saves

<details>
<summary>Solution</summary>

In `src/app/session-form.js`:

```js
const { selectedSteps, savedSession, saveSession } = useStudyPlan();

// The draft starts as a copy of the saved session. useState only uses
// its starting value on the first render, which is what a draft needs.
const [title, setTitle] = useState(savedSession?.title ?? '');
const [goal, setGoal] = useState(savedSession?.goal ?? '');
```

```jsx
<Text style={styles.buttonLabel}>{savedSession ? 'Update session' : 'Save session'}</Text>
```

In `src/app/plan.js`:

```jsx
<Text style={styles.buttonLabel}>{savedSession ? 'Edit session' : 'Save as session'}</Text>
```

`saveSession` already replaces the whole session, so the provider doesn't change.

</details>

### Move between fields

On a phone, the user expects the Enter key on the title's keyboard to move to the goal. Look up **focusing a TextInput with a ref**.

- **Trigger it:** click into Title, type, and press Enter. The cursor doesn't move to Goal
- **Your solution:** pressing Enter in Title puts the cursor in Goal. On a phone, the title's Enter key says Next
- **Hint:** a ref gives you the `TextInput` itself, which has a `focus()` method. In React 19, `ref` is a normal prop, so `FormField` already passes it to its `TextInput` through `...inputProps`. `submitBehavior="submit"` keeps the keyboard open while focus moves

<details>
<summary>Solution</summary>

In `src/app/session-form.js`, import `useRef` from `react`, and:

```js
const goalRef = useRef(null);
```

```jsx
<FormField
  label="Title"
  value={title}
  onChangeText={setTitle}
  placeholder="Week 3 lab prep"
  maxLength={40}
  returnKeyType="next"
  submitBehavior="submit"
  onSubmitEditing={() => goalRef.current?.focus()}
  error={titleError}
/>

<FormField
  label="Goal (optional)"
  ref={goalRef}
  value={goal}
  onChangeText={setGoal}
  placeholder="What should this session get done?"
  multiline
  style={styles.multiline}
/>
```

Before React 19, `FormField` would have needed `forwardRef` to pass a ref through.

</details>

### Validate when a field loses focus

Errors only appear after Save. A user who skips the title finds out at the end. Look up **touched fields** in form validation.

- **Trigger it:** click into Title, then click into Goal without typing. No error appears
- **Your solution:** when the user leaves the title empty and moves on, its error appears straight away. It still disappears as soon as they type a title
- **Hint:** a field is "touched" once it has lost focus, and `onBlur` runs when that happens. Track touched fields in one object, and show a field's error once it's touched or the user has tried to save

<details>
<summary>Solution</summary>

In `src/app/session-form.js`:

```js
const [touched, setTouched] = useState({});

// Show a field's error once the user has left that field, or tried to save.
const titleError = hasTriedToSave || touched.title ? errors.title : undefined;
```

```jsx
<FormField
  label="Title"
  value={title}
  onChangeText={setTitle}
  placeholder="Week 3 lab prep"
  maxLength={40}
  onBlur={() => setTouched((current) => ({ ...current, title: true }))}
  error={titleError}
/>
```

The steps error stays tied to `hasTriedToSave`: no field can fix it, so there's nothing to leave.

</details>

### Validate with a schema

`validateSession` is hand-written. A server that accepts sessions would need the same rules, written again. Look up **Zod safeParse**.

- **Trigger it:** read `validateSession`, and imagine adding five more rules to it
- **Your solution:** replace the body of `validateSession` with a Zod schema. It must return exactly what it returns now: one message per field, and `{}` when the draft is valid. Nothing else in the screen changes
- **Hint:** `safeParse` never throws. When it fails, `result.error.issues` is a list, and each issue has a `path` (like `['title']`) and a `message`. Keep the first message for each field

Install it with `npm install zod`. It's plain JavaScript, so it needs no rebuild.

<details>
<summary>Solution</summary>

In `src/app/session-form.js`:

```js
import { z } from 'zod';

const sessionSchema = z.object({
  title: z.string().trim().min(1, 'Give the session a title.'),
  steps: z.array(z.unknown()).min(1, 'Add at least one step to your plan before saving.'),
});

// Same contract as before: one message per field, and an empty object when the draft is valid.
function validateSession(draft) {
  const result = sessionSchema.safeParse(draft);
  if (result.success) return {};

  const errors = {};
  for (const issue of result.error.issues) {
    errors[issue.path[0]] ??= issue.message;
  }
  return errors;
}
```

`??=` assigns only when the left side is `null` or `undefined`, so each field keeps its first message.

</details>

## If you're stuck

| Problem | Try |
| --- | --- |
| Typing in an input does nothing | `onChangeText` is missing, or calls the wrong setter |
| Spaces between words disappear as you type | You're trimming in `onChangeText`. Trim when you save |
| An error stays after you fix the field | You stored the error in state. Derive it from the draft on every render |
| Errors show as soon as the form opens | `hasTriedToSave` starts as `true` |
| `Text strings must be rendered within a <Text> component` | Something like `{goal && <Text>...}` rendered an empty string. Compare with `!== ''` |
| Back from Plan opens the filled-in form again | The form used `router.push('/plan')`. Use `router.back()` |
| `useStudyPlan` doesn't have `savedSession` | Add it to the provider's `value` object, not only as a variable |
| The plan resets in the browser | You used the browser's Back button. Use the app's back arrow |
| Still stuck | Compare with the class repository's commit for that step |

## Exercise

Do one challenge, then submit a write-up of 1 to 2 pages (Markdown or PDF):

1. **The problem:** in your own words, what the challenge's term means and what problem it solves. Name one source you read
2. **Your solution:** paste the code you changed, and explain how it works
3. **Proof:** the steps you took to test it, and one screenshot of the result with a caption
4. **Draft and saved state:** which values in your form are draft state and which are saved state, where each one lives, and what moves from one to the other when the user presses Save
5. **The snapshot:** the session card and the plan can show different step counts. Explain why that's correct here, when the same kind of difference was a bug in lesson 15
