'use strict';

const customSelect = document.querySelectorAll('.custom-select');
const customSelectTrigger = document.querySelectorAll('.custom-select__trigger');
const searchBtn = document.querySelector('#search-btn');
const cityInput = document.querySelector("#search-bar");
const feelsLike = document.getElementById('feels-like-value');
const humidity = document.getElementById('humidity-value');
const windSpeed = document.getElementById('wind-speed-value');
const precipitation = document.getElementById('precipitation-value');
const currentWeatherCity = document.querySelector(".current-weather__city");
const currentWeatherDate = document.querySelector('.current-weather__date');
const currentWeatherIcon = document.querySelector('.current-weather__icon');
const currentWeatherTemperature = document.querySelector(".current-weather__temp");
const dailyForecastGrid = document.querySelector(".daily-forecast-cards-grid");
const hourlyForecastColumn = document.querySelector(".hourly-forecast-column");

customSelectTrigger.forEach(trigger => {
    trigger.addEventListener('click', function(e){
        const parent = this.closest('.custom-select');
        customSelect.forEach(p => {
            if(p !== parent){
                p.classList.remove('open');
            }
        })
        parent.classList.toggle('open');
    })
})

document.addEventListener('click', function(e){
    if(!e.target.closest('.custom-select')){
        customSelect.forEach(p => {
            p.classList.remove('open')
        }) 
    }
});

searchBtn.addEventListener('click', function(e){
    e.preventDefault();
    const city = cityInput.value.trim();

    if(!city) return;

    fetchWeather(city);
});

const fetchWeather = async function(cityName){
    try{
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=10&language=en&format=json`);
    
        const geoData = await geoResponse.json();

        if(!geoData.results || geoData.results.length === 0){
            throw new Error("City Not Found!");
        }

        const {latitude, longitude} = geoData.results[0];

        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
    
        const weatherData = await weatherResponse.json();
    
        renderWeather(geoData, weatherData);
        console.log(weatherData);
        console.log(geoData);
    }catch(error){
        console.log(error);
        alert('City not found');
    }
}

const renderWeather = function(geoData, weatherData){
    currentWeatherCity.textContent = geoData.results[0].name + ", " + geoData.results[0].country;
    
    const date = new Date(weatherData.current.time).toLocaleDateString('en-US', {
        weekday: 'long',
        year:'numeric',
        month: "short",
        day: "numeric",
    })

    currentWeatherDate.textContent = date;

    currentWeatherIcon.src = getWeather(weatherData.current.weather_code);

    currentWeatherTemperature.textContent = weatherData.current.apparent_temperature + weatherData.current_units.apparent_temperature;

    feelsLike.textContent = weatherData.current.temperature_2m + weatherData.current_units.temperature_2m;
    
    humidity.textContent = weatherData.current.relative_humidity_2m + weatherData.current_units.relative_humidity_2m;

    windSpeed.textContent = weatherData.current.wind_speed_10m + weatherData.current_units.wind_speed_10m;

    precipitation.textContent = weatherData.current.precipitation + weatherData.current_units.precipitation;

    for(let i = 0; i < weatherData.daily.time.length; i++){
        const dayName = new Date(weatherData.daily.time[i]).toLocaleDateString('en-US', {weekday: 'short'});
        
        const weatherIcon = getWeather(weatherData.daily.weather_code[i]);

        const max_temp = Math.round(weatherData.daily.temperature_2m_max[i]) + "°";
        const min_temp = Math.round(weatherData.daily.temperature_2m_min[i]) + "°";

        const dailyForecastCard = `<div class="card">
                                <p class="dayName" id="dayName">${dayName}</p>
                                <img src="${weatherIcon}" alt="" class="daily-weather-icon" aria-label="Daily-Weather-Icon"/>
                                <span id="max-temp">${max_temp}</span>
                                <span id="min-temp">${min_temp}</span>
                                </div>`;

        dailyForecastGrid.insertAdjacentHTML('beforeend', dailyForecastCard);
    }
}

const getWeather = function(code){
    if(code <= 0) return '/assets/images/icon-sunny.webp';
    if(code <= 3) return '/assets/images/icon-partly-cloudy.webp';
    if(code <= 48) return '/assets/images/icon-fog.webp';
    if(code <= 55) return '/assets/images/icon-drizzle.webp';
    if(code <= 65) return '/assets/images/icon-rain.webp';
    if(code <= 77) return '/assets/images/icon-snow.webp';
    if(code <= 82) return '/assets/images/icon-rain.webp'
    if(code <= 86) return '/assets/images/icon-snow.webp';
    if(code <= 99) return '/assets/images/icon-storm.webp';
}
