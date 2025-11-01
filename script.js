document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view"); // Gets ALL sections with the 'view' class
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
  const header = document.querySelector("header");
  let audioCtx, oscillator, gainNode, isSirenOn = false;
  let sirenInterval;

  // --- Cursor Glow ---
  const glow = document.getElementById("cursor-glow");
  window.addEventListener("mousemove", (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });

  // --- Online/Offline Status ---
  function updateStatus() {
    if (navigator.onLine) {
      statusIndicator.textContent = "🟢 Online";
      statusIndicator.style.background = "rgba(22, 163, 74, 0.8)";
    } else {
      statusIndicator.textContent = "🔴 Offline";
      statusIndicator.style.background = "rgba(220, 38, 38, 0.8)";
    }
  }
  updateStatus();
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);

  // --- Navigation (This is the key function) ---
  function showView(viewId) {
    // Remove active class from ALL buttons and ALL views first
    navButtons.forEach(b => b.classList.remove("active"));
    views.forEach(v => v.classList.remove("active")); // Hides everything

    // Add active class ONLY to the target button
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    // Add active class ONLY to the target view
    const activeView = document.getElementById(viewId);
    if (activeView) activeView.classList.add("active"); // Shows the correct one

    // Trigger staggered animation specifically for the home view
    if (viewId === 'home') {
      const cards = document.querySelectorAll('#home .action-card'); // Target only home cards
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.classList.remove('slide-in-item');
        setTimeout(() => {
          card.classList.add('slide-in-item');
          card.style.opacity = '1';
        }, index * 100);
      });
    }
     // Trigger animation for other views if needed (optional)
     else if (activeView) {
        // Example: animate first aid cards
        if (viewId === 'firstaid') {
             const aidCards = document.querySelectorAll('#firstaid .aid-card');
             aidCards.forEach((card, index) => {
                card.style.opacity = '0'; // Reset for animation
                card.classList.remove('slide-in-item');
                 setTimeout(() => {
                    card.classList.add('slide-in-item');
                    card.style.opacity = '1';
                }, index * 100);
            });
        }
        // Add similar blocks for 'safezones', 'emergency', etc. if desired
    }
  }


  // Add click listeners to navigation buttons
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  // --- Dashboard Card Listeners ---
  const actionCards = document.querySelectorAll('#home .action-card'); // Target only home cards
  actionCards.forEach(card => {
    card.addEventListener('click', () => {
      if (card.id === "home-ai-guide-btn") {
        speakAiGuide();
      } else if (card.id === "siren-btn") {
        toggleSiren();
      } else {
        // When a dashboard card (not AI or Siren) is clicked, navigate to that view
        showView(card.dataset.view);
      }
    });

    // --- 3D Parallax Tilt ---
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(1000px) rotateY(${x / 20}deg) rotateX(${-y / 20}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
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
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`);
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

  // --- SOS BUTTON LOGIC ---
  sosButton.addEventListener("click", () => {
    sosButton.disabled = true;
    sosButton.textContent = "GETTING LOCATION...";
    sosButton.classList.remove("sos-pulse");

    sosMessageContent.classList.remove("hidden");
    sosActions.classList.add("hidden");
    sosModal.classList.remove("hidden");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showSosModalWithLocation, showSosModalWithError);
    } else {
      showSosModalWithError();
    }
  });

  async function showSosModalWithLocation(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const latFixed = lat.toFixed(5);
    const lonFixed = lon.toFixed(5);

    let locationString = `<strong>My Location:</strong><br>Lat: ${latFixed}, Lon: ${lonFixed}`;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();

      if (data && data.display_name) {
        locationString = `
          <strong>Address:</strong> ${data.display_name}<br>
          <strong>Coords:</strong> ${latFixed}, ${lonFixed}
        `;
      }
    } catch (error) {
      console.error("SOS reverse geocoding failed:", error);
    }

    sosLocationDisplay.innerHTML = locationString;
    sosMessageContent.classList.add("hidden");
    sosActions.classList.remove("hidden");

    const msg = new SpeechSynthesisUtterance("Location found. Please call for help now.");
    msg.lang = 'en-IN';
    speechSynthesis.speak(msg);
  }

  function showSosModalWithError(error) {
    let message = "Location not found. Please describe your surroundings to the operator.";
    if (error && error.code === error.PERMISSION_DENIED) {
      message = "Location access denied. Please describe your surroundings to the operator.";
    }
    sosLocationDisplay.innerHTML = `<p>${message}</p>`;

    sosMessageContent.classList.add("hidden");
    sosActions.classList.remove("hidden");
  }

  closeSosModalBtn.addEventListener("click", () => {
    sosModal.classList.add("hidden");
    sosButton.disabled = false;
    sosButton.textContent = "SEND SOS ALERT";
    sosButton.classList.add("sos-pulse");
  });


  // --- AI Voice Guide (English) ---
  function setVoiceParams(utterance) {
    utterance.lang = 'en-IN';
    utterance.rate = 1.2;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;
  }

  function speakAiGuide() {
    speechSynthesis.cancel();
    const part1 = new SpeechSynthesisUtterance(
      "Stay calm and listen. If you are in immediate danger, move away. " +
      "Call 100 for Police or 108 for Ambulance. " +
      "I am now finding your nearest safe zone."
    );
    setVoiceParams(part1);

    part1.onend = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const nearestZone = safeZones[0].name;
            const part2 = new SpeechSynthesisUtterance(
              "Location found. The primary registered safe zone is " + nearestZone + ". If safe, move there now."
            );
            setVoiceParams(part2);
            speechSynthesis.speak(part2);
          },
          (error) => {
            const part2 = new SpeechSynthesisUtterance(
              "Could not get your location. Move to a known safe area, like a hospital or police station."
            );
            setVoiceParams(part2);
            speechSynthesis.speak(part2);
          },
          { timeout: 5000 }
        );
      } else {
        const part2 = new SpeechSynthesisUtterance(
          "Geolocation is not supported. Please move to a known safe area."
        );
        setVoiceParams(part2);
        speechSynthesis.speak(part2);
      }
    };
    speechSynthesis.speak(part1);
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

  async function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const latFixed = lat.toFixed(5);
    const lonFixed = lon.toFixed(5);

    locationDisplay.innerHTML = "<p>Location found. Fetching address...</p>";

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();

      if (data && data.display_name) {
        const address = data.display_name;
        userCoordinates = `${address}\nCoords: ${latFixed}, ${lonFixed}`;
        locationDisplay.innerHTML = `
          <strong>Address:</strong> ${address}<br>
          <strong>Coords:</strong> ${latFixed}, ${lonFixed}
        `;
      } else {
        throw new Error("No address found");
      }
    } catch (error) {
      console.error("Home reverse geocoding failed:", error);
      userCoordinates = `Lat: ${latFixed}, Lon: ${lonFixed}`;
      locationDisplay.innerHTML = `
        <strong>Address:</strong> Not found<br>
        <strong>Coords:</strong> ${latFixed}, ${lonFixed}
      `;
    }

    copyLocationBtn.classList.remove("hidden");
  }

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
    if(locationDisplay.innerHTML.includes("Finding")) {
      locationDisplay.innerHTML = `<p>${message}</p>`;
    }
  }

  copyLocationBtn.addEventListener("click", () => {
    const ta = document.createElement("textarea");
    ta.value = userCoordinates;
    ta.style.position = 'fixed'; ta.style.left = '-999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      copyLocationBtn.textContent = "Copied! ✅";
    } catch (err) {
      console.error('Clipboard copy failed', err);
      copyLocationBtn.textContent = "Copy Failed";
    }
    document.body.removeChild(ta);
    setTimeout(() => { copyLocationBtn.textContent = "Copy Coordinates"; }, 2000);
  });

  // --- Siren Logic ---
  function toggleSiren() {
    if (isSirenOn) {
      if (oscillator) oscillator.stop();
      if (sirenInterval) clearInterval(sirenInterval);
      sirenOverlay.classList.add("hidden");
      isSirenOn = false;
      sirenBtn.querySelector("h3").textContent = "Start Siren";
      sirenBtn.classList.remove("shaking");
      header.classList.remove("shaking");
    } else {
      if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            alert("Siren feature requires a modern browser supporting the Web Audio API.");
            return;
        }
      }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      gainNode.gain.value = 0.5;
       try {
            oscillator.start();
        } catch (e) {
            console.error("Error starting oscillator:", e);
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => oscillator.start());
            }
             return;
        }


      let freqToggle = true;
      sirenInterval = setInterval(() => {
         if (audioCtx.state === 'running') {
            oscillator.frequency.setValueAtTime(freqToggle ? 900 : 700, audioCtx.currentTime);
            freqToggle = !freqToggle;
         }
      }, 500);

      sirenOverlay.classList.remove("hidden");
      isSirenOn = true;
      sirenBtn.querySelector("h3").textContent = "Stop Siren";
      sirenBtn.classList.add("shaking");
      header.classList.add("shaking");
    }
  }

  // --- Trigger home animation on load ---
  showView('home');
});
