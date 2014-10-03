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

    var _getGeometryBuilding = function (x,y) {
         _sourcePoly.clear();         
        var postdata = ['<wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" service="WFS"',
            'version="1.1.0" outputFormat="json" xsi:schemaLocation="http://www.opengis.net/wfs',
            'http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd"',
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
            '<wfs:Query typeName="cadastre:CP.CadastralBuilding" srsName="EPSG:2154"',
            'xmlns:feature="http://geobretagne.fr/ns/cadastre">',
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">',
            '<ogc:Contains><ogc:PropertyName>geometry</ogc:PropertyName>',
            '<gml:MultiPoint srsName="http://www.opengis.net/gml/srs/epsg.xml#2154"',
            'xmlns:gml="http://www.opengis.net/gml"><gml:pointMember><gml:Point>',
            '<gml:coordinates decimal="." cs="," ts=" ">'+x+','+y+'</gml:coordinates>',
            '</gml:Point></gml:pointMember></gml:MultiPoint></ogc:Contains></ogc:Filter>',
            '</wfs:Query></wfs:GetFeature>'].join(' ');            
            
        $.ajax({
            type: 'POST',
            url:'../cadastre?',
            contentType: 'application/xml',
            data: postdata,            
            success: function (data) {
                if (data.features && data.features.length > 0) {                    
                     var l93_features = new ol.format.GeoJSON().readFeatures(data.features[0]);
                     var json_output = new ol.format.GeoJSON().writeGeometry(l93_features[0].getGeometry());
                     console.log("geojson",json_output);
                     var features = new ol.format.GeoJSON().readFeatures(data.features[0],{dataProjection: _l93, featureProjection: _projection});
                     _sourcePoly.addFeatures(features);                     
                     $('#fiche').modal('show');               
                }
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
        
            /*Proj4js.defs["EPSG:3857"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";
            Proj4js.defs["EPSG:2154"] = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
            Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";*/
            
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
                        
            _vectorPoint = new ol.layer.Vector({
              source: _sourcePoint,
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
                    color: 'red'
                  })
                })
              })
            });
            
            _vectorPoly = new ol.layer.Vector({
              source: _sourcePoly,
              style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                  color: 'red',
                  width: 1
                }),
                fill: new ol.style.Fill({
                  color: 'rgba(255, 255, 0, 0.5)'
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
                /*var src = new Proj4js.Proj('EPSG:3857');
                var dest = new Proj4js.Proj('EPSG:2154'); 
                var p = new Proj4js.Point(pos[0],pos[1]);                
                Proj4js.transform(src, dest, p);*/
                var p = ol.proj.transform(pos,_projection,_l93);
                _getGeometryBuilding(p[0],p[1]);  
                $("#fichelabel").text("Position : " + p);
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
              source: _sourcePoint,
              type: 'Point'
            });
            _map.addInteraction(_draw);
          
        },
        
        removeInteraction : function () {
            _sourcePoint.clear();
            _sourcePoly.clear();
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
