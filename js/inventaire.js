 inventaire = (function () {
    /*
     * Private
     */
    var _proxy ="";
    
    var _map = null;
    
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
            
            _layers = [                
                  new ol.layer.Tile({
                    style: 'Road',                    
                    source: new ol.source.MapQuest({layer: 'osm'})
                  }),
                  new ol.layer.Tile({
                    style: 'Aerial',                    
                    visible: false,
                    source: new ol.source.MapQuest({layer: 'sat'})
                  })
            ];

            _map = new ol.Map({
              target: "map",
              layers: _layers,
              view: new ol.View({
                center: _center,
                zoom: _zoom
              })
            });
            _applyInitialUIState();
            _applyMargins();
        },
        /**
         * Public Method: test2
         *
         */

        layerChange: function (id) {
            var i, ii
             for (i = 0, ii = _layers.length; i < ii; ++i) {
                _layers[i].set('visible', (i == id));
            }
        }
    
    }; // Fin return 
 })();
