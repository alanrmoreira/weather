import React, { useEffect, useState } from "react";
import WeatherCard from "./WeatherCard";
import "./index.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

const App = () => {
  const [data, setData] = useState(null);
  const [city, setCity] = useState(null);
  const [search, setSearch] = useState("");
  const [currentUnit, setCurrentUnit] = useState("C");
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLon, setCurrentLon] = useState(null);

  const convertTemp = (tempC) => {
    return currentUnit === "F"
      ? Math.round((tempC * 9) / 5 + 32)
      : Math.round(tempC);
  };

  const fetchWeather = (lat, lon, cityName = null) => {
    const dailyParam = "temperature_2m_max";
    const hourlyParam = "temperature_2m";

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${dailyParam},weathercode&hourly=${hourlyParam},weathercode&timezone=auto`
    )
      .then((res) => res.json())
      .then((json) => {
        const days = json.daily.time;
        const temps = json.daily[dailyParam];
        const codes = json.daily.weathercode;
        const hourlyTemps = json.hourly[hourlyParam];
        const hourlyCodes = json.hourly.weathercode;
        const hourlyTimes = json.hourly.time;

        const hourlyData = hourlyTimes.map((t, i) => ({
          date: t.split("T")[0],
          hour: t.split("T")[1].slice(0, 5),
          temp: convertTemp(hourlyTemps[i]),
          code: hourlyCodes[i],
        }));

        const result = days.map((day, idx) => {
          const hourly = hourlyData.filter(
            (h) =>
              h.date === day && parseInt(h.hour) >= 9 && parseInt(h.hour) <= 13
          );
          return {
            day: new Date(day).toLocaleDateString(undefined, {
              weekday: "long",
            }),
            temp: convertTemp(temps[idx]),
            iconCode: codes[idx],
            hourly,
          };
        });

        setData(result);
        if (cityName) setCity(cityName);
        setCurrentLat(lat);
        setCurrentLon(lon);
      });
  };

  const searchCity = () => {
    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=1`
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.results && json.results.length > 0) {
          const place = json.results[0];
          fetchWeather(place.latitude, place.longitude, place.name);
        }
        setSearch("");
      });
  };

  const unitToggle = () => {
    setCurrentUnit((prev) => {
      const next = prev === "C" ? "F" : "C";
      if (currentLat && currentLon) {
        fetchWeather(currentLat, currentLon, city);
      }
      return next;
    });
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
        .then((res) => res.json())
        .then((json) => {
          setCity(json.city || json.locality || "Unknown Location");
        });

      fetchWeather(lat, lon);
    });
  }, []);

  useEffect(() => {
    if (currentLat && currentLon) {
      fetchWeather(currentLat, currentLon, city);
    }
  }, [currentUnit]);

  if (!data) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="header">
        <div className="unit-toggle-wrapper">
          <h1 className="city-name">{city}</h1>
          <label className="unit-switch">
            <span className="unit-label">°F</span>
            <input
              type="checkbox"
              checked={currentUnit === "F"}
              onChange={unitToggle}
            />
            <span className="slider" />
            <span className="unit-label">°C</span>
          </label>
        </div>
        <div className="search-bar">
          <input
            type="text"
            value={search}
            placeholder="Search city..."
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchCity();
            }}
          />
          <button onClick={searchCity}>Search</button>
        </div>
      </div>

      <div className="container-carousel">
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={32}
          slidesPerView={1}
        >
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
