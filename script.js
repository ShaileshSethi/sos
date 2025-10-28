document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");
  const statusIndicator = document.getElementById("status-indicator");
  const safezoneList = document.getElementById("safezone-list");
  const refreshBtn = document.getElementById("refresh-safezones");
  
  // --- SOS Modal Elements ---
  const sosButton = document.getElementById("home-sos-button");
  const sosModal = document.getElementById("sos-modal");
  const closeSosModalBtn = document.getElementById("close-sos-modal-btn");
  const sosMessageContent = document.getElementById("sos-message-content");
  const sosActions = document.getElementById("sos-actions");
  const sosLocationDisplay = document.getElementById("sos-location-display");
  
  const aiGuideBtn = document.getElementById("ai-guide-btn");
  const homeAiGuideBtn = document.getElementById("home-ai-guide-btn");

  const findLocationBtn = document.getElementById("find-location-btn");
  const locationDisplay = document.getElementById("location-display");
  const copyLocationBtn = document.getElementById("copy-location-btn");
  let userCoordinates = "";

  const sirenBtn = document.getElementById("siren-btn");
  const sirenOverlay = document.getElementById("siren-flash-overlay");
  let audioCtx, oscillator, gainNode, isSirenOn = false;
  let sirenInterval;

  // --- Online/Offline Status ---
  function updateStatus() {
    if (navigator.onLine) {
      statusIndicator.textContent = "🟢 Online";
      statusIndicator.style.background = "#16a34a";
    } else {
      statusIndicator.textContent = "🔴 Offline";
      statusIndicator.style.background = "#dc2626";
    }
  }
  updateStatus();
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);

  // --- Navigation ---
  function showView(viewId) {
    navButtons.forEach(b => b.classList.remove("active"));
    views.forEach(v => v.classList.remove("active"));
    
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
    if (activeBtn) activeBtn.classList.add("active");
    
    const activeView = document.getElementById(viewId);
    if (activeView) activeView.classList.add("active");
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  // --- Dashboard Card Listeners ---
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.id === "home-ai-guide-btn") {
        speakAiGuide();
      } else if (card.id === "siren-btn") {
        toggleSiren();
      } else {
        showView(card.dataset.view);
      }
    });
  });

  // --- Safe Zone Data ---
  const safeZones = [
    { name: "Guru Nanak Dev Hospital", type: "Hospital", distance: "1.2 km" },
    { name: "Fortis Escorts Hospital", type: "Multi-speciality Hospital", distance: "3.4 km" },
    { name: "Amandeep Hospital", type: "Emergency Care", distance: "2.2 km" },
    { name: "Police Station Civil Lines", type: "Police Help", distance: "1.9 km" },
    { name: "GNDU Security Post", type: "Campus Security", distance: "Within GNDU" },
    { name: "Amritsar Fire Station", type: "Fire Department", distance: "2.8 km" },
    { name: "Golden Temple Area Shelter", type: "Public Safe Zone", distance: "4.0 km" }
  ];

  function loadSafeZones() {
    safezoneList.innerHTML = "";
    safeZones.forEach(zone => {
      const div = document.createElement("div");
      div.classList.add("zone-card");
      div.innerHTML = `
        <h3>${zone.name}</h3>
        <p><strong>Type:</strong> ${zone.type}</p>
        <p><strong>Distance:</strong> ${zone.distance}</p>
        <button class="navigate-btn">🧭 Navigate</button>
      `;
      div.querySelector(".navigate-btn").addEventListener("click", () => {
        const query = encodeURIComponent(zone.name + " Amritsar");
        // *** BUG FIX: Correct Google Maps URL ***
        window.open(`https://maps.google.com/?q=${query}`);
      });
      safezoneList.appendChild(div);
    });
  }
  loadSafeZones();
  
  refreshBtn.addEventListener("click", () => {
    refreshBtn.textContent = "Refreshing...";
    setTimeout(() => {
      loadSafeZones();
      refreshBtn.textContent = "🔄 Refresh Zones";
    }, 1000);
  });

  // --- NEW SOS BUTTON LOGIC ---
  sosButton.addEventListener("click", () => {
    sosButton.disabled = true;
    sosButton.textContent = "GETTING LOCATION...";
    sosButton.classList.remove("sos-pulse");

    // Show the modal in its "loading" state
    sosMessageContent.classList.remove("hidden");
    sosActions.classList.add("hidden");
    sosModal.classList.remove("hidden");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showSosModalWithLocation, showSosModalWithError);
    } else {
      // Geolocation not supported
      showSosModalWithError();
    }
  });

  function showSosModalWithLocation(position) {
    const lat = position.coords.latitude.toFixed(5);
    const lon = position.coords.longitude.toFixed(5);
    // Set the location text
    sosLocationDisplay.innerHTML = `<strong>My Location:</strong><br>Lat: ${lat}, Lon: ${lon}`;
    
    // Show the action buttons and hide the loading message
    sosMessageContent.classList.add("hidden");
    sosActions.classList.remove("hidden");
    
    // Play an alert sound
    const msg = new SpeechSynthesisUtterance("Location found. Please call for help now.");
    speechSynthesis.speak(msg);
  }

  function showSosModalWithError(error) {
    // Even if location fails, show the call buttons
    let message = "Location not found. Please describe your surroundings to the operator.";
    if (error && error.code === error.PERMISSION_DENIED) {
      message = "Location access denied. Please describe your surroundings to the operator.";
    }
    sosLocationDisplay.innerHTML = `<p>${message}</p>`;

    // Show the action buttons and hide the loading message
    sosMessageContent.classList.add("hidden");
    sosActions.classList.remove("hidden");
  }

  closeSosModalBtn.addEventListener("click", () => {
    sosModal.classList.add("hidden");
    // Re-enable the SOS button
    sosButton.disabled = false;
    sosButton.textContent = "SEND SOS ALERT";
    sosButton.classList.add("sos-pulse");
  });


  // --- AI Voice Guide (Bold & Fast) ---
  function speakAiGuide() {
    speechSynthesis.cancel(); 
    const guide = new SpeechSynthesisUtterance(
      "Hello. I am your SafeZones AI Assistant. In case of danger, stay calm. " +
      "If you are on campus, the nearest help is GNDU Security. " +
      "For police, dial 100. For fire, call 101. " +
      "Please move to an open safe area and wait for help."
    );
    guide.lang = 'en-IN';
    guide.rate = 1.2;
    guide.pitch = 0.9;
    guide.volume = 1.0;
    speechSynthesis.speak(guide);
  }
  aiGuideBtn.addEventListener("click", speakAiGuide);

  // --- Geolocation Logic (for Home tab) ---
  findLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      locationDisplay.innerHTML = "<p>Finding your location...</p>";
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      locationDisplay.innerHTML = "<p>Geolocation is not supported by this browser.</p>";
    }
  });

  function showPosition(position) {
    const lat = position.coords.latitude.toFixed(5);
    const lon = position.coords.longitude.toFixed(5);
    userCoordinates = `Lat: ${lat}, Lon: ${lon}`;
    locationDisplay.innerHTML = `<strong>Latitude:</strong> ${lat}<br><strong>Longitude:</strong> ${lon}`;
    copyLocationBtn.classList.remove("hidden");
  }

  // Shared error function for Geolocation
  function showError(error) {
    let message = "Could not get location. ";
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message += "You denied the request for Geolocation.";
        break;
      case error.POSITION_UNAVAILABLE:
        message += "Location information is unavailable.";
        break;
      case error.TIMEOUT:
        message += "The request to get user location timed out.";
        break;
    }
    // Check if this is the Home tab display or SOS modal
    if(locationDisplay.innerHTML.includes("Finding")) {
      locationDisplay.innerHTML = `<p>${message}</p>`;
    }
  }

  copyLocationBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(userCoordinates).then(() => {
      copyLocationBtn.textContent = "Copied! ✅";
      setTimeout(() => { copyLocationBtn.textContent = "Copy Coordinates"; }, 2000);
    });
  });

  // --- Siren Logic ---
  function toggleSiren() {
    if (isSirenOn) {
      if (oscillator) oscillator.stop();
      if (sirenInterval) clearInterval(sirenInterval);
      sirenOverlay.classList.add("hidden");
      isSirenOn = false;
      sirenBtn.querySelector("h3").textContent = "Start Siren";
    } else {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      gainNode.gain.value = 0.5;
      oscillator.start();
      
      let freqToggle = true;
      sirenInterval = setInterval(() => {
        oscillator.frequency.setValueAtTime(freqToggle ? 900 : 700, audioCtx.currentTime);
        freqToggle = !freqToggle;
      }, 500);

      sirenOverlay.classList.remove("hidden");
      isSirenOn = true;
      sirenBtn.querySelector("h3").textContent = "Stop Siren";
    }
  }
});