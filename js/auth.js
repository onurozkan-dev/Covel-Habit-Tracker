// js/auth.js
// Firebase config placeholder (replace with your real config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (window.firebase === undefined) {
  console.error('Firebase SDK not loaded!');
} else {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Show/hide modal
  function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
  }
  function hideAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
  }
  window.showAuthModal = showAuthModal;
  window.hideAuthModal = hideAuthModal;

  // Sign up
  document.getElementById('signup-form').onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => hideAuthModal())
      .catch(err => alert(err.message));
  };
  // Login
  document.getElementById('login-form').onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => hideAuthModal())
      .catch(err => alert(err.message));
  };
  // Logout
  document.getElementById('logout-btn').onclick = function() {
    auth.signOut();
  };
  // Auth state
  auth.onAuthStateChanged(user => {
    const signupBtn = document.querySelector('.btn-signup');
    const userInfo = document.getElementById('user-info');
    if (user) {
      if (signupBtn) signupBtn.style.display = 'none';
      if (userInfo) {
        userInfo.textContent = user.email;
        userInfo.style.display = 'inline-block';
      }
      document.getElementById('logout-btn').style.display = 'inline-block';
    } else {
      if (signupBtn) signupBtn.style.display = 'inline-block';
      if (userInfo) userInfo.style.display = 'none';
      document.getElementById('logout-btn').style.display = 'none';
    }
  });
} 