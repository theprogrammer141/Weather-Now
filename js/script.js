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
const daysDropDown = document.querySelector('#days-select .custom-select__options');
const daysDropDownValue = document.querySelector("#days-select .custom-select__value");
const unitsDropDown = document.querySelector('#units-select .custom-select__options');
const switchToImperial = document.getElementById('switch-to-imperial');
const switchToCelsius = document.getElementById('switch-to-celsius');
const switchToFahrenheit = document.getElementById('switch-to-fahrenheit');
const switchToKmh = document.getElementById('switch-to-kmh');
const switchToMph = document.getElementById('switch-to-mph');
const switchToMillimeters = document.getElementById('switch-to-mm');
const switchToInches = document.getElementById('switch-to-in');

//* Variables
let currentWeatherData = null;

//* Event Listeners
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

// unitsDropDown.addEventListener('click', function(e){
//     if(e.target === switchToImperial){
//         switchToImperial.innerHTML = 'Switch to Metric';
//     }
// })
//* Functions
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
        currentWeatherData = weatherData;
    
        renderWeather(geoData, currentWeatherData);
        console.log(currentWeatherData);
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

    currentWeatherTemperature.textContent = Math.round(weatherData.current.apparent_temperature) + weatherData.current_units.apparent_temperature;

    feelsLike.textContent = Math.round(weatherData.current.temperature_2m) + weatherData.current_units.temperature_2m;
    
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

        const daysDropDownOption = `<li class="custom-select__option" role="option" data-index=${i}>${dayName}</li>`;

        daysDropDown.insertAdjacentHTML('beforeend', daysDropDownOption);
    }

    renderHourlyForecast(weatherData, 0);

    const todayName = new Date(weatherData.daily.time[0]).toLocaleDateString('en-US', {weekday: 'long'});

    daysDropDownValue.textContent = todayName;

    daysDropDown.querySelectorAll('.custom-select__option').forEach(option => {
        option.addEventListener('click', function(){

            daysDropDown.querySelectorAll('.custom-select__option').forEach(opt =>{
                opt.classList.remove("selected");
            });

            const dayIndex = parseInt(this.dataset.index);
            
            daysDropDownValue.textContent = this.textContent;
            
            this.closest('.custom-select').classList.remove('open');

            this.classList.add('selected');

            renderHourlyForecast(currentWeatherData, dayIndex);
        });
    })

}

const renderHourlyForecast = function(weatherData, dayIndex){
    hourlyForecastColumn.innerHTML = '';

    const startIndex = dayIndex * 24;
    const endIndex = startIndex + 24;

    for(let i = startIndex; i < endIndex; i++){
        const weatherIcon = getWeather(weatherData.hourly.weather_code[i]);

        const currentHour = new Date(weatherData.hourly.time[i]).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        });
        
        const currentTemperature = Math.round(weatherData.hourly.temperature_2m[i]) + "°";

        const hourlyForecastCard = `<div class="card">
                                    <img src="${weatherIcon}" alt=""
                                    aria-label="Hourly-weather-Icon" class="hourly-weather-icon"/>
                                    <p class="current-hour" id="current-hour" aria-label="Current-hour">${currentHour}</p>
                                    <p class="current-hour-temperature" id="current-hour-temperature" aria-label="Current-Hour-Temperature">${currentTemperature}</p>
                                    </div>`;

        hourlyForecastColumn.insertAdjacentHTML('beforeend', hourlyForecastCard);
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
