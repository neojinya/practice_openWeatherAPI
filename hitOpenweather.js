
const cards = document.querySelector('.cards_wrap')

const renderError = function(err){
    cards.insertAdjacentHTML('beforeend', err)
}

const renderCard = function(data) {
    const getTime = function(timestanp) {
        const date = new Date(timestanp * 1000);
        const hh = `0${date.getHours()}`.slice(-2);
        const mm = `0${date.getMinutes()}`.slice(-2);
        const ss = `0${date.getSeconds()}`.slice(-2);
        return `${hh}:${mm}:${ss}`
    }
    const html = `
            <div class="card">
                <div class="card__title">${data.name}</div>
                <ul class="card__list">
                <li class="card__list__item">
                    <span class="ttl"><img id="weatherImg01" src=""></span>
                    <span class="data">
                        ${data.weather[0].main}
                    </span>
                </li>
                <li class="card__list__item">
                    <span class="ttl">🌡</span>
                    <span class="data">${data.main.temp}℃</span>
                </li>
                <li class="card__list__item">
                    <span class="ttl">🌪</span>
                    <span class="data">${data.wind.speed.toFixed(1)}M</span>
                </li>
                <li class="card__list__item">
                    <span class="ttl">🌅</span>
                    <span class="data">${getTime(data.sys.sunrise)}</span>
                </li>
                <li class="card__list__item">
                    <span class="ttl">🌇</span>
                    <span class="data">${getTime(data.sys.sunset)}</span>
                </li>
                </ul>
            </div>
            `
    
        cards.insertAdjacentHTML('beforeend', html)
}


const getWeather = function(latlng) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latlng[1]}&lon=${latlng[0]}&units=metric&appid=dbb8018c14b7dce1b5fdba7520951c60`)
    .then(response => {
        console.log(response)
        if(!response.ok) throw new Error(`${response.status}:天気情報を取得できませんでした`)
        return response.json()
    })
    .then(data => {
        // console.log(data)

    
        const getWeatherIcon = function(){
            let icoWeather = document.getElementById('weatherImg01')
            let iconurl = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
            icoWeather.src = iconurl
        }

        renderCard(data)
        
    
        
        // setTimeout(getWeatherIcon(), 0) //この処理をスレッドの一番最後に持ってくる場合
        getWeatherIcon()
        cards.style.opacity = 1;
    })
    .catch(err => {
        // console.error(`${err.message}`)
        // console.error(`${err}🔥🔥🔥`)
        renderError(`${err}`)
    })
    .finally(() => {
        cards.style.opacity = 1;
    }) 
}


const getGeo = function(geo) {
    //国土地理院APIから座標を取得
    fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${geo}
    `)
    .then(res => {
        return res.json();
    })
    .then(data => {
        getWeather(data[0].geometry.coordinates)
    })
}



document.getElementById('submitBtn').addEventListener('click', (e) => {
    e.preventDefault()
    const geoValue = document.getElementById('geo').value
    getGeo(geoValue);
})
