
var MyMap = function() {

  this.lonlat = function(lon, lat) {
    return new OpenLayers
        .LonLat(lon, lat)
        .transform(this.fromProjection, this.toProjection);
  };

  //

  this.addOSMLayer = function() {
    var layerOSM = new OpenLayers.Layer.OSM();
    this.map.addLayer(layerOSM);
    return layerOSM;
  };

  this.addCycleLayer = function() {
    var layerCycleMap = new OpenLayers.Layer.OSM(
        "OpenCycleMap",
        [
          "http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
          "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
          "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"
        ]);
    this.map.addLayer(layerCycleMap);
    return layerCycleMap;
  };


  this.addTSMLayer = function(layerName) {
    // Tile Map Service
    var layerTMS = new OpenLayers.Layer.TMS(
        layerName,
        [
          'http://tile1.tile.openstreetmap.org/tiles/',
          'http://tile2.tile.openstreetmap.org/tiles/'
        ],
        {
          'layername': 'mapnik'
        }
        );
    this.map.addLayer(layerTMS);
    return layerTMS;
  };


  this.addTextLayer = function(layerName, location) {
    var layerText = new OpenLayers.Layer.Text(
        layerName,
        {
          location: location,
          projection: new OpenLayers.Projection("EPSG:4326")
        });
          // projection: this.map.displayProjection
    this.map.addLayer(layerText);
    return layerText;
  };


  var gpxStyles = new OpenLayers.StyleMap({
    "default": new OpenLayers.Style({
      pointRadius: "5", //  sized according to type attribute
      label: "${name}",
      labelAlign: "cb",
      // labelHaloColor: "#fff",
      // labelHaloWidth: 2,
      fontSize: 9,
      fontFamily: "Arial",
      fontWeight: "bold",
      fontColor: "blue",
      labelYOffset: 6,
      fillColor: "yellow",
      strokeColor: "red",
      strokeWidth: 2,
      strokeOpacity: 1
    }),
    "select": new OpenLayers.Style({
      fillColor: "#66ccff",
      strokeColor: "#3399ff",
      graphicZIndex: 2
    })
  });

  this.addVectorLayer = function(layerName, location) {
    // Add the Layer with the GPX Track
    var layerVectorGPX = new OpenLayers.Layer.Vector(
      layerName,
      {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
          url: location,
          format: new OpenLayers.Format.GPX({
            extractTracks: true,
            extractWaypoints: true,
            extractRoutes: true,
            extractAttributes: true
          })
        }),
        projection: new OpenLayers.Projection("EPSG:4326"),
        // style: {strokeColor: "green", strokeWidth: 5, strokeOpacity: 0.5},
        styleMap: gpxStyles
      });
        // projection: this.map.displayProjection
    this.map.addLayer(layerVectorGPX);
    return layerVectorGPX;
  };


  this.addMarkersLayer = function(layerName) {
    var layerMarkers = new OpenLayers.Layer.Markers(layerName);
    this.map.addLayer(layerMarkers);
    return layerMarkers;
  };


  this.addMarker = function(layerMarkers, lon, lat, iconLocation) {
    var size = new OpenLayers.Size(21, 25);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var icon = new OpenLayers.Icon(iconLocation, size, offset);

    var position = new OpenLayers
        .LonLat(lon, lat)
        .transform(this.fromProjection, this.toProjection);

    var marker = new OpenLayers.Marker(position, icon);

    layerMarkers.addMarker(marker);

    return marker;
  };

  //

  this.setCenter = function(lon, lat, zoom) {
    this.map.setCenter(
        this.lonlat(lon, lat),
        zoom);
  };

  //

  // Transform from WGS 1984
  this.fromProjection = new OpenLayers.Projection("EPSG:4326");
  // to Spherical Mercator Projection
  this.toProjection = new OpenLayers.Projection("EPSG:900913");

  //
  this.map = new OpenLayers.Map(
      "Map",
      {
        controls: [
          new OpenLayers.Control.Navigation(),
          new OpenLayers.Control.PanZoomBar(),
          new OpenLayers.Control.LayerSwitcher({'ascending':false}),
          new OpenLayers.Control.Permalink(),
          new OpenLayers.Control.ScaleLine(),
          new OpenLayers.Control.Permalink('permalink'),
          new OpenLayers.Control.MousePosition(),
          new OpenLayers.Control.OverviewMap(),
          new OpenLayers.Control.KeyboardDefaults()
        ]
      });

  return this;
};


/* Util */


function olGeoPointToLatlon(points) {
  var result = [];
  for (var i = points.length - 1; i >= 0; i--) {
    var latlon = new OpenLayers.LonLat(points[i].x, points[i].y)
        .transform(
            myMap.toProjection,
            myMap.fromProjection);
    result.push(
        new google.maps.LatLng(latlon.lat, latlon.lon)
        );
  };
  return result;
}

function getElevation(components, callback) {
  elevationPath(
      olGeoPointToLatlon(components),
      callback
      );
}

function getPathLength(path) {
  var pathLength = google.maps.geometry.spherical.computeLength(path);
  return pathLength;
}


function drawChart() {
  var options = {
    title: 'Elevation',
    hAxis: {title: 'Year',  titleTextStyle: {color: '#333'}},
    vAxis: {minValue: 0}
  };

  var chart = new google.visualization.AreaChart(
      document.getElementById('chart_div'));

  var request = OpenLayers.Request.GET({
      url: "elevation/201402151724.json",
      callback: function(request) {
        var obj = (new OpenLayers.Format.JSON).read(request.responseText);
        var dataArray = [];
        for (var i = 0 ; i < obj["results"].length ; i++) {
          dataArray.push([""+i, obj["results"][i]["elevation"]]);
        }
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'n');
        data.addColumn('number', 'elevation');
        data.addRows(dataArray);
        chart.draw(
            data,
            options);
      }
      });
}

function loadChart() {
  google.load("visualization", "1", {packages:["corechart"]});
  google.setOnLoadCallback(drawChart);
}

function addPopup() {
  // A popup with some information about our location
  var popup = new OpenLayers.Popup.FramedCloud(
      "Popup", 
      myLocation.getBounds().getCenterLonLat(),
      null,
      '<a target="_blank" href="http://openlayers.org/">We</a> ' +
      'could be here.<br>Or elsewhere.',
      null,
      true // <-- true if we want a close (X) button, false otherwise
  );
  // and add the popup to it.
  map.addPopup(popup);
}