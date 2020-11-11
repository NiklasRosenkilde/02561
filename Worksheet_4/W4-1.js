var gl;

var program;

var numVertices = 36;
var points = [ ];
var colors = [ ];

var cubeVertices;
var vertexColors;


// VIEW PARAMETERS ////////////////////////////////////////////////////////////
var theta = 0;

var
  aspect,
  eye;

var 
  left    = -1.0,
  right   =  1.0,
  ytop    =  1.0,
  bottom  = -1.0;

var
  near   = 0.01,
  far    = 100,
  radius = 1.0,
  phi    = 0.0 * Math.PI / 180.0;

// View matrices
var modelView;
var projection;

// Field-of-view in Y direction angle (in degrees)
var  fovy = 45.0;  

// View vectors
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// GEOMETRY PARAMETERS ////////////////////////////////////////////////////////

var numTimesToSubdivide = 0;
var index = 0;

// Tetrahedron vertices
var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);


// MAIN FUNCTION ////////////////////////////////////////////////////////////
window.onload = function init() {
  //Grabs stuff from html
  var canvas = document.getElementById("c");

  gl = WebGLUtils.setupWebGL(canvas);
  aspect = canvas.width / canvas.height;

  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Init shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  modelViewLoc  = gl.getUniformLocation(program, "modelView");
  projectionLoc = gl.getUniformLocation(program, "projection");

  vertexColors = [
    [0.0, 0.0, 0.0, 1.0], // black
    [1.0, 0.0, 0.0, 1.0], // red
    [1.0, 1.0, 0.0, 1.0], // yellow
    [0.0, 1.0, 0.0, 1.0], // green
    [0.0, 0.0, 1.0, 1.0], // blue
    [1.0, 0.0, 1.0, 1.0], // magenta
    [1.0, 1.0, 1.0, 1.0], // white
    [0.0, 1.0, 1.0, 1.0]  // cyan
  ];
  
  // CLICK FUNCTIONS /////////////////////////////////////////////////////////
  var increment = document.getElementById("incrementButton");
  increment.addEventListener("click", function () {
    numTimesToSubdivide++;
    index = 0;
    points = [];
    render();
  });

  var decrement = document.getElementById("decrementButton");
  decrement.addEventListener("click", function () {
    if (numTimesToSubdivide > 0) {
      numTimesToSubdivide--;
    }
    index = 0;
    points = [];
    render();
  });


  // SETTING UP BUFFERS ///////////////////////////////////////////////////////////////////

  // // Vertex buffer
  // var vertexBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  // var vertex_Position = gl.getAttribLocation(program, 'vertex_Position');
  // gl.vertexAttribPointer(vertex_Position, 4, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(points);

  // // Color buffer
  // var colorBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  // var vertex_Color = gl.getAttribLocation(program, 'vertex_Color');
  // gl.vertexAttribPointer(vertex_Color, 4, gl.FLOAT, false, 0, 0);
  // gl.enableVertexAttribArray(vertex_Color);



  render();

}


////////////////////// RENDER FUNCTION /////////////////////////////////////
function render() {


  //------------------------------------


  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
  console.log(numTimesToSubdivide);

  // Vertex buffer
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vertex_Position = gl.getAttribLocation(program, 'vertex_Position');
  gl.vertexAttribPointer(vertex_Position, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_Position); //(points);

  // Color buffer
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vertex_Color = gl.getAttribLocation(program, 'vertex_Color');
  gl.vertexAttribPointer(vertex_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_Color);


  //------------------------------------

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //#region  Orthographic view
  eye = vec3(radius * Math.sin(phi), radius * Math.sin(theta), radius * Math.cos(phi));

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
  //#endregion

  for (var i = 0; i < index; i += 3) {
    console.log(i);
    gl.drawArrays(gl.TRIANGLES, i, 3);
  }
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
  points.push(a);
  points.push(b);
  points.push(c);

  index += 3;
}