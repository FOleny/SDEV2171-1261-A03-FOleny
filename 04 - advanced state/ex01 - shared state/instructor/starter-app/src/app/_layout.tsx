import { Stack } from 'expo-router';


export default function Layout() {
  // we'd have an easy life if we could write simple shared state here,
  // the 'lowest common denominator' of where plan & details screens live

  // UNNNNNfortunately, a layout cannot pass props to its screens.
  // (there's no e.g. <Details /> element anywhere)
  // the router renders the screen from the file(name), so we don't really get
  // any components called in JSX to pass props through.

  // solution (and something good to learn anyway) is React context, a.k.a. openly shareable state
  return (
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="details" options={{ title: 'Study Steps' }} />
        <Stack.Screen name="plan" options={{ title: 'Plan' }} />
      </Stack>
  );
}
