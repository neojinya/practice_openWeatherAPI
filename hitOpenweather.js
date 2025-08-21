
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

// 座標をキー化（小数4桁で丸めて同一判定を安定させる）
function coordKey(lon, lat) {
    return `${Number(lon).toFixed(4)},${Number(lat).toFixed(4)}`;
  }
  
  // UNIX秒 → HH:MM:SS
  function formatTime(ts) {
    const d = new Date(ts * 1000);
    const hh = `0${d.getHours()}`.slice(-2);
    const mm = `0${d.getMinutes()}`.slice(-2);
    const ss = `0${d.getSeconds()}`.slice(-2);
    return `${hh}:${mm}:${ss}`;
  }
  
  

const cards = document.querySelector('.cards_wrap')

const renderError = function(err){
    cards.insertAdjacentHTML('beforeend', err)
}

// 同じ場所のカードがあれば更新、無ければ追加
function renderCard(key, data) {
    // 既存カードを探す（data-key で一意化）
    let card = document.querySelector(`.card[data-key="${key}"]`);
  
    if (!card) {
      // --- 新規作成（最小の骨組みだけ） ---
      const html = `
        <div class="card" data-key="${key}">
          <div class="card__title city"></div>
          <ul class="card__list">
            <li class="card__list__item">
              <span class="ttl"><img class="icon" src="" alt="weather"></span>
              <span class="data weather"></span>
            </li>
            <li class="card__list__item">
              <span class="ttl">🌡</span>
              <span class="data temp"></span>
            </li>
            <li class="card__list__item">
              <span class="ttl">🌪</span>
              <span class="data wind"></span>
            </li>
            <li class="card__list__item">
              <span class="ttl">🌅</span>
              <span class="data sunrise"></span>
            </li>
            <li class="card__list__item">
              <span class="ttl">🌇</span>
              <span class="data sunset"></span>
            </li>
          </ul>
        </div>`;
      cards.insertAdjacentHTML('beforeend', html);
      card = document.querySelector(`.card[data-key="${key}"]`);
    }
  
    // --- 必要な部分だけ更新 ---
    card.querySelector('.city').textContent    = data.name;
    card.querySelector('.weather').textContent = data.weather?.[0]?.main ?? '';
    card.querySelector('.temp').textContent    = `${data.main?.temp ?? ''}℃`;
    card.querySelector('.wind').textContent    = `${(data.wind?.speed ?? 0).toFixed?.(1) ?? data.wind?.speed ?? ''}M`;
    card.querySelector('.sunrise').textContent = formatTime(data.sys.sunrise);
    card.querySelector('.sunset').textContent  = formatTime(data.sys.sunset);
  
    const iconEl = card.querySelector('.icon');
    if (iconEl) {
      iconEl.src = `https://openweathermap.org/img/w/${data.weather?.[0]?.icon}.png`; // ← https
      iconEl.alt = data.weather?.[0]?.description || data.weather?.[0]?.main || 'weather';
    }
  }
  
  // 東京などの最後に検索した地名を使う場合は getGeo() を呼ぶ
// ここでは「現在地」ボタンを押したあとに最新の座標を使って更新する例
let lastLatLng = null;

// --- ページ読み込み時：現在地の天気を表示（以後は setInterval が自動更新） ---
document.addEventListener('DOMContentLoaded', () => {
    // Geolocationは https or localhost でのみ動作する点に注意
    if (!navigator.geolocation) {
      // 位置情報が使えない場合は東京をデフォルト表示に
      getGeo('東京');                    // ← 日本語住所のままでOK（GSI APIを利用）
      return;
    }
  
    cards.style.opacity = 0.5;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        getWeather([lon, lat]);          // ← ここで lastLatLng もセットされる
      },
      (err) => {
        // 拒否や失敗時は東京にフォールバック
        renderError(`位置情報エラー: ${err.message}（東京を表示します）`);
        getGeo('東京');
        cards.style.opacity = 1;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
  


let getWeather = function(latlng) {
    lastLatLng = latlng;

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latlng[1]}&lon=${latlng[0]}&units=metric&appid=dbb8018c14b7dce1b5fdba7520951c60`)
    .then(response => {
        console.log(response)
        if(!response.ok) throw new Error(`${response.status}:天気情報を取得できませんでした`)
        return response.json()
    })
    .then(data => {


        const lon = latlng[0];
        const lat = latlng[1];
        const key = coordKey(lon, lat);   // 一意キー作成
        renderCard(key, data);            // 既存カードがあれば更新、なければ追加
        
        

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
    console.log("tInterval関数が作動");
  if (lastLatLng) getWeather(lastLatLng);
}, 10 * 1000);

  
