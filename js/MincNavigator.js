/*
  Author: Jonathan Lurie
  Institution: McGill University, Montreal Neurological Institute - MCIN
  Date: started on Jully 2016
  email: lurie.jo@gmail.com
  License: MIT

  Requirements:
    Having a div named "navigatorDiv" for placing the VolumeNavigator


*/

var MincNavigator = function(mincBuffer){

  // loaded file, filled with voxels
  this._mincVolume = readMincBuffer(mincBuffer);

  // A sliceEngine is a combo of the necessary objects to create an oblique slice
  // and display it somewhere.
  this._sliceEngines = {};

  // the 3D cube widget for navigating in the dataset
  this._volumeNavigator = null;

  // this will be reajusted
  this._optimalSamplingFactor = 1;

  // the bit depth factor is used to restrict the final image to [0, 255]
  // if data are [0, 65535], then this._bitDepthFactor should be 1/256
  this._bitDepthFactor = 1;

  // list of DOM element names to place elements
  this.navigatorDomName = "navigatorDiv";

  this.init();

}


/*
  initialize few object and all the sliceEngines
*/
MincNavigator.prototype.init = function(){
  this.initVolumeNavigator();

  // add the regular sliceEngines
  this.addSliceEngine("ObliqueMain", true);
  this.addSliceEngine("ObliqueOrthoU", false);
  this.addSliceEngine("ObliqueOrthoV", false);

  this.findOptimalPreviewSamplingFactor();

  this.updateFullResImages();
}


/*
  Set the bit depth factor manually if the original data does not match
  a [0, 255] interval.
  ie. if data are [0, 65535], then the factor should be (1/256)
*/
MincNavigator.prototype.setBitDepthFactor = function(f){
  this._bitDepthFactor = f;
}


/*
  Initialize the volume navigator and its callbacks
*/
MincNavigator.prototype.initVolumeNavigator = function(){
  var dimensionInfo = this._mincVolume.getDimensionInfo();

  // the outer box size
  var outerBoxOptions = {
      xSize: dimensionInfo[0].space_length,
      ySize: dimensionInfo[1].space_length,
      zSize: dimensionInfo[2].space_length
  }

  // creating a VolumeNavigator instance
  this._volumeNavigator = new VolumeNavigator(
    outerBoxOptions,
    null,
    this.navigatorDomName
  );

  // optional: this callback is called when a slider is moving (mouse down)
  this._volumeNavigator.setOnChangeCallback(this.onChangeCallback.bind(this));

  // optional: this callback is called when a slider is released (mouse up)
  this._volumeNavigator.setOnFinishChangeCallback(this.onChangeDoneCallback.bind(this));

  // optional: add a button at the bottom of dat.gui with its associated callback.
  // originally for caching the current slice.
  //this._volumeNavigator.buildGuiButton("Cache current slice", cacheSlice);
}



/*
  Callback sent to VolumeNavigator, when the cursor is moving (but not released)
*/
MincNavigator.prototype.onChangeCallback = function(){
  this.updateLowResImages();
}



/*
  Callback sent to VolumeNavigator, when the cursor is released
*/
MincNavigator.prototype.onChangeDoneCallback = function(){
  this.updateFullResImages();
}


/*
  Add a sliceEngine to the list.
  Args:
    name: String - identifier of the slice Engine, must be unique
    mapping3D: boolean - If true, texture maps the image on the VolumeNavigator
*/
MincNavigator.prototype.addSliceEngine = function(name, mapping3D){

  var sliceEngine = {
    plane: new Plane(),
    sampler: null, // init just afterwards
    canvasID: name + "_canvas",
    mapping3D: mapping3D
  };

  sliceEngine.sampler = new ObliqueSampler(this._mincVolume, sliceEngine.plane);
  sliceEngine.sampler.update();

  this._sliceEngines[name] = sliceEngine;

}


/*
  Find the best downsampling factor.
  This factor could have been guest for every sliceEngine(s).sampler
  but since they are all using the same minc data, we would have the same factor,
  so, saving time here.
*/
MincNavigator.prototype.findOptimalPreviewSamplingFactor = function(){
  var sliceEngine = this._sliceEngines["ObliqueMain"];

  sliceEngine.plane.makeFromOnePointAndNormalVector(
    this._volumeNavigator.getPlanePoint(),
    this._volumeNavigator.getPlaneNormal()
  );



  sliceEngine.sampler.update();

  sliceEngine.sampler.findOptimalPreviewFactor();

  this._optimalSamplingFactor = sliceEngine.sampler.getOptimalPreviewSamplingFactor();
}


/*
  Does the necessary to perform an oblique image using a normal vector
  and a point to create a plane. Then displays this image in the canvas.
  Args:
    name: String - ID of the slice within this._sliceEngines
    normalVector: Array [x, y, z] - normal vector for building a plane (normalized)
    point: Array [x, y, z] - point to build the VectorTools
    fullRes: bool - If true, creates a full res image, if false creates a low res

*/
MincNavigator.prototype.updateSliceEngine = function(name, normalVector, point, fullRes){

  var sliceEngine = this._sliceEngines[name];

  // update the plane
  sliceEngine.plane.makeFromOnePointAndNormalVector(
    point,
    normalVector

  );

  if(fullRes){
    // set the sampling factor at full res (=1)
    sliceEngine.sampler.setSamplingFactor(1);
  }else{
    sliceEngine.sampler.setSamplingFactor(this._optimalSamplingFactor);
  }

  // ask the sampler to update its info from the plane
  sliceEngine.sampler.update();

  // Start the sampling process (no interpolation)
  sliceEngine.sampler.startSampling(false);

  var imageData = sliceEngine.sampler.exportForCanvas(this._bitDepthFactor);
  this.loadImageDataIntoCanvas(imageData, sliceEngine.canvasID);

  /*
  // TODO: make it more generic so that any slice could be mapped on its polygon,
  // this means we have to update VolumeNavigator so that it can do so.
  // map the image on the volume
  if(sliceEngine.mapping3D){
    this.prepareVerticeForMapping(
      sliceEngine.sampler.getVerticeMatchList() // TODO replace by just the ID
    );
  }
  */

}






/*
  Loads image content into a canvas
*/
MincNavigator.prototype.loadImageDataIntoCanvas = function(imgData, canvasID){
  // the imgData could be null, ie. when the plane does not
  // intersect the volume
  if(!imgData)
    return;

  //var canvas = document.createElement("canvas");
  var canvas = document.getElementById(canvasID);
  var context = canvas.getContext("2d");

  canvas.width = imgData.width;
  canvas.height = imgData.height;

  context.fillStyle = "#00ff00";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.putImageData(imgData, 0, 0);
}


/*
  TODO
*/
MincNavigator.prototype.prepareVerticeForMapping = function(name){
  var sliceEngine = this._sliceEngines[name]

  var verticeMatchList = sliceEngine.sampler.getVerticeMatchList();


  if(!verticeMatchList)
    return;

  var volNavList = this._volumeNavigator.getPlanePolygon();
  var numOfVertice = volNavList.length;
  // Note: verticeMatchList._3D is supposed to contain the same as volNavList
  // but not in the same order. Though we cannot expect to compare (==) them
  // to one another with a floating point precision. We'll have to use a
  // root mean square as an indicator of "closeness".
  // The goal being to reorder verticeMatchList so that its values are in the
  // same order as in volNavList.

  // the index of matchTable is the index of volNavList
  // while the value is the index in verticeMatchList
  var matchTable = [];

  // This runs in O(n²), sorry about that... (hopefully this polygon has 6 vertice max)

  // finding who is who
  for(var ref=0; ref<numOfVertice; ref++){

    var matchFound = 0;
    var bestScore = 1000; //  the lowest wins

    for(var challenger=0; challenger<numOfVertice; challenger++){

      var currentScore =
        Math.abs(volNavList[ref][0] - verticeMatchList[challenger]._3D[0]) +
        Math.abs(volNavList[ref][1] - verticeMatchList[challenger]._3D[1]) +
        Math.abs(volNavList[ref][2] - verticeMatchList[challenger]._3D[2]);

      if(currentScore < bestScore){
        bestScore = currentScore;
        matchFound = challenger;
      }
    }
    matchTable.push(matchFound);
  }

  // reordering the verticeMatchList
  var new_verticeMatchList = [];
  for(var v=0; v<numOfVertice; v++){
    new_verticeMatchList.push( verticeMatchList[matchTable[v]] );
  }

  // the image is a square
  var squareSide = sliceEngine.sampler.getLargestSide();

  // conversion from 2D image coordinate convention to ThreeJS texture coordinate conventions
  // (1: origin is top-left in pixel dimensions. 2: origin is bottom left in percentage)
  var textureCoords = []
  for(var v=0; v<numOfVertice; v++){
    var imageCoords = new_verticeMatchList[v]._2D;
    var percentCoord = [
      imageCoords[0] / squareSide,
      1 - (imageCoords[1] / squareSide)
    ];

    textureCoords.push(percentCoord);
  }

  //console.log(textureCoords);

  // sending the mapping coordinates
  this._volumeNavigator.mapTextureFromCanvas(this._sliceEngines[name].canvasID, textureCoords);
}



/*
  Updates all the image that are supposed to be updated at full res
*/
MincNavigator.prototype.updateFullResImages = function(){

  // the main oblique
  this.updateSliceEngine(
    "ObliqueMain",
    this._volumeNavigator.getPlaneNormal(),
    this._volumeNavigator.getPlanePoint(),
    true
  );

  // the ortho in U oblique
  this.updateSliceEngine(
    "ObliqueOrthoU",
    this._volumeNavigator.getGimbalNormalVectorArr(1),
    this._volumeNavigator.getPlanePoint(),
    true
  );

  // the ortho in V oblique
  this.updateSliceEngine(
    "ObliqueOrthoV",
    this._volumeNavigator.getGimbalNormalVectorArr(0),
    this._volumeNavigator.getPlanePoint(),
    true
  );


  this.prepareVerticeForMapping("ObliqueMain");



}


/*
  updates only the images that are supposed to be updated at low res
*/
MincNavigator.prototype.updateLowResImages = function(){

  // the main oblique
  this.updateSliceEngine(
    "ObliqueMain",
    this._volumeNavigator.getPlaneNormal(),
    this._volumeNavigator.getPlanePoint(),
    false
  );

  this.prepareVerticeForMapping("ObliqueMain");

}
