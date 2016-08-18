    //console.log = function() {};
    //console.warn = function() {};

    var mincNavigator = null;

      /*
        the buffer is supposed to be an hdf5
      */
      function openMinc2(buffer){
          mincNavigator = new MincNavigator(buffer);
          onFileLoaded();
      }


      /*
        Callback at file opening
      */
      function handleFileSelect(evt) {
        // dealing with splashcreen
        $(".splashcreen .splashContent .openfile").hide();
        $(".splashcreen .splashContent .isLoading").show();

          var files = evt.target.files; // FileList object

          // if a file is in the list, open it (only the first)
          if(files.length){
            var reader = new FileReader();

            reader.onloadend = function(event) {
                var result = event.target.result;
                openMinc2(result);
            }

            reader.onerror = function() {
                var error_message = "error reading file: " + filename;
                throw new Error(error_message);
            };

            reader.readAsArrayBuffer(files[0]);
          }
      }


      /*
        element is a jquery obj, in this case a canvas.
        It makes this element dragable and zoomable, still it does not
        show out of its parent borders (most likely a div).
        This is done playing with css.
      */
      function addZoomingAndPanning(element){
        element.draggable();

        var scale = 1.;
        var zoomFactor = 1.05;

        element.css("transform", "scale(" + scale + ")");

        element.bind('mousewheel DOMMouseScroll', function(event){

          var parentWidth = element.parent().width();
          var parentHeight = element.parent().height();

          // getting the (css) left offset
          var left = element.css("left");
          if(typeof left == "undefined"){
            left = 0;
          }else{
            // removing the ending "px"
            left = parseFloat(left.slice(0, -2));
          }

          // getting the (css) top offset
          var top = element.css("top");
          if(typeof top == "undefined"){
            top = 0;
          }else{
            // removing the ending "px"
            top = parseFloat(top.slice(0, -2));
          }

          var adjustLeft = 0;
          var adjustTop = 0;

          // scrolling up
          if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            scale *= zoomFactor;
            element.css("transform", "scale(" + scale + ")");

            adjustLeft = left * zoomFactor;
            adjustTop = top*zoomFactor +  ((zoomFactor - 1) * parentHeight) / 2;

          }
          // scrolling down
          else {
            scale /= zoomFactor;

            element.css("transform", "scale(" + scale + ")");

            adjustLeft = left / zoomFactor;
            adjustTop = top/zoomFactor -  ((zoomFactor - 1) * parentHeight) / 2;
          }
          // adjust the top and left offset
          element.css("left" , adjustLeft + "px");
          element.css("top" , adjustTop + "px");
        });
      }


      /*
        Place the element (jquery obj, most likely a canvas) at the center
        of the parent (most likely a div).
        This is done playing with css.
      */
      function centerCanvas(element){
        var parentWidth = element.parent().width();
        var parentHeight = element.parent().height();
        var elemWidth = element.width();
        var elemHeight = element.height();
        var offsetLeft = (elemWidth) / 2;
        var offssetTop = (elemHeight - parentHeight) / 2;

        //element.css("left" , offsetLeft + "px");
        element.css("top" , -offssetTop + "px");
      }


      /*
        DOM is ready, lets do some stuff!
      */
    	window.onload = function(){
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
            document.getElementById('fileOpener').addEventListener('change', handleFileSelect, false);
        } else {
            console.log('The File APIs are not fully supported in this browser.');
        }

        // adding the zooming and panning to the canvas.
        // No need to have the files loaded for that...
        addZoomingAndPanning($("#ObliqueMain_canvas"));
        addZoomingAndPanning($("#ObliqueOrthoU_canvas"));
        addZoomingAndPanning($("#ObliqueOrthoV_canvas"));

      }


      function initObliqueControls(){
        $("#nw .obliqueControls .arrowUp").click(function(){
          var factor = parseFloat($("#nw .obliqueControls input").val());
          mincNavigator.getVolumeNavigator().moveAlongNormal(factor);
        });

        $("#nw .obliqueControls .arrowDown").click(function(){
          var factor = parseFloat($("#nw .obliqueControls input").val()) * -1;
          mincNavigator.getVolumeNavigator().moveAlongNormal(factor);
        });


        $("#sw .obliqueControls .arrowUp").click(function(){
          var factor = parseFloat($("#sw .obliqueControls input").val());
          mincNavigator.getVolumeNavigator().moveAlongOrthoU(factor);
        });

        $("#sw .obliqueControls .arrowDown").click(function(){
          var factor = parseFloat($("#sw .obliqueControls input").val()) * -1;
          mincNavigator.getVolumeNavigator().moveAlongOrthoU(factor);
        });


        $("#se .obliqueControls .arrowUp").click(function(){
          var factor = parseFloat($("#se .obliqueControls input").val());
          mincNavigator.getVolumeNavigator().moveAlongOrthoV(factor);
        });

        $("#se .obliqueControls .arrowDown").click(function(){
          var factor = parseFloat($("#se .obliqueControls input").val()) * -1;
          mincNavigator.getVolumeNavigator().moveAlongOrthoV(factor);
        });

      }


      /*
        used as a callback when the gimbal changes position or orientation.
        See MincNavigator.callbackReadGimbalInfo for more.
      */
      function displayGimbalInfo(center, normal){
        $("#centerX").val(Math.round(center[0]*100) / 100);
        $("#centerY").val(Math.round(center[1]*100) / 100);
        $("#centerZ").val(Math.round(center[2]*100) / 100);

        $("#normalX").val(Math.round(normal[0]*10000) / 10000);
        $("#normalY").val(Math.round(normal[1]*10000) / 10000);
        $("#normalZ").val(Math.round(normal[2]*10000) / 10000);
      }



      /*
        Set the
      */
      function setGimbalInfo(){

        console.log($("#normalX").val());

        mincNavigator.setPlaneNormalAndPoint(
          [
            parseFloat($("#normalX").val()),
            parseFloat($("#normalY").val()),
            parseFloat($("#normalZ").val())
          ],
          [
            parseFloat($("#centerX").val()),
            parseFloat($("#centerY").val()),
            parseFloat($("#centerZ").val())
          ]
        );
      }

      /*
        called when the file is loaded
      */
      function onFileLoaded(){
        centerCanvas($("#ObliqueMain_canvas"));
        centerCanvas($("#ObliqueOrthoU_canvas"));
        centerCanvas($("#ObliqueOrthoV_canvas"));

        // Toggle gimbal button
        $("#toggleGimbalBt").click(function(){
          mincNavigator.getVolumeNavigator().AxisArrowHelperToggle();
        });

        // the bubble buttons to chqnge slices
        initObliqueControls();

        // wiring the red gimbal info callback
        mincNavigator.setCallbackReadGimbalInfo(displayGimbalInfo);

        // refresh some text fields
        // (this is just about calling displayGimbalInfo here)
        mincNavigator.sendGimbalInfo();


        // Toggle gimbal button
        $("#updateGimbalBt").click(function(){
          setGimbalInfo();
        });

        // when everything is ready, we fade out the splashscreen to show the actuall app
        $(".splashcreen").fadeOut();
      }
