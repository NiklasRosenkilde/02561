
var gl;
var canvas;
var program;

var points  = [ ];
var normals = [ ];
var colors  = [ ];

// VIEW PARAMETERS ////////////////////////////////////////////////////////////
var theta = 0;

var aspect;

var left = -1.0,
  right = 1.0,
  ytop = 1.0,
  bottom = -1.0;

var
  near = 0.1,
  far = 10 ,
  radius =  5,
  phi = 3.14;

// Field-of-view in Y direction angle (in degrees)
var  fovy = 60.0;  

// View vectors
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(radius * Math.sin(phi), radius * Math.sin(theta), radius * Math.cos(phi));

var modelViewMatrix = lookAt(eye, at, up);
var projectionMatrix = perspective(fovy, 1.0, near, far);


// View matrices
var modelViewLoc, texMatrixLoc, viewVectorLoc, isReflectiveLoc, normalLoc, texMapLoc; 


// GEOMETRY PARAMETERS ////////////////////////////////////////////////////////
var numTimesToSubdivide = 4;
var index = 0;

// Tetrahedron vertices
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

// Background vertices
var backgroundQuad = [
  vec4(-1.0, -1.0, 0.999,1.0),
  vec4( 1.0, -1.0, 0.999,1.0),
  vec4( 1.0,  1.0, 0.999,1.0),
  vec4(-1.0, -1.0, 0.999,1.0),
  vec4( 1.0,  1.0, 0.999,1.0),
  vec4(-1.0,  1.0, 0.999,1.0)
];

// MAIN FUNCTION ////////////////////////////////////////////////////////////
window.onload = function init() {

  initScene();

  modelViewLoc  = gl.getUniformLocation(program, "modelViewMatrix");     
  texMatrixLoc = gl.getUniformLocation(program, 'textureMatrix');       

  viewVectorLoc = gl.getUniformLocation(program, 'viewVector');       
  isReflectiveLoc  = gl.getUniformLocation(program, "isReflective");    
  normalLoc  = gl.getUniformLocation(program, "samplerNormal");    
  texMapLoc  = gl.getUniformLocation(program, "texMap");    
  redraw();

  initCubeTexture();
  initBumpTexture();

  render();
}

////////////////////// REDRAW FUNCTION /////////////////////////////////////
function redraw(){  
  backgroundQuad.forEach(e => { points.push(e) });
  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
}

////////////////////// RENDER FUNCTION /////////////////////////////////////
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vertex_position = gl.getAttribLocation(program, "vertex_position");
    gl.vertexAttribPointer(vertex_position, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_position);

    gl.uniform3fv(viewVectorLoc, flatten(eye));

    // Drawing of background plane
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(texMatrixLoc, false, flatten(mult(inverse4(modelViewMatrix), inverse4(projectionMatrix))));
    gl.uniform1i(isReflectiveLoc, false);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Drawing sphere
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mult(projectionMatrix, modelViewMatrix)));
    gl.uniformMatrix4fv(texMatrixLoc, false, flatten(mat4()));
    gl.uniform1i(isReflectiveLoc, true);
    gl.drawArrays(gl.TRIANGLES, 6, points.length - 6);
    
    requestAnimFrame(render);

}

////////////////////// CUBE TEXTURE FUNCTIONS ///////////////////////////////

function initCubeTexture() {

  var cubemap = [
    'textures/cm_left.png', // POSITIVE_X
    'textures/cm_right.png', // NEGATIVE_X
    'textures/cm_top.png', // POSITIVE_Y
    'textures/cm_bottom.png', // NEGATIVE_Y
    'textures/cm_back.png', // POSITIVE_Z
    'textures/cm_front.png']; // NEGATIVE_Z

  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);


  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.uniform1i(texMapLoc, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  for (var i = 0; i < 6; ++i) {
    
    var image = document.createElement('img');

    image.crossorigin = 'anonymous';
    image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
    
    image.onload = function (event) {
      var image = event.target;
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

      gl.texImage2D(image.textarget, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };

    image.src = cubemap[i];
  }
  gl.uniform1i(texMapLoc, 0);

}

function initBumpTexture() {
  var bumpmap = 'textures/normalmap.png';

  var texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  
  
  var image = document.createElement('img');
  image.crossorigin = 'anonymous';
  image.onload = function (event) {
    var image = event.target;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    };
  image.src = bumpmap;

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.uniform1i(normalLoc, 1);
}

////////////////////// INIT SCENE FUNCTION /////////////////////////////////
function initScene() { 
  //Grabs stuff from html
  canvas = document.getElementById("c");

  gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl") );
  
  aspect = canvas.width / canvas.height;

  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Init shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
}

////////////////////// TETRAHEDRON FUNCTION ////////////////////////////////
function tetrahedron(a, b, c, d, n) {
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

////////////////////// DIVIDE FUNCTION /////////////////////////////////////
function divideTriangle(a, b, c, count) {
  if (count > 0) {
    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);
    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
  }
  else {
    triangle(a, b, c);
  }
}
////////////////////// TRIANGLE FUNCTION ////////////////////////////////////
function triangle(a, b, c) {

  var t1 = subtract(b, a);
  var t2 = subtract(c, a);
  var normal = normalize(cross(t1, t2));
  normal = vec4(normal);
 
  normals.push(vec4(a[0], a[1], a[2] ,0));
  normals.push(vec4(b[0], b[1], b[2] ,0));
  normals.push(vec4(c[0], c[1], c[2] ,0));

  points.push(a);
  points.push(b);
  points.push(c);

  index += 3;
}