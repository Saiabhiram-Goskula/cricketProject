const backendUrl = "http://localhost:5000";

function saveUserSession(name, pincode) {
  localStorage.setItem("cricketUser", JSON.stringify({ name, pincode }));
}

function getUserSession() {
  return JSON.parse(localStorage.getItem("cricketUser"));
}

// LOGIN / SIGNUP
async function login() {
  const name = document.getElementById("name").value.trim();
  const pincode = document.getElementById("pincode").value.trim();
  if (!name || !pincode) return alert("Enter both name and pincode");

  try {
    const res = await fetch(`${backendUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pincode }),
    });

    const data = await res.json();

    if (!res.ok) {
      showLoginError(data.message || "Error logging in");
      return;
    }

    saveUserSession(name, pincode);
    window.location.href = "home.html";

  } catch (err) {
    showLoginError("Network error. Try again.");
    console.error(err);
  }
}

function showLoginError(message) {
  const errorBox = document.getElementById("loginError");
  if (errorBox) errorBox.textContent = message;
}

// ADD MATCH
async function addMatch() {
  const user = getUserSession();
  if (!user) return (window.location.href = "index.html");

  const runs = +document.getElementById("runs").value;
  const balls = +document.getElementById("balls").value;
  const fours = +document.getElementById("fours").value;
  const sixes = +document.getElementById("sixes").value;
  const opponent = document.getElementById("opponent").value;
  const notes = document.getElementById("notes").value;

  if (!runs || !balls) return alert("Runs and Balls are required!");

  const strikeRate = ((runs / balls) * 100).toFixed(2);
  const match = { runs, balls, fours, sixes, opponent, notes, strikeRate };

  await fetch(`${backendUrl}/addMatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: user.name, pincode: user.pincode, match }),
  });

  document.getElementById("runs").value = "";
  document.getElementById("balls").value = "";
  document.getElementById("fours").value = "";
  document.getElementById("sixes").value = "";
  document.getElementById("opponent").value = "";
  document.getElementById("notes").value = "";

  loadMatches();
}

// LOAD MATCHES
// Load recent matches (last 6 matches)
function loadRecentMatches() {
  const user = getUserSession();
  if (!user) return (window.location.href = "index.html");

  fetch(`${backendUrl}/getMatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  })
    .then(res => res.json())
    .then(matches => {
      const box = document.getElementById("recentMatches");
      if (!box) return;

      // Sort matches descending (newest first)
      matches = matches.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

      // Take last 6 matches
      const recent = matches.slice(0, 6);

      // Render cards
      box.innerHTML = recent.map(m => `
        <div class="bg-white rounded-xl shadow p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold">${m.runs} runs <span class="text-sm text-gray-500">(${m.balls} balls)</span></h3>
              <p class="text-sm text-gray-600">SR: ${m.strikeRate}</p>
              <p class="text-sm text-gray-600">vs ${m.opponent || "Unknown"}</p>
            </div>
            <div class="text-xs text-gray-400">${new Date(m.date).toLocaleDateString()} • ${new Date(m.date).toLocaleTimeString()}</div>
          </div>
          <p class="mt-2 text-gray-700">${m.notes || ""}</p>
        </div>
      `).join('');

      // Update chart using all matches if needed
      drawRunsChart(matches);
    });
}

// Go to full matches page
function viewAllMatches() {
  window.location.href = "allMatches.html"; // create this page to display all matches
}

function drawRunsChart(matches) {
  const canvas = document.getElementById('runsChart');
  const ctx = canvas.getContext('2d');

  // Sort matches by date ascending
  matches.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = matches.map(m => new Date(m.date).toLocaleDateString());
  const runsData = matches.map(m => m.runs);
  const foursData = matches.map(m => m.fours || 0);
  const sixesData = matches.map(m => m.sixes || 0);

  if (window.runsChartInstance) window.runsChartInstance.destroy();

  canvas.width = canvas.offsetWidth;
  canvas.height = 300;

  window.runsChartInstance = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Runs',
          data: runsData,
          borderColor: 'rgb(34,197,94)',
          backgroundColor: 'rgba(34,197,94,0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          type: 'bar',
          label: 'Fours',
          data: foursData,
          backgroundColor: 'rgba(59,130,246,0.7)',
        },
        {
          type: 'bar',
          label: 'Sixes',
          data: sixesData,
          backgroundColor: 'rgba(251,191,36,0.7)',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Match Date' },
          ticks: { maxRotation: 45, minRotation: 30, autoSkip: true, maxTicksLimit: 10 },
          stacked: false
        },
        y: { 
          title: { display: true, text: 'Count / Runs' },
          beginAtZero: true,
          stacked: false
        }
      }
    }
  });
}

// LOGOUT
function logout() {
  localStorage.removeItem("cricketUser");
  window.location.href = "index.html";
}

// Replace previous window.onload for home page
window.onload = () => {
  if (document.getElementById("recentMatches")) loadRecentMatches();
  if (document.getElementById("statsBox")) loadStats();
};