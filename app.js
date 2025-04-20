// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


// === FIREBASE CONFIGURATION ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// === Redirect Unauthenticated Users to Login ===
if (window.location.pathname.includes("index.html")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login-extended.html";
    }
  });
}

// === LOGIN EXTENDED ===
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'index.html';
    } catch (error) {
      // If login fails, try signup
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), { email });
        window.location.href = 'index.html';
      } catch (err) {
        alert('Login/signup failed');
      }
    }
  });
}

// === INDEX PAGE ===
const matchBtn = document.getElementById('find-match-btn');
if (matchBtn) {
  matchBtn.addEventListener('click', async () => {
    const food = document.getElementById('food-name').value;
    const slices = document.getElementById('slice-count').value;
    const preference = document.getElementById('match-pref').value;
    const user = auth.currentUser;

    if (!user) {
      window.location.href = "login-extended.html";
      return;
    }
  await setDoc(doc(db, 'match_requests', user.uid), {
    userId: user.uid,
    email: user.email,
    food,
    slices,
    preference,
    timestamp: Date.now(),
    deliveryOption: "waiting"
  });

    await fetch("https://your-backend-url/send-email", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'Sharemaate@gmail.com', matchInfo: { slices, preference } })
    });

    window.location.href = 'waiting.html';
  });
}

//==== HANDLE MATCH BUTTON====
const matchBtn = document.getElementById("find-match-btn");

if (matchBtn) {
  matchBtn.addEventListener("click", () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Please log in first.");
        window.location.href = "login-extended.html";
        return;
      }

      const food = document.getElementById("foodInput")?.value;
      const slices = document.getElementById("sliceInput")?.value;
      const preference = document.getElementById("matchPref")?.value;

      if (!food || !slices) {
        alert("Fill all fields!");
        return;
      }

      try {
        await setDoc(doc(db, "match_requests", user.uid), {
          userId: user.uid,
          email: user.email,
          food,
          slices,
          preference,
          timestamp: Date.now(),
          deliveryOption: "waiting",
        });

        console.log("✅ Match saved. Redirecting...");
        window.location.href = "waiting.html";
      } catch (err) {
        console.error("❌ Failed to save match:", err);
        alert("Something went wrong!");
      }
    });
  });
}

// === WAITING PAGE ===
const waitCancel = document.getElementById('cancel-match');
if (waitCancel) {
  waitCancel.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, 'match_requests', user.uid), { cancelled: true }, { merge: true });
    }
    window.location.href = 'index.html';
  });
}

// === RESPOND PAGE (User B) ===
const respondBtn = document.getElementById('respond-btn');
if (respondBtn) {
  respondBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const method = document.querySelector('input[name="delivery-method"]:checked')?.value;
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    const responder = auth.currentUser;
    if (!responder || !matchId || !method) return alert("Missing information");

    await setDoc(doc(db, 'responses', matchId), {
      responderId: responder.uid,
      deliveryMethod: method,
      status: 'accepted',
    });

    window.location.href = `payment-respond.html?matchId=${matchId}`;
  });
}


// === PAYMENT RESPOND ===
const payBtn = document.getElementById('confirm-payment');
if (payBtn) {
  payBtn.addEventListener('click', async () => {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    const user = auth.currentUser;
    if (!user || !matchId) return;

    const resDoc = await getDocs(query(collection(db, 'responses')));
    const response = resDoc.docs.find(d => d.id === matchId)?.data();
    const slices = parseInt(response?.slices || 0);
    const totalPrice = parseFloat(response?.totalPrice || 0);

    const userPrice = totalPrice * (slices / 8);

    await setDoc(doc(db, 'wallets', user.uid), {
      balance: 0,
      paidTo: matchId,
      amount: userPrice
    });

    await setDoc(doc(db, 'orders', matchId), {
      userAConfirmed: true,
      userBPaid: true
    }, { merge: true });

    window.location.href = `final-confirmation.html?matchId=${matchId}`;
  });
}