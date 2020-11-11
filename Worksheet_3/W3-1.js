var gl;

var program;

var numVertices = 36;
var points = [];
var colors = [];

var cubeVertices;
var vertexColors;
//  var indices;

var theta2 = [0, 0, 0];

var thetaLoc;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

var near = -1;
var far = 10;
var radius = 1;

var theta = 45.0/180.0*Math.PI;
var phi = 45.0/180.0*Math.PI;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var modelView, projection;
var modelViewLoc;
var projectionLoc;

window.onload = function init() {
  //Grabs stuff from html
  var canvas = document.getElementById("c");

  gl = WebGLUtils.setupWebGL(canvas);


  cubeVertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
  ];

  vertexColors = [
    [0.0, 0.0, 0.0, 1.0], // black
    [1.0, 0.0, 0.0, 1.0], // red
    [1.0, 1.0, 0.0, 1.0], // yellow
    [0.0, 1.0, 0.0, 1.0], // green
    [0.0, 0.0, 1.0, 1.0], // blue
    [1.0, 0.0, 1.0, 1.0], // magenta
    [1.0, 1.0, 1.0, 1.0], // white
    [0.0, 1.0, 1.0, 1.0] // cyan
  ];

  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Init shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  colorCube();

  // SETTING UP BUFFERS ///////////////////////////////////////////////////////////////////

  // Vertex buffer
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vertex_Position = gl.getAttribLocation(program, 'vertex_Position');
  gl.vertexAttribPointer(vertex_Position, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(points);

  // Color buffer
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vertex_Color = gl.getAttribLocation(program, 'vertex_Color');
  gl.vertexAttribPointer(vertex_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_Color);

  thetaLoc = gl.getUniformLocation(program, "theta");

  modelViewLoc = gl.getUniformLocation(program, "modelView");
  projectionLoc = gl.getUniformLocation(program, "projection");


  render();

}

function colorCube() {
  quad(1, 0, 2, 3);
  quad(4, 5, 7, 6);
  quad(0, 4, 3, 7);
  quad(5, 1, 6, 2);
  quad(5, 4, 1, 0);
  quad(7, 6, 3, 2);
}

function quad(a, b, c, d) {
  var indices = [a, b, c, a, c, d];
  for (var i = 0; i < indices.length; ++i) {
    points.push(cubeVertices[indices[i]]);
    colors.push(vertexColors[indices[i]]);
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Orthographic view 
  eye = vec3(radius * Math.sin(phi), radius * Math.sin(theta),
    radius * Math.cos(phi));

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));


  gl.drawArrays(gl.LINES, 0, numVertices);
  //requestAnimFrame(render);
}

function colorCube() {
  quad(1, 0, 2, 3);
  quad(4, 5, 7, 6);
  quad(0, 4, 3, 7);
  quad(5, 1, 6, 2);
  quad(5, 4, 1, 0);
  quad(7, 6, 3, 2);
}

function quad(a, b, c, d) {
  var indices = [a, b, c, a, c, d];
  for (var i = 0; i < indices.length; ++i) {
    points.push(cubeVertices[indices[i]]);
    colors.push(vertexColors[indices[i]]);
  }
}

