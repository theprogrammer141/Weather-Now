'use strict';

const customSelect = document.querySelectorAll('.custom-select');
const customSelectTrigger = document.querySelectorAll('.custom-select__trigger');
const searchBtn = document.querySelector('#search-btn');
const cityInput = document.querySelector("#search-bar");

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

        const {latitude, longitude, name, country} = geoData.results[0];

        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
    
        const weatherData = await weatherResponse.json();
    
        console.log(weatherData);
    }catch(error){
        console.log(error);
        alert('City not found');
    }
}

