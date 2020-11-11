var gl;

var program;

var numVertices = 36;
var points = [ ];
var colors = [ ];

var cubeVertices;
var vertexColors;

var theta = 0;
var thetaLoc;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

var modelView;
var projection;

var
  near   = 0.01;//0.3,
  far    = 100;//4.0,
  radius = 2.0,
  phi    = 0.0 * Math.PI / 180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)

var
  aspect,
  mvMatrix, 
  pMatrix,
  eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {
  //Grabs stuff from html
  var canvas = document.getElementById("c");

  gl = WebGLUtils.setupWebGL(canvas);
  aspect =  canvas.width/canvas.height;

  cubeVertices = [
    vec4(-0.5,-0.5,0.5, 1.0),
    vec4(-0.5,0.5,0.5, 1.0),
    vec4(0.5,0.5,0.5, 1.0),
    vec4(0.5,-0.5,0.5, 1.0),
    vec4(-0.5,-0.5,-0.5, 1.0),
    vec4(-0.5,0.5,-0.5, 1.0),
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
    [0.0, 1.0, 1.0, 1.0]  // cyan
  ];

  // Cornflower background
  gl.viewport( 0, 0, canvas.width, canvas.height );
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



  // Contact to angle in shader
  thetaLoc = gl.getUniformLocation(program, "theta");

  // Contact to modelView and projection in shader
  modelView = gl.getUniformLocation( program, "modelView" );
  projection = gl.getUniformLocation( program, "projection" );

  // Set up perspective and eye
  pMatrix = perspective(fovy, aspect, near, far);
  gl.uniformMatrix4fv(projection, false, flatten(pMatrix));

  eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
  radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

  render();

}


function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // One-point perspective
  var ctm1 = setModelViewMatrix(radius, theta, phi);
  var ctm1 = mult(
    ctm1, 
    scalem(0.25, 0.25, 0.65)
    );
  gl.uniformMatrix4fv(modelView, false, flatten(ctm1));
  gl.drawArrays(gl.LINES, 0, numVertices);

  // Two-point perspective
  var ctm2 = setModelViewMatrix(radius, theta, phi);
  var ctm2 = mult(mult(mult(
    ctm2, 
    translate(-0.45, 0, 0.0)), 
    rotateY(20)), 
    scalem(0.25, 0.25, 0.3)
    );
  gl.uniformMatrix4fv(modelView, false, flatten(ctm2));
  gl.drawArrays(gl.LINES, 0, numVertices);

  // Three-point perspective
  var ctm3 = setModelViewMatrix(radius = 5, theta = 66, phi = 45);
  var scale = 0.65;
  ctm3 = mult(mult(mult(mult(
    ctm3,
    translate(1.8, 1.1, 0)),
    rotateX(15)),
    rotateZ(-15)),
    scalem(scale, scale, scale)
  );

  gl.uniformMatrix4fv(modelView, false, flatten(ctm3));
  gl.drawArrays(gl.LINES, 0, numVertices);
}



function setModelViewMatrix(radius = 6.0, theta = 0.0, phi = 0.0){
    theta  = theta * Math.PI/180.0
    phi    = phi   * Math.PI/180.0

    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi))

    return lookAt(eye, at , up)
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
