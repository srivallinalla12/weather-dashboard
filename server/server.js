const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

const API_KEY = 'e356b44b117dc3e22d0880ff9df578bf'; // OpenWeather key

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// ===== Current Weather API =====
app.get('/api/weather', async (req, res) => {
  const { city, lat, lon } = req.query;
  let url = '';

  if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
  } else if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  } else {
    return res.status(400).json({ error: "Missing city or coordinates" });
  }

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Weather fetch error:", err.message);
    res.status(500).json({ error: 'Error fetching weather data' });
  }
});

// ===== 5-Day Forecast API =====
app.get('/api/forecast', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "Missing city name" });

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Forecast fetch error:", err.message);
    res.status(500).json({ error: "Error fetching forecast data" });
  }
});

// ===== City Autocomplete API =====
app.get('/api/citysearch', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const response = await axios.get('http://geodb-free-service.wirefreethought.com/v1/geo/cities', {
      params: {
        namePrefix: query,
        limit: 5,
        sort: '-population'
      }
    });

    const cities = response.data.data.map(city => ({
      name: city.city,
      country: city.countryCode
    }));

    res.json(cities);
  } catch (err) {
    console.error("City search error:", err.message);
    res.status(500).json([]);
  }
});

// ===== Start Server =====
app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  const open = await import('open');
  open.default(`http://localhost:${PORT}`);
});
