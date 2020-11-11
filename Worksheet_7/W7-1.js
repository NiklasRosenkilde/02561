var gl;

var program;

var g_tex_ready = 0;

var points  = [ ];
var normals = [ ];
var colors  = [ ];

// VIEW PARAMETERS ////////////////////////////////////////////////////////////
var theta = 0;

var aspect, eye;

var left    = -1.0,
  right   =  1.0,
  ytop    =  1.0,
  bottom  = -1.0;

  var
  near   = -5.0,
  far    = 100,
  radius = 1,
  phi    = 0.0 * Math.PI / 180.0; 

// View matrices
var modelView, projection;
var modelViewLoc, projectionLoc, thetaLoc;

// Field-of-view in Y direction angle (in degrees)
var  fovy = 45.0;  

// View vectors
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// LIGHT PARAMETERS ////////////////////////////////////////////////////////
var ambient, diffuse, specular, light, shininess;
var ambientProduct, diffuseProduct, specularProduct;
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);

var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0);
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0);

// MATERIAL PARAMETERS ////////////////////////////////////////////////////////
var MaterialShininess = 1.2;
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(0.8, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// GEOMETRY PARAMETERS ////////////////////////////////////////////////////////
var numTimesToSubdivide = 4;
var index = 0;

// Tetrahedron vertices
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);


// MAIN FUNCTION ////////////////////////////////////////////////////////////
window.onload = function init() {

  initScene();

  modelViewLoc  = gl.getUniformLocation(program, "ModelView");
  projectionLoc = gl.getUniformLocation(program, "projection");
  thetaLoc = gl.getUniformLocation(program, "theta")

  initTexture();

  redraw();

  render();
}



////////////////////// REDRAW FUNCTION /////////////////////////////////////
function redraw(){  
  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
  
  // Normal buffer
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  var normal = gl.getAttribLocation(program, "vertex_Normal");
  gl.vertexAttribPointer(normal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normal);

  // Vertex buffer
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vertex_Position = gl.getAttribLocation(program, "vertex_Position");
  gl.vertexAttribPointer(vertex_Position, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_Position);
}

////////////////////// RENDER FUNCTION /////////////////////////////////////
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // eye = vec3(radius * Math.sin(phi), radius * Math.sin(theta), radius * Math.cos(phi));

    // modelViewMatrix = lookAt(eye, at, up);
    // projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    // gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelViewMatrix));
    // gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));

    for (var i = 0; i < index; i += 3) {
      gl.drawArrays(gl.TRIANGLES, i, 3);
    }
    
    requestAnimFrame(render);

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
////////////////////// CUBE TEXTURE FUNCTION ///////////////////////////////
function initTexture() {
  var cubemap = [
    'textures/cm_left.png', // POSITIVE_X
    'textures/cm_right.png', // NEGATIVE_X
    'textures/cm_top.png', // POSITIVE_Y
    'textures/cm_bottom.png', // NEGATIVE_Y
    'textures/cm_back.png', // POSITIVE_Z
    'textures/cm_front.png']; // NEGATIVE_Z

  var texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  for (var i = 0; i < 6; ++i) {
    var image = document.createElement('img');

    image.crossorigin = 'anonymous';
    image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
    
    image.onload = function (event) {
      var image = event.target;
      gl.texImage2D(image.textarget, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ++g_tex_ready;
    };

    image.src = cubemap[i];
  }
}

////////////////////// INIT SCENE FUNCTION /////////////////////////////////
function initScene() { 
  //Grabs stuff from html
  var canvas = document.getElementById("c");

  gl = WebGLUtils.setupWebGL(canvas);
  aspect = canvas.width / canvas.height;
  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  // Init shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
}