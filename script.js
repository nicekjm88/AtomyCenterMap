const spinner = document.getElementById("spinner");

const mapContainer = document.getElementById("map"), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(36.503603, 127.250751), // 지도의 중심좌표
    level: 12, // 지도의 확대 레벨
    mapTypeId: kakao.maps.MapTypeId.ROADMAP, // 지도종류
  };

// 지도를 생성합니다
const map = new kakao.maps.Map(mapContainer, mapOption);

// 마커 클러스터러를 생성합니다
const clusterer = new kakao.maps.MarkerClusterer({
  map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
  averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
  minLevel: 8, // 클러스터 할 최소 지도 레벨
});

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
const zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

// 검색기능
const inputTxt = document.querySelector("#keyword");

function panTo(lat, lng, centerName, address1, address2) {
  // 이동할 위도 경도 위치를 생성합니다
  const moveLatLon = new kakao.maps.LatLng(lat, lng);

  map.setLevel(4);

  // 지도 중심을 부드럽게 이동시킵니다
  // 만약 이동할 거리가 지도 화면보다 크면 부드러운 효과 없이 이동합니다
  map.panTo(moveLatLon);

  const content = `<div class="overlay_info">
                  <p class="title">센터명 : <strong>${centerName}</strong></p>
                  <div class="desc">
                    <span class="address">${address1}&nbsp;${address2}</span>
                  </div>
                </div>`;

  const position = moveLatLon;

  // 커스텀 오버레이를 생성합니다
  const mapCustomOverlay = new kakao.maps.CustomOverlay({
    position: position,
    content: content,
    xAnchor: 0.5, // 커스텀 오버레이의 x축 위치입니다. 1에 가까울수록 왼쪽에 위치합니다. 기본값은 0.5 입니다
    yAnchor: 0.98, // 커스텀 오버레이의 y축 위치입니다. 1에 가까울수록 위쪽에 위치합니다. 기본값은 0.5 입니다
  });

  // 커스텀 오버레이를 지도에 표시합니다
  mapCustomOverlay.setMap(map);

  kakao.maps.event.addListener(map, "zoom_changed", function () {
    // 지도의 현재 레벨을 얻어옵니다
    const level = map.getLevel();

    if (level > 4) {
      mapCustomOverlay.setMap(null);
    } else {
      mapCustomOverlay.setMap(map);
    }
  });
}

async function loadData() {
  spinner.removeAttribute("hidden");
  await fetch(
    "https://atomy-kr-education-center-default-rtdb.asia-southeast1.firebasedatabase.app/.json"
  )
    .then((response) => response.json())
    .then((data) => {
      spinner.setAttribute("hidden", "");
      const markers = $(data).map(function (i, data) {
        const coords = new kakao.maps.LatLng(data.lat, data.lng);

        const marker = new kakao.maps.Marker({
          map: map,
          position: coords,
        });

        // 인포윈도우로 장소에 대한 설명을 표시합니다
        const infowindow = new kakao.maps.InfoWindow({
          content: `<div class="wrap-infowindow">
                      <strong>${data.centerName}</strong>
                      <ul>
                        <li>${data.address1}</li>
                        <li>${data.address2}</li>
                      </ul>
                    </div>`, // 인포윈도우에 표시할 내용
        });

        kakao.maps.event.addListener(
          marker,
          "mouseover",
          makeOverListener(map, marker, infowindow)
        );

        kakao.maps.event.addListener(
          marker,
          "mouseout",
          makeOutListener(infowindow)
        );

        return marker;
      });

      // 클러스터러에 마커들을 추가합니다
      clusterer.addMarkers(markers);

      for (let i = 0; i < data.length; i++) {}

      // 인포윈도우를 표시하는 클로저를 만드는 함수입니다
      function makeOverListener(map, marker, infowindow) {
        return function () {
          infowindow.open(map, marker);
        };
      }

      // 인포윈도우를 닫는 클로저를 만드는 함수입니다
      function makeOutListener(infowindow) {
        return function () {
          infowindow.close();
        };
      }

      inputTxt.addEventListener("change", function (e, i) {
        const keyword = e.target.value;

        const result = data.filter((e) => {
          const isContain =
            e.centerName.includes(keyword) ||
            e.address1.includes(keyword) ||
            e.address2.includes(keyword);
          return isContain;
        });

        const listGroup = document.querySelector("#placesList");

        if (result.length === 0 || keyword === "") {
          if (!$(".nodata").is(":visible")) {
            listGroup.innerHTML = "";
            listGroup.insertAdjacentHTML(
              "beforebegin",
              "<div class='nodata'>데이터가 존재하지 않습니다.</div>"
            );
          }
        } else {
          if ($(".nodata").is(":visible")) {
            $(".nodata").remove();
          }

          let itemStr = "";

          for (let i = 0; i < result.length; i++) {
            itemStr += `<li>
                        <a href="#" onclick="panTo(${result[i].lat},${result[i].lng},'${result[i].centerName}','${result[i].address1}','${result[i].address2}')">
                          <strong>${result[i].centerName}</strong>
                          <address>${result[i].address1}&nbsp;${result[i].address2}</address>
                        </a>
                      </li>`;
          }

          listGroup.innerHTML = itemStr;
        }
      });
    })
    .catch((error) => console.log(error));
}

loadData();
