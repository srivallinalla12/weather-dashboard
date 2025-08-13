// Global live clock interval holder
let liveClockInterval = null;

// 🔹 DOM Elements
const cityForm = document.getElementById('city-form');
const cityInput = document.getElementById('city-input');
const weatherOutput = document.getElementById('weather-output');
const locationBtn = document.getElementById('location-btn');
const favoritesList = document.getElementById('favorites-list');
const compareForm = document.getElementById('compare-form');
const city1Input = document.getElementById('city1');
const city2Input = document.getElementById('city2');
const comparisonOutput = document.getElementById('comparison-output');
const suggestionsBox = document.getElementById('suggestions');

// 🔹 Fetch weather data
async function fetchWeather(city) {
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (data.cod !== 200) {
      alert("City not found or API error.");
      return null;
    }
    return data;
  } catch (err) {
    console.error("Weather fetch error:", err);
    alert("Failed to fetch weather.");
    return null;
  }
}

// 🔹 Fetch forecast data
async function fetchForecast(city) {
  try {
    const res = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    if (!data.list) return null;
    return data;
  } catch (err) {
    console.error("Forecast fetch error:", err);
    return null;
  }
}

// 🔹 Display weather
function displayWeather(data, container) {
  if (!data) return;

  const cityName = data.name;
  const emoji = getWeatherEmoji(data.weather[0].main);
  setBackgroundByWeather(data.weather[0].main);

  const isDay = isDayTime(data);
  const image = getWeatherImage(data.weather[0].description, isDay);

  container.innerHTML = `
    <div class="animate__animated animate__fadeInUp">
      <h3>
        ${cityName}, ${data.sys.country} ${emoji}
        <button id="add-fav-btn" style="margin-left: 15px;">➕ Add to Favorites</button>
      </h3>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:20px;">
        <div>
          <p>🕒 Local Time: <span id="local-time">Loading...</span></p>
          <p>🌡️ Temperature: ${data.main.temp}°C</p>
          <p>🌥️ Condition: ${data.weather[0].description}</p>
          <p>💧 Humidity: ${data.main.humidity}%</p>
          <p>🌬️ Wind: ${data.wind.speed} m/s</p>
        </div>
        <img src="${image}" alt="Weather illustration" class="weather-illustration"/>
      </div>
    </div>
  `;

  document.getElementById('add-fav-btn').addEventListener('click', () => {
    addFavorite(cityName);
  });

  // Start live clock
  startLiveLocalTime(data.dt, data.timezone);
}

// 🔹 Display forecast table
function displayForecast(data) {
  const tableBody = document.querySelector("#forecast-table tbody");
  tableBody.innerHTML = "";

  const dailyData = {};
  data.list.forEach(item => {
    const date = new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!dailyData[date]) dailyData[date] = [];
    dailyData[date].push(item);
  });

  Object.keys(dailyData).slice(0, 5).forEach(date => {
    const dayData = dailyData[date];
    const temps = dayData.map(d => d.main.temp);
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const condition = dayData[0].weather[0].description;
    const emoji = getWeatherEmoji(dayData[0].weather[0].main);

    const row = `
      <tr>
        <td>${date}</td>
        <td>${emoji}</td>
        <td>${avgTemp}°C</td>
        <td>${condition}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

// 🔹 Emoji helper
function getWeatherEmoji(condition) {
  switch (condition.toLowerCase()) {
    case "clouds": return "☁️";
    case "rain": return "🌧️";
    case "clear": return "☀️";
    case "snow": return "❄️";
    case "thunderstorm": return "⛈️";
    case "drizzle": return "🌦️";
    case "haze":
    case "fog":
    case "mist": return "🌫️";
    default: return "🌍";
  }
}

// 🔹 Correct Day/Night detection
function isDayTime(data) {
  const localNow = (Date.now() / 1000) + data.timezone;
  return localNow >= data.sys.sunrise && localNow <= data.sys.sunset;
}

// 🔹 Background by weather
function setBackgroundByWeather(condition) {
  const body = document.body;
  switch (condition.toLowerCase()) {
    case 'clear':
      body.style.background = 'linear-gradient(to top, #56ccf2, #2f80ed)';
      break;
    case 'clouds':
      body.style.background = 'linear-gradient(to top, #bdc3c7, #2c3e50)';
      break;
    case 'rain':
    case 'drizzle':
      body.style.background = 'linear-gradient(to top, #373b44, #4286f4)';
      break;
    case 'snow':
      body.style.background = 'linear-gradient(to top, #e6dada, #274046)';
      break;
    case 'thunderstorm':
      body.style.background = 'linear-gradient(to top, #141e30, #243b55)';
      break;
    case 'haze':
    case 'mist':
      body.style.background = 'linear-gradient(to top, #757f9a, #d7dde8)';
      break;
    default:
      body.style.background = 'linear-gradient(to top, #2c3e50, #4ca1af)';
  }
}

// 🔹 Search city
cityForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  const data = await fetchWeather(city);
  if (data) {
    displayWeather(data, weatherOutput);
    const forecastData = await fetchForecast(city);
    if (forecastData) displayForecast(forecastData);
    cityInput.value = "";
    suggestionsBox.innerHTML = "";
  }
});

// 🔹 Use my location
locationBtn.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.cod !== 200) {
        alert("Location error.");
        return;
      }
      displayWeather(data, weatherOutput);
      const forecastData = await fetchForecast(data.name);
      if (forecastData) displayForecast(forecastData);
    } catch (err) {
      alert("Failed to fetch location weather.");
    }
  }, () => {
    alert("Location permission denied.");
  });
});

// (Favorites, compare cities, autocomplete, ScrollReveal, images, live time...)
// 🔹 Add favorite
function addFavorite(city) {
  let favs = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!favs.includes(city)) {
    favs.push(city);
    localStorage.setItem("favorites", JSON.stringify(favs));
    updateFavoritesList();
  }
}
function removeFavorite(city) {
  let favs = JSON.parse(localStorage.getItem("favorites")) || [];
  favs = favs.filter(c => c !== city);
  localStorage.setItem("favorites", JSON.stringify(favs));
  updateFavoritesList();
}
function updateFavoritesList() {
  favoritesList.innerHTML = "";
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];
  favs.forEach(city => {
    const li = document.createElement("li");
    const cityBtn = document.createElement("button");
    cityBtn.textContent = city;
    cityBtn.style.marginRight = "10px";
    cityBtn.addEventListener("click", async () => {
      const data = await fetchWeather(city);
      displayWeather(data, weatherOutput);
      const forecastData = await fetchForecast(city);
      if (forecastData) displayForecast(forecastData);
    });
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.style.color = "red";
    removeBtn.title = "Remove from favorites";
    removeBtn.addEventListener("click", () => removeFavorite(city));
    li.appendChild(cityBtn);
    li.appendChild(removeBtn);
    favoritesList.appendChild(li);
  });
}
updateFavoritesList();

// 🔹 Autocomplete
cityInput.addEventListener('input', async () => {
  const input = cityInput.value.trim();
  suggestionsBox.innerHTML = "";
  if (input.length < 2) return;
  try {
    const res = await fetch(`/api/citysearch?q=${encodeURIComponent(input)}`);
    const cities = await res.json();
    if (!cities || cities.length === 0) return;
    cities.forEach(city => {
      const li = document.createElement("li");
      li.textContent = `${city.name}, ${city.country}`;
      li.addEventListener("click", () => {
        cityInput.value = city.name;
        suggestionsBox.innerHTML = "";
      });
      suggestionsBox.appendChild(li);
    });
  } catch (err) {
    console.error("Autocomplete error:", err);
  }
});
document.addEventListener("click", (e) => {
  if (e.target !== cityInput) suggestionsBox.innerHTML = "";
});

// 🔹 Weather Images 
function getWeatherImage(condition, isDay) {
  const imgPath = "images/";
  condition = condition.toLowerCase();
  if (condition.includes("snow")) return imgPath + "snow.jpg";
  if (condition.includes("rain")) return imgPath + "rain.jpg";
  if (condition.includes("wind")) return imgPath + "windy.jpg";
  if (condition.includes("cloud")) return condition.includes("mostly") ? imgPath + "mostly-cloudy.jpg" : imgPath + "partly-cloudy.jpg";
  if (condition.includes("clear")) return isDay ? imgPath + "clear-day.jpg" : imgPath + "clear-night.jpg";
  if (condition.includes("sun")) return imgPath + "sunny-day.jpg";
  if (condition.includes("mist")) return imgPath + "mist.jpg";
  if (condition.includes("fog")) return imgPath + "fog.jpg";
  if (condition.includes("haze")) return imgPath + "mist.jpg";
  return isDay ? imgPath + "clear-day.jpg" : imgPath + "clear-night.jpg";
}

// 🔹 Live clock
function startLiveLocalTime(dtUTCSeconds, timezoneOffsetSeconds) {
  const localTimeEl = document.getElementById('local-time');
  if (!localTimeEl) return;
  function updateTime() {
    const nowUTCms = Date.now() + (new Date().getTimezoneOffset() * 60000);
    const cityLocalMs = nowUTCms + timezoneOffsetSeconds * 1000;
    const cityDate = new Date(cityLocalMs);
    localTimeEl.textContent = cityDate.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  if (liveClockInterval) clearInterval(liveClockInterval);
  updateTime();
  liveClockInterval = setInterval(updateTime, 1000);
}
// 🔹 Compare two cities
compareForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // 🚫 Stop page reload

  const city1 = city1Input.value.trim();
  const city2 = city2Input.value.trim();

  if (!city1 || !city2) {
    comparisonOutput.innerHTML = "<p>Please enter two cities.</p>";
    return;
  }

  try {
    const [data1, data2] = await Promise.all([
      fetchWeather(city1),
      fetchWeather(city2)
    ]);

    if (!data1 || !data2) {
      comparisonOutput.innerHTML = "<p>Error fetching one or both cities.</p>";
      return;
    }

    comparisonOutput.innerHTML = `
      <div class="compare-city">
        <h3>${data1.name} ${getWeatherEmoji(data1.weather[0].main)}</h3>
        <p>🌡️ Temp: ${data1.main.temp}°C</p>
        <p>${data1.weather[0].description}</p>
      </div>
      <div class="compare-city">
        <h3>${data2.name} ${getWeatherEmoji(data2.weather[0].main)}</h3>
        <p>🌡️ Temp: ${data2.main.temp}°C</p>
        <p>${data2.weather[0].description}</p>
      </div>
    `;
  } catch (err) {
    console.error("Compare error:", err);
    comparisonOutput.innerHTML = "<p>Something went wrong comparing cities.</p>";
  }
});
