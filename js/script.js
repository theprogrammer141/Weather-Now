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
const statusContainer = document.getElementById('status-container');
const statusLoading = document.getElementById('status-loading');
const statusNotFound = document.getElementById('status-not-found');
const statusApiError = document.getElementById('status-api-error');
const weatherDetails = document.getElementById('weather-details');
const suggestionsList = document.getElementById('suggestions-list');

//* Variables
let currentWeatherData = null;
let currentCity = null;
let currentUnits = {
    temperature: 'celsius',
    windSpeed: 'kmh',
    precipitation: 'mm'
};
let debounceTimer = null;

//* Functions
const fetchWeather = async function(cityName){
    showState('loading');

    try{
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=10&language=en&format=json`);
    
        const geoData = await geoResponse.json();

        if(!geoData.results || geoData.results.length === 0){
            showState('not-found');
            return;
        }

        const {latitude, longitude, name, country} = geoData.results[0];

        currentCity = {
            name,
            country
        };

        const unitParams = `&temperature_unit=${currentUnits.temperature}&wind_speed_unit=${currentUnits.windSpeed}&precipitation_unit=${currentUnits.precipitation}`

        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7${unitParams}`);
    
        const weatherData = await weatherResponse.json();
        currentWeatherData = weatherData;
    
        renderWeather(geoData, currentWeatherData);
        showState('success');
        console.log(currentWeatherData);
        console.log(geoData);
    }catch(error){
        console.log(error);
        showState('api-error');
    }
}

const renderWeather = function(geoData, weatherData){
    //clear old data
    dailyForecastGrid.innerHTML = '';
    hourlyForecastColumn.innerHTML = '';
    daysDropDown.innerHTML = '';

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

const showState = function(state){
    //Hide everything first
    statusLoading.classList.add('hidden');
    statusNotFound.classList.add('hidden');
    statusApiError.classList.add('hidden');
    weatherDetails.classList.add('hidden');
    statusContainer.classList.add('hidden');

    if (state === 'loading') {
        statusContainer.classList.remove('hidden');
        statusLoading.classList.remove('hidden');
    } else if (state === 'not-found') {
        statusContainer.classList.remove('hidden');
        statusNotFound.classList.remove('hidden');
    } else if (state === 'api-error') {
        statusContainer.classList.remove('hidden');
        statusApiError.classList.remove('hidden');
    } else if (state === 'success') {
        weatherDetails.classList.remove('hidden');
    }
}

const fetchSuggestions = async function(query){
    try{
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);

        const data = await response.json();

        if(!data.results){
            suggestionsList.classList.add('hidden');
            return;
        }

        renderSuggestions(data.results);
    }catch(error){
        suggestionsList.classList.add('hidden');
    }
};

const renderSuggestions = function(results){
    suggestionsList.innerHTML = '';

    results.forEach(result => {
        const li = `<li class="suggestions-list__item" data-name="${result.name}">
                    <span>${result.name}</span>
                    <span class="suggestions-list__item-country">${result.country}</span>
                    </li>`;
        suggestionsList.insertAdjacentHTML('beforeend', li);
    });

    suggestionsList.classList.remove('hidden');

    suggestionsList.querySelectorAll('.suggestions-list__item').forEach(item => {
        item.addEventListener('click', function(){
            cityInput.value = this.dataset.name;
            suggestionsList.classList.add('hidden');
            fetchWeather(this.dataset.name);
        });
    });
};

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

document.getElementById('search-form').addEventListener('submit', function(e){
    e.preventDefault();
    const city = cityInput.value.trim();
    if(!city) return;
    fetchWeather(city);
});

unitsDropDown.addEventListener('click', function(e){
    if(!currentCity) return;

    if(e.target === switchToImperial){
        const isMetric = currentWeatherData.current_units.temperature_2m === '°C';

        if(isMetric){
            currentUnits = {
                temperature: 'fahrenheit',
                windSpeed: 'mph',
                precipitation: 'inch'
            };
            
            switchToImperial.textContent = 'Switch to Metric';
        }else{
            currentUnits = {
                temperature: 'celsius',
                windSpeed: 'kmh',
                precipitation: 'mm'
            };
            
            switchToImperial.textContent = 'Switch to Imperial';
        }

        fetchWeather(currentCity.name);
    }

    // Individual toggles
    const individual_toggles = [switchToCelsius, switchToFahrenheit, switchToKmh, switchToMph, switchToMillimeters, switchToInches];

    if(individual_toggles.includes(e.target)){
        if(e.target === switchToCelsius) currentUnits.temperature = 'celsius';
        if(e.target === switchToFahrenheit) currentUnits.temperature = 'fahrenheit';
        if(e.target === switchToKmh) currentUnits.windSpeed = 'kmh';
        if(e.target === switchToMph) currentUnits.windSpeed = 'mph';
        if(e.target === switchToMillimeters) currentUnits.precipitation = 'mm';
        if(e.target === switchToInches) currentUnits.precipitation = 'inch';

        fetchWeather(currentCity.name);
    }
});

document.getElementById('retry-btn').addEventListener('click', function(){
    if(currentCity) fetchWeather(currentCity.name);
});

cityInput.addEventListener('input', function(){
    const query = this.value.trim();

    clearTimeout(debounceTimer);

    if(query.length < 2){
        suggestionsList.classList.add('hidden');
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchSuggestions(query)
    }, 300);
});

document.addEventListener('click', function(e){
    if(!e.target.closest('.search-form')){
        suggestionsList.classList.add('hidden');
    }
});