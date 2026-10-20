# Lesson 13 Reference App

The finished lesson 13 screen: loading, error, and retry states, plus a search box that cancels out-of-date requests.

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
