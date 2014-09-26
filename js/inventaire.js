 inventaire = (function () {
    /*
     * Private
     */
    var _proxy ="";
    
    var _map = null;
    
    var _vector = null;
    
    var _source = new ol.source.Vector();
    
    var draw = null;
    
    var _projection = null;
    
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

    
    /*
     * Public
     */

    return {

        /**
         * Public Method: init
         *
         */

        init: function () {
        
            Proj4js.defs["EPSG:3857"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
            Proj4js.defs["EPSG:2154"] = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
            Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
            
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
                url:  "../wmts",
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
                url:  "../wmts",
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
                url:  "../wmts",
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
                        
            _vector = new ol.layer.Vector({
              source: _source,
              style: new ol.style.Style({
                fill: new ol.style.Fill({
                  color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                  color: '#ffcc33',
                  width: 2
                }),
                image: new ol.style.Circle({
                  radius: 7,
                  fill: new ol.style.Fill({
                    color: '#ffcc33'
                  })
                })
              })
            });

            _map = new ol.Map({
              target: "map",
              layers: _layers,
              view: new ol.View({
                projection: _projection,
                center: _center,
                zoom: _zoom
              })
            });
            
            _map.addLayer(_vector);
            _applyInitialUIState();
            _applyMargins();
            
            _source.on('addfeature', function(event) {
                var pos=event.feature.getGeometry().getCoordinates();
                var src = new Proj4js.Proj('EPSG:3857');
                var dest = new Proj4js.Proj('EPSG:2154'); 
                var p = new Proj4js.Point(pos[0],pos[1]);  
                Proj4js.transform(src, dest, p);               
                $("#fichelabel").text("Position : " + p);
                $('#fiche').modal('show');                
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
          _draw = new ol.interaction.Draw({
              source: _source,
              type: 'Point'
            });
            _map.addInteraction(_draw);
          
        },
        
        removeInteraction : function () {
            _source.clear();
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
