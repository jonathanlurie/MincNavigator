

var VectorTools = function(){


}

/*
  performs a cross product between v1 and v2.
  args:
    v1: Array[3] - vector #1
    v2: Array[3] - vector #2
    normalize: boolean - normalize the output vector when true

  return:
    Array[3] - the vctor result of the cross product
*/
VectorTools.prototype.crossProduct = function(v1, v2, normalize){

  normalVector = [
      v1[1] * v2[2] - v1[2] * v2[1],
      (v1[0] * v2[2] - v1[2] * v2[0] ) * (-1),
      v1[0] * v2[1] - v1[1] * v2[0]
  ];

  if(normalize)
      normalVector = this.normalize(normalVector);

  return normalVector;
}


/*
  Return a normalized vector from v (does not replace v).
  args:
    v: Array[3] - vector to normalize

  return:
    Array[3] - a normalized vector
*/
VectorTools.prototype.normalize = function(v){
  var n = this.getNorm(v);
  var normalizedV = [v[0]/n, v[1]/n, v[2]/n];
  return normalizedV;
}


/*
  return the norm (length) of a vector [x, y, z]
*/
VectorTools.prototype.getNorm = function(v){
  return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
}


/*
  Build a 3-member system for each x, y and z so that we can
  make some calculus about a 3D affine line into a 3D space.
  x = l + alpha * t
  y = m + beta * t
  z = n + gamma * t
  (the parametric variable is t)
  returns a tuple of tuple:
  ( (l, alpha), (m, beta), (n, gamma) )
*/
VectorTools.prototype.affine3DFromVectorAndPoint = function(V, point){
  var xTuple = [point[0] , V[0]];
  var yTuple = [point[1] , V[1]];
  var zTuple = [point[2] , V[2]];

  return [xTuple, yTuple, zTuple];

}


// export as a module in case of use with nodejs
if(typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = VectorTools;
