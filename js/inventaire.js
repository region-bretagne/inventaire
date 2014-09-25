 inventaire = (function () {
    /*
     * Private
     */
    var _proxy ="";
    
    var _map = null;
    
    var _projection = null;
    
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

            _map = new ol.Map({
              target: "map",
              layers: _layers,
              view: new ol.View({
                projection: _projection,
                center: _center,
                zoom: _zoom
              })
            });
            _applyInitialUIState();
            _applyMargins();
            
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
