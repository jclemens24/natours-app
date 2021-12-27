/* eslint-disable */
console.log('Hello from the client side');

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiamNsZW1lbnMyNCIsImEiOiJja3hoeG5mczcyY3JyMnBxcTlwZHNrNzNxIn0.9izR-BIY5IzUsEGMTwr-XQ';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jclemens24/ckxhy2lbk0vaw16o0cxtfgak0',
    scrollZoom: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(local => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(local.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 50
    })
      .setLngLat(local.coordinates)
      .setHTML(`<p>Day ${local.day}: ${local.description}</p>`)
      .addTo(map);

    bounds.extend(local.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
