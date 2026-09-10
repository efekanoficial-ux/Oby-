importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB3_MGaYC9uZOfHCBEvaR0VE02KipgpkqM",
  projectId: "obyotrade",
  messagingSenderId: "426466678460",
  appId: "1:426466678460:web:b03482022530e260b162b9",
});

const messaging = firebase.messaging();
