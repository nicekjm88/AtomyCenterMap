var mapContainer = document.getElementById("map"), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(36.503603, 127.250751), // 지도의 중심좌표
    level: 10, // 지도의 확대 레벨
    mapTypeId: kakao.maps.MapTypeId.ROADMAP, // 지도종류
  };

// 지도를 생성합니다
var map = new kakao.maps.Map(mapContainer, mapOption);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
var zoomControl = new kakao.maps.ZoomControl();
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

// 검색기능
var inputTxt = document.querySelector("#keyword");

function panTo(lat, lng, centerName, address1, address2) {
  // 이동할 위도 경도 위치를 생성합니다
  var moveLatLon = new kakao.maps.LatLng(lat, lng);

  map.setLevel(4);

  // 지도 중심을 부드럽게 이동시킵니다
  // 만약 이동할 거리가 지도 화면보다 크면 부드러운 효과 없이 이동합니다
  map.panTo(moveLatLon);

  var content = `<div class="overlay_info">
                  <p class="title">센터명 : <strong>${centerName}</strong></p>
                  <div class="desc">
                    <span class="address">${address1}&nbsp;${address2}</span>
                  </div>
                </div>`;

  var position = moveLatLon;

  // 커스텀 오버레이를 생성합니다
  var mapCustomOverlay = new kakao.maps.CustomOverlay({
    position: position,
    content: content,
    xAnchor: 0.5, // 커스텀 오버레이의 x축 위치입니다. 1에 가까울수록 왼쪽에 위치합니다. 기본값은 0.5 입니다
    yAnchor: 0.98, // 커스텀 오버레이의 y축 위치입니다. 1에 가까울수록 위쪽에 위치합니다. 기본값은 0.5 입니다
  });

  // 커스텀 오버레이를 지도에 표시합니다
  mapCustomOverlay.setMap(map);

  kakao.maps.event.addListener(map, "zoom_changed", function () {
    // 지도의 현재 레벨을 얻어옵니다
    var level = map.getLevel();

    if (level > 4) {
      mapCustomOverlay.setMap(null);
    } else {
      mapCustomOverlay.setMap(map);
    }
  });
}

fetch("./centerData.json")
  .then((response) => response.json())
  .then((data) => {
    for (var i = 0; i < data.length; i++) {
      var coords = new kakao.maps.LatLng(data[i].lat, data[i].lng);

      // 결과값으로 받은 위치를 마커로 표시합니다
      var marker = new kakao.maps.Marker({
        map: map,
        position: coords,
      });

      // 인포윈도우로 장소에 대한 설명을 표시합니다
      var infowindow = new kakao.maps.InfoWindow({
        content: `<div class="wrap-infowindow">
                      <strong>${data[i].centerName}</strong>
                      <ul>
                        <li>${data[i].address1}</li>
                        <li>${data[i].address2}</li>
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
    }

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
      var keyword = e.target.value;

      var result = data.filter((e) => {
        var isContain =
          e.centerName.includes(keyword) ||
          e.address1.includes(keyword) ||
          e.address2.includes(keyword);
        return isContain;
      });

      var listGroup = document.querySelector("#placesList");
      var itemStr = "";

      for (var i = 0; i < result.length; i++) {
        itemStr += `<li>
                      <a href="#" onclick="panTo(${result[i].lat},${result[i].lng},'${result[i].centerName}','${result[i].address1}','${result[i].address2}')">
                        <strong>${result[i].centerName}</strong>
                        <address>${result[i].address1}&nbsp;${result[i].address2}</address>
                      </a>
                    </li>`;
      }

      listGroup.innerHTML = itemStr;
    });
  });