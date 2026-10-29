# Lesson 15 Starter App

The starting point for lesson 15. The Study Steps screen builds a plan, and the Plan screen gets a copy of it through route params. The two copies drift apart. This lesson fixes that with Context.

## Run it

Start the backend first, in its own terminal:

```bash
cd ../backend
node server.js
```

Then, in a second terminal:

```bash
npm install
npx expo install expo-dev-client   # first time only
npm run android:dev                # first time only: builds and installs the development build (Mac + iOS: npm run ios:dev)
npm start                          # press w to open it in the browser instead
```
