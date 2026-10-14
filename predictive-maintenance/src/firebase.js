import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCc8lc-lDI_RQyyOiGRDsR3HZSx1hu9n34",
  authDomain: "machinehealthmonitoring-c3ac9.firebaseapp.com",
  databaseURL: "https://machinehealthmonitoring-c3ac9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "machinehealthmonitoring-c3ac9",
  storageBucket: "machinehealthmonitoring-c3ac9.firebasestorage.app",
  messagingSenderId: "161460368032",
  appId: "1:161460368032:web:03aee23db55ce36e6f8fc5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;












