
// 既存の fetch コードはそのままでOK（内部で自動リトライされる）
// 即時実行async関数（IIFE）でラップする
// (async () => {
//     try {
//       const res = await fetch('/api/weather?city=Tokyo');
//       const data = await res.json();
//     //   console.log("テスト取得:", data);
//     } catch (err) {
//     //   console.error("fetch失敗:", err);
//     }
//   })();
  

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

  // 東京などの最後に検索した地名を使う場合は getGeo() を呼ぶ
// ここでは「現在地」ボタンを押したあとに最新の座標を使って更新する例
let lastLatLng = null;


let getWeather = function(latlng) {
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

// getWeather の直前で記録（getWeather の最初の行に置いてもOK）
const _origGetWeather = getWeather;
getWeather = function(latlng) {
  lastLatLng = latlng;
  return _origGetWeather(latlng);
};


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

document.getElementById('currentBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      renderError('このブラウザは位置情報に未対応です');
      return;
    }
    cards.style.opacity = 0.5;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // 既存の getWeather は [lon, lat] 順の配列を期待している
        getWeather([lon, lat]);
      },
      (err) => {
        renderError(`位置情報エラー: ${err.message}`);
        cards.style.opacity = 1;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });





// 30分ごとに再取得
setInterval(() => {
    console.log("動作");
  if (lastLatLng) getWeather(lastLatLng);
}, 10 * 1000);

  
