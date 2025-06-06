import React, { useEffect, useState } from 'react';
import WeatherCard from './WeatherCard';
import './index.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

const App = () => {
  const [data, setData] = useState(null);
  const [city, setCity] = useState(null);
  const [search, setSearch] = useState("");

  const fetchWeather = (lat, lon, cityName = null) => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&hourly=temperature_2m,weathercode&timezone=auto`)
      .then(res => res.json())
      .then(json => {
        const days = json.daily.time;
        const temps = json.daily.temperature_2m_max;
        const codes = json.daily.weathercode;
        const hourlyTemps = json.hourly.temperature_2m;
        const hourlyCodes = json.hourly.weathercode;
        const hourlyTimes = json.hourly.time;

        const hourlyData = hourlyTimes.map((t, i) => ({
          date: t.split("T")[0],
          hour: t.split("T")[1].slice(0, 5),
          temp: Math.round(hourlyTemps[i]),
          code: hourlyCodes[i]
        }));

        const result = days.map((day, idx) => {
          const hourly = hourlyData.filter(h => h.date === day && parseInt(h.hour) >= 9 && parseInt(h.hour) <= 13);
          return {
            day: new Date(day).toLocaleDateString(undefined, { weekday: 'long' }),
            temp: Math.round(temps[idx]),
            iconCode: codes[idx],
            hourly
          };
        });

        setData(result);
        if (cityName) setCity(cityName);
      });
  };

  const searchCity = () => {
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=1`)
      .then(res => res.json())
      .then(json => {
        if (json.results && json.results.length > 0) {
          const place = json.results[0];
          fetchWeather(place.latitude, place.longitude, place.name);
        }
      });
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
        .then(res => res.json())
        .then(json => {
          setCity(json.city || json.locality || "Unknown Location");
        });

      fetchWeather(lat, lon);
    });
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="header">
        <h1 className="city-name">{city}</h1>
        <div className="search-bar">
          <input
            type="text"
            value={search}
            placeholder="Search city..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={searchCity}>Search</button>
        </div>
      </div>

      <div className="container-carousel">
        <Swiper modules={[Navigation]} navigation spaceBetween={32} slidesPerView={1}>
          {data.map((d, idx) => (
            <SwiperSlide key={idx}>
              <WeatherCard {...d} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default App;
