const BRTA_ATTRIBUTION = 'Kaartgegevens: © <a href="http://www.cbs.nl">CBS</a>, <a href="http://www.kadaster.nl">Kadaster</a>, <a href="http://openstreetmap.org">OpenStreetMap</a><span class="printhide">-auteurs (<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>).</span>'

// a function for obtaining a layer object, which can be added to the map
function getWMTSLayer (layername, attribution) {
  return L.tileLayer(`https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/${layername}/EPSG:28992/{z}/{x}/{y}.png`, {
    WMTS: false,
    attribution: attribution,
    crossOrigin: true
  })
}

// 1. BRT-backdrop map variants from PDOK:
const brtRegular = getWMTSLayer('standaard', BRTA_ATTRIBUTION)
const brtGrijs = getWMTSLayer('grijs', BRTA_ATTRIBUTION)
const brtPastel = getWMTSLayer('pastel', BRTA_ATTRIBUTION)
const brtWater = getWMTSLayer('water', BRTA_ATTRIBUTION)


// see "Nederlandse richtlijn tiling" https://www.geonovum.nl/uploads/standards/downloads/nederlandse_richtlijn_tiling_-_versie_1.1.pdf
// Resolution (in pixels per meter) for each zoomlevel
var res = [3440.640, 1720.320, 860.160, 430.080, 215.040, 107.520, 53.760, 26.880, 13.440, 6.720, 3.360, 1.680, 0.840, 0.420]

// The map object - Javascript object that represents the zoomable map component
// Projection parameters for RD projection (EPSG:28992):
var map = L.map('map-canvas', {
  continuousWorld: true,
  crs: new L.Proj.CRS('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs', {
    transformation: L.Transformation(-1, -1, 0, 0),
    resolutions: res,
    origin: [-285401.920, 903401.920],
    bounds: L.bounds([-285401.920, 903401.920], [595401.920, 22598.080])
  }),
  layers: [
    brtRegular
  ],
  center: [52.0047529, 4.3702697],
  zoom: 10,
})

// 2. aerial photo * not working at this moment (see Assignment)
//    - can be switched on/off by toggle thru L.control.layers (see below in this script)
var wms_aerial_url = "https://geodata1.nationaalgeoregister.nl/luchtfoto/wms?"; 
var basemap_aerial = new L.tileLayer.wms(wms_aerial_url, {
    layers: ['luchtfoto_png'],
    styles: '',
    format: 'image/png',
    transparent: true,
    pointerCursor: true
});
basemap_aerial.getAttribution = function() {
    return 'Luchtfoto WMS <a href="https://www.kadaster.nl">Kadaster</a>.';
}


// 3. a thematic WMS as overlay map
var wms_sound_url = "https://geodata.nationaalgeoregister.nl/rwsgeluidskaarten/ows?"
var sound = new L.tileLayer.wms(wms_sound_url, {
                        layers: ['Lden_2016'],
                        styles: '',
                        format: 'image/png',
                        transparent: true,
                        attribution: '© <a href="https://www.rws.nl/"> Rijkswaterstaat</a>',
                        pointerCursor: true,
                        }) ;

var overlays = {
    "Event table [WFS]": events_wfs,
};


var baseLayers = {
  'BRT-Achtergrondkaart [WMTS]': brtRegular,
  'BRT-Achtergrondkaart Grijs [WMTS]': brtGrijs,
  'BRT-Achtergrondkaart Pastel [WMTS]': brtPastel,
  'BRT-Achtergrondkaart Water [WMTS]': brtWater,
  "Aerial photo [WMS]": basemap_aerial,
}

// L.control.layers(baseLayers, overlays).addTo(map)


events_wfs.addTo(map) ;
 
// 3.c. this is the control for switching layers on and off - the variables baseLayers and overlays group the layers
L.control.layers(baseLayers, overlays).addTo(map);



// added for lab8
	// Global variables for the WFS requests (getfeature and insert) of geoweb:events_all
	// var url_wfs = 'http://pakhuis.tudelft.nl:8088/geoserver/geoweb/ows?';
	var url_wfs = 'https://varioscale.bk.tudelft.nl/geoserver/geoweb/ows?';
	var featuretype = "geoweb:events_all" ;		
	var namespace_prefix = "geoweb" ;
	var namespace_uri = "http://all.kinds.of.data" ;
	var geomPropertyName = "geoweb:geom" ;

	
	// 1. add the events from GeoServer to the map
	// (already loaded via wfs_events.js)
	// or hide them till user clicks on layers control in upper right
    //events_wfs.addTo(map);
	
	
    // 2. for the drawing and insert of features	
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Set the title to show on the polygon button
    L.drawLocal.draw.toolbar.buttons.polygon = 'Draw a polygon!';

    var drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
            polyline: false,
            polygon: false,
            circle: false,
            rectangle: false, 
            marker: true
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    map.addControl(drawControl);

	// for debug of geometry
	function toWKT(layer) {
		var lng, lat, coords = [];
		if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
			var latlngs = layer.getLatLngs();
			for (var i = 0; i < latlngs.length; i++) {
				latlngs[i]
				coords.push(latlngs[i].lng + " " + latlngs[i].lat);
				if (i === 0) {
					lng = latlngs[i].lng;
					lat = latlngs[i].lat;
				}
		};
			if (layer instanceof L.Polygon) {
				return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
			} else if (layer instanceof L.Polyline) {
				return "LINESTRING(" + coords.join(",") + ")";
			}
		} else if (layer instanceof L.Marker) {
			return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
		}
    }

	
	// start of construction of WFS Insert request
    function insertWFS(lng, lat, event_name, reported_by) {
	
		var featProperties = [ { "name": "geoweb:event_name", "value": event_name }, 
							   { "name": "geoweb:reported_by", "value": reported_by } 
							 ] ;

		insertPoint(url_wfs, featuretype, namespace_prefix, namespace_uri, featProperties, geomPropertyName, lng, lat ) ;	
	}
	

	
    map.on(L.Draw.Event.CREATED, function (e) {
        var type = e.layerType,
                layer = e.layer;

        //if (type === 'marker') {
        //    layer.bindPopup('A popup!');
        //}

		// 2017 debug
		console.log(toWKT(layer));
		
		if (layer instanceof L.Marker) {
		  var lng = layer.getLatLng().lng ;
		  var lat = layer.getLatLng().lat ;
			
		  var js_function = ''
					    + ' var event_name = document.getElementById(\'event_name\').value ; '
						+ ' var reported_by = document.getElementById(\'reported_by\').value ; '
						+ ' insertWFS('+lng+','+lat+', event_name, reported_by) ; ' ;
						
		  var event_name="" ;
          var reported_by="" ;	
		  
		  var popupContent = ''
		  +'<label for="event_name">Event name: </label><br>'
		  +'<input  type="text" id="event_name" name="event_name" value="'+ event_name +'"/><br>'
		  +'<label for="reported_by" >Reported by: </label><br>'
		  +'<input  type="text" id="reported_by" name="reported_by" value="'+ reported_by +'"/><br>'
		  //+'<button type="button" onclick="insertWFS('+lng+','+lat+', document.getElementById(\'event_name\').value, document.getElementById(\'reported_by\').value )">Insert point</button>' ;
		  +'<button type="button" onclick="'+ js_function +'">Insert point</button>' ;
		  
		  
		  console.log(popupContent) ;
		  
		  // lab8 update: added popupclose and remove events
		  layer.bindPopup( popupContent, 
				{ keepInView: true,
				  closeButton: true
				})
			    .on('popupclose', function () {
					console.log('popupclose');
				})

			;	
			
		}
		else
		{
			alert('rectangle just for test; delete it again') ;
		}
		
		drawnItems.addLayer(layer);
							
    });

	
    map.on(L.Draw.Event.EDITED, function (e) {
        var layers = e.layers;
        var countOfEditedLayers = 0;
        layers.eachLayer(function (layer) {
            countOfEditedLayers++;
        });
        console.log("Edited " + countOfEditedLayers + " layers");
    });

	

	console.log('end of main')



/* GeoLocation code */
/*
*/
map.locate({setView: true, maxZoom: 13});

function onLocationFound(e) {
    var radius = e.accuracy/2;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + Math.round(radius, 3) + " meters from this point").openPopup();

    L.circle(e.latlng, {radius: radius}).addTo(map);
    map.initlat = e.latlng.lat;
    map.initlng = e.latlng.lng;
    
     console.log(e.latlng);
}

map.on('locationfound', onLocationFound);
