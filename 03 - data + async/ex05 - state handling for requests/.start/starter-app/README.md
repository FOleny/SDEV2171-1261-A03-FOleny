# Lesson 13 Starter App

The starting point for lesson 13. It fetches study steps from the local backend and has a search box, but it shows "No study steps yet." while loading, after an error, and sometimes shows results for an old search. Today's commits fix that.

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
