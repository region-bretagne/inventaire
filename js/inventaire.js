 inventaire = (function () {
    /*
     * Private
     */
    var _proxy ="";
    
    var _map = null;
    
    var _vectorPoint = null;
    
    var _sourcePoint = new ol.source.Vector();
    
    var _vectorPoly = null;
    
    var _sourcePoly = null;
    
    var draw = null;
    
    var _projection = null;
    
    var _l93 = null;
    
    var _geolocation = null;
    
    var _WMTSTileMatrix = {};
    
    var _WMTSTileResolutions = {};
    
    var _layers = null;
    
    var _center = [-403013.39038929436,6128402.399153711];
    
    var _zoom = 8;
    
    var _myprivateFunction = function () {
        alert('test');
    };
    
    var _applyMargins = function () {
        var leftToggler = $(".mini-submenu-left");
        if (leftToggler.is(":visible")) {
          $("#map .ol-zoom")
            .css("margin-left", 0)
            .removeClass("zoom-top-opened-sidebar")
            .addClass("zoom-top-collapsed");
        } else {
          $("#map .ol-zoom")
            .css("margin-left", $(".sidebar-left").width())
            .removeClass("zoom-top-opened-sidebar")
            .removeClass("zoom-top-collapsed");
        }
      };

    var _isConstrained = function () {
        return $(".sidebar").width() == $(window).width();
    };

    var _applyInitialUIState = function () {
        if (_isConstrained()) {
          $(".sidebar-left .sidebar-body").fadeOut('slide');
          $('.mini-submenu-left').fadeIn();
        }
    };
    
    var _parseJsonFeature = function (features) {
         var l93_features = new ol.format.GeoJSON().readFeatures(features[0]);
         var json_output = new ol.format.GeoJSON().writeGeometry(l93_features[0].getGeometry());         
         var features = new ol.format.GeoJSON().readFeatures(features[0],
            {dataProjection: _l93, featureProjection: _projection});
         _sourcePoly.addFeatures(features);
         var geojson_poly = JSON.stringify(json_output);
         var evt = {
            type: "gertrude-poly",
            message: "Récupération du référentiel cadastral réussie!",
            geojson_poly: geojson_poly,
            time: new Date()
         };
         $.event.trigger(evt);
        console.log('gertrude-event',evt);
        inventaire.removeInteraction();
    };

    var _getCadastreGeometry = function (x,y) {
        var evt = {
            type: "gertrude-point",
            message: "Récupération de la parcelle cadastrale réussie!",
            geojson_point: JSON.stringify(
                new ol.format.GeoJSON().writeFeature(
                    new ol.Feature({geometry: new ol.geom.Point([x,y])})
                )
            ),
            time: new Date()
        };
        $.event.trigger(evt);
        console.log('gertrude-event',evt);
         _sourcePoly.clear();
         $.ajax({
            type: "GET",
            url: "http://geobretagne.fr/geoserver/cadastre/wfs?",
            crossDomain: true,
            data: {
                service: "wfs",
                version: "1.1.0",
                request: "GetFeature",
                typeNames:"cadastre:CP.CadastralBuilding",
                srsName: "EPSG:2154",
                outputFormat:"text/javascript",
                bbox: (x-0.5)+","+(y-0.5)+","+(x+0.5)+","+(y+0.5)                                              
            },
            dataType: "jsonp",
            contentType: "application/json",
            jsonp: false,
            jsonpCallback: "parseResponse",
            timeout: 3000,
            success: function (data) {                
                if (data.features && data.features.length > 0) {                    
                     _parseJsonFeature(data.features);                                    
                } else {
                    $.ajax({
                        type: "GET",
                        url: "http://geobretagne.fr/geoserver/cadastre/wfs?",
                        crossDomain: true,
                        data: {
                            service: "wfs",
                            version: "1.1.0",
                            request: "GetFeature",
                            typeNames:"cadastre:CP.CadastralParcel",
                            srsName: "EPSG:2154",
                            outputFormat:"text/javascript",
                            bbox: (x-0.5)+","+(y-0.5)+","+(x+0.5)+","+(y+0.5)                                              
                        },
                        dataType: "jsonp",
                        contentType: "application/json",
                        jsonp: false,
                        jsonpCallback: "parseResponse",        
                        success: function (data) {                            
                            if (data.features && data.features.length > 0) {                    
                               _parseJsonFeature(data.features);
                            }
                        },                        
                        error: function () {  //fixme Ne fonctionne pas avec jsonp               
                            $.event.trigger({
                                type: "gertrude-error",
                                message: "Récupération cadastrale en erreur!",                    
                                time: new Date()
                            });
                        }
                     });
                }
            },
            error: function () { //fixme Ne fonctionne pas avec jsonp               
                $.event.trigger({
                    type: "gertrude-error",
                    message: "Récupération cadastrale en erreur!",                    
                    time: new Date()
                });
            }
        });
    };

    
    /*
     * Public
     */

    return {

        /**
         * Public Method: init
         *
         */

        init: function () {           
            
            _l93 = ol.proj.get('EPSG:2154');
            _l93.setExtent([-378305.81, 6093283.21, 1212610.74, 7186901.68]);
            
            _sourcePoly = new ol.source.Vector({projection: _projection});
            _sourcePoly = new ol.source.Vector();
            
            $('.sidebar-left .slide-submenu').on('click',function() {
              var thisEl = $(this);
              thisEl.closest('.sidebar-body').fadeOut('slide',function(){
                $('.mini-submenu-left').fadeIn();
                _applyMargins();
              });
            });

            $('.mini-submenu-left').on('click',function() {
              var thisEl = $(this);
              $('.sidebar-left .sidebar-body').toggle('slide');
              thisEl.hide();
              _applyMargins();
            });

            $(window).on("resize", _applyMargins);
            
            // Carto
            _projection = ol.proj.get("EPSG:3857");            
            var projectionExtent = _projection.getExtent();
            var size = ol.extent.getWidth(projectionExtent) / 256; 
            _WMTSTileMatrix = {'EPSG:3857': [], 'PM':[]};
            _WMTSTileResolutions = {'EPSG:3857': [], 'PM':[]};
            for (var z = 0; z < 22; ++z) {
                    // generate resolutions and matrixIds arrays for this Geobretagne WMTS
                    _WMTSTileResolutions['EPSG:3857'][z] = size / Math.pow(2, z);
                    _WMTSTileMatrix['EPSG:3857'][z] = 'EPSG:3857:' + z;
            }
             for (var z = 0; z < 20; ++z) {
                    // generate resolutions and matrixIds arrays for this Geobretagne WMTS
                    _WMTSTileResolutions['PM'][z] = size / Math.pow(2, z);
                    _WMTSTileMatrix['PM'][z] = z;
            }          
                                       
            var matrixset = 'PM';     
                                       
            var ortho = new ol.layer.Tile({
              visible: false,
              source: new ol.source.WMTS({
                url:  "http://kartenn.region-bretagne.fr/wmts",
                layer: "ORTHOIMAGERY.ORTHOPHOTOS",
                matrixSet: matrixset,
                style: "normal",
                format: "image/jpeg",
                attributions: [new ol.Attribution({html:"<a href='http://www.geoportail.fr/' target='_blank'><img src='http://api.ign.fr/geoportail/api/js/latest/theme/geoportal/img/logo_gp.gif'></a>"})],
                projection: _projection,
                tileGrid: new ol.tilegrid.WMTS({
                  origin: ol.extent.getTopLeft(projectionExtent),
                  resolutions: _WMTSTileResolutions[matrixset],
                  matrixIds: _WMTSTileMatrix[matrixset]
                })
              })
            }); 

            var scan = new ol.layer.Tile({
              visible: false,
              source: new ol.source.WMTS({
                url:  "http://kartenn.region-bretagne.fr/wmts",
                layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
                matrixSet: matrixset,
                style: "normal",
                format: "image/jpeg",
                attributions: [new ol.Attribution({html:"<a href='http://www.geoportail.fr/' target='_blank'><img src='http://api.ign.fr/geoportail/api/js/latest/theme/geoportal/img/logo_gp.gif'></a>"})],
                projection: _projection,
                tileGrid: new ol.tilegrid.WMTS({
                  origin: ol.extent.getTopLeft(projectionExtent),
                  resolutions: _WMTSTileResolutions[matrixset],
                  matrixIds: _WMTSTileMatrix[matrixset]
                })
              })
            });

            var cadastre = new ol.layer.Tile({
              visible: false,
              source: new ol.source.WMTS({
                url:  "http://kartenn.region-bretagne.fr/wmts",
                layer: "CADASTRALPARCELS.PARCELS",
                matrixSet: matrixset,
                style: "bdparcellaire",
                format: "image/png",
                attributions: [new ol.Attribution({html:"<a href='http://www.geoportail.fr/' target='_blank'><img src='http://api.ign.fr/geoportail/api/js/latest/theme/geoportal/img/logo_gp.gif'></a>"})],
                projection: _projection,
                tileGrid: new ol.tilegrid.WMTS({
                  origin: ol.extent.getTopLeft(projectionExtent),
                  resolutions: _WMTSTileResolutions[matrixset],
                  matrixIds: _WMTSTileMatrix[matrixset]
                })
              })
            });  

            //
            
            _layers = [                
                  new ol.layer.Tile({
                    style: 'Road',                    
                    source: new ol.source.MapQuest({layer: 'osm'})
                  }),
                  ortho,
                  scan,
                  cadastre
            ];
                        
            _vectorPoint = new ol.layer.Vector({
              source: _sourcePoint,
              style: new ol.style.Style({                
                image: new ol.style.Circle({
                  radius: 7,
                  fill: new ol.style.Fill({
                    color: '#ffffff'
                  }),
                  stroke: new ol.style.Stroke({
                  color: '#0099FF',
                  width: 2
                })
                })
              })
            });
            
            _vectorPoly = new ol.layer.Vector({
              source: _sourcePoly,
              style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                  color: '#0099FF',
                  width: 1
                }),
                fill: new ol.style.Fill({
                  color: 'rgba(0, 153, 255, 0.2)'
                })
              })
            });
            
            

            _map = new ol.Map({
              target: "map",
              controls: ol.control.defaults().extend([
                new ol.control.FullScreen()
              ]),
              layers: _layers,
              view: new ol.View({
                projection: _projection,
                center: _center,
                zoom: _zoom
              })
            });
            
            _map.addLayer(_vectorPoly);
            _map.addLayer(_vectorPoint);
            _applyInitialUIState();
            _applyMargins();
            
            _sourcePoint.on('addfeature', function(event) {
                //delete all others features
                var oldfeature = null;                
                _sourcePoint.forEachFeature(function(feature) {
                    if (feature != event.feature) {
                        oldfeature = feature;
                    }
                });
                if (oldfeature) {_sourcePoint.removeFeature(oldfeature);}
                var pos=event.feature.getGeometry().getCoordinates();                
                var p = ol.proj.transform(pos,_projection,_l93);
                _getCadastreGeometry(p[0],p[1]);
            });
            
            var _geolocation = new ol.Geolocation({
              projection: _projection
            });

            var track = new ol.dom.Input(document.getElementById('track'));
            track.bindTo('checked', _geolocation, 'tracking');
            
            _geolocation.on('change', function() {
                  console.log(_geolocation.getAccuracy() + ' [m]');
                  console.log(_geolocation.getAltitude() + ' [m]');
                  console.log(_geolocation.getAltitudeAccuracy() + ' [m]');
                  console.log(_geolocation.getHeading() + ' [rad]');
                  console.log(_geolocation.getSpeed() + ' [m/s]');
                });

                // handle geolocation error.
            _geolocation.on('error', function(error) {                  
                  console.log(error.message);
                });
                
            var accuracyFeature = new ol.Feature();
            accuracyFeature.bindTo('geometry', _geolocation, 'accuracyGeometry');

            var positionFeature = new ol.Feature();
            positionFeature.bindTo('geometry', _geolocation, 'position')
                .transform(function() {}, function(coordinates) {
                  return coordinates ? new ol.geom.Point(coordinates) : null;
                });

            var featuresOverlay = new ol.FeatureOverlay({
              map: _map,
              features: [accuracyFeature, positionFeature]
            });
            
            $("#search").typeahead(
                {onSelect: function(item) {                    
                    var p = item.value.split(",");
                    var pt = [parseFloat(p[0]),parseFloat(p[1])];
                    var projpt= ol.proj.transform(pt, 'EPSG:4326', 'EPSG:3857');
                    console.log(projpt);
                    inventaire.zoomToLocation(projpt, 14);
                }});
            
            $(document).on("keypress", "#search", function (e) {
                if ($(this).val().length >= 2) {
                    inventaire.geoCompletion($(this).val() + String.fromCharCode(e.charCode));
                }
            });
        },
        
        addInteraction : function () {
          _sourcePoint.clear();
          _sourcePoly.clear();
          _draw = new ol.interaction.Draw({
              source: _sourcePoint,
              type: 'Point'
            });
            _map.addInteraction(_draw);
          
        },
        
        removeInteraction : function () {
            //_sourcePoint.clear();
            //_sourcePoly.clear();
            _map.removeInteraction(_draw);
        },
        /**
         * Public Method: layerChange
         *
         */

        layerChange: function (id) {
            var i, ii
             for (i = 0, ii = _layers.length; i < ii; ++i) {
                _layers[i].set('visible', (i == id));
            }
        },
        
        zoomToLocation: function (point, zoom) {
            _map.getView().setCenter(point);
            _map.getView().setZoom(zoom);
        },
        
        /**
         * Public Method: zoomToCoordinates
         *
         * parameter coordinates - [array]
         * [Lon, lat] for a point or [xmin, ymin, xmax, ymax] for bbox         
         */
        
        zoomToCoordinates: function (coordinates) {
            if (coordinates instanceof Array) {
                switch(coordinates.length) {
                    case 2:
                        // zoom to point
                        _map.getView().setCenter(ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857'));
                        _map.getView().setZoom(15);
                        break;
                    case 4:
                        // zoom to bbox
                        _map.getView().fitExtent(ol.proj.transformExtent(coordinates, 'EPSG:4326', 'EPSG:3857'), _map.getSize());
                        break;                   
                }
            }            
        },
        
        render: function () {
            _map.render();
        },
        
        renderSync: function () {
            _map.renderSync();
        },
        
        geoCompletion: function (val) {
            var url = "http://api.geonames.org/searchJSON?";
            var q = (val)?val:$("#search").val();            
            $.ajax({
                    type: "GET",
                    url: url,
                    crossDomain: true,
                    data: {
                        username: "georchestra",
                        country:"FR",
                        style:"short",
                        lang:"fr",
                        featureClass:"P",
                        maxRows:20,
                        name_startsWith:val,
                        callback:"stcCallback1001"                        
                    },
                    dataType: "jsonp",
                    success: function (data) {                        
                        var a = $("#search").typeahead();
                        var src = [];
                        for (var i = 0; i<data.geonames.length; i++) {
                            var obj = {id:data.geonames[i].lng + "," + data.geonames[i].lat,name:data.geonames[i].name};
                            src.push(obj);
                            
                        }
                        a.data('typeahead').source = src;
                        $( "#search" ).focus();
                        $( "#search" ).trigger( "keyup" );
                    }
                });         
            
        }
    
    }; // Fin return 
 })();
