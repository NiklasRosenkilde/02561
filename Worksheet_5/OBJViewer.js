var gl;
var mvMatrix, pMatrix;
var modelView, projection;
var eye;
var program;

var theta, speed;
theta = 0.5;
speed = 0.4;

//Camera position
var near   = -5.0;
var far    = 15.0;

var left   = 4.0;
var right  = -4.0;
var ytop   = 4.0;
var bottom = -4.0;

const at = vec3(0.0, 0.0, 1.0);
const up = vec3(0.0, 1.0, 0.0);

var model;
var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model


window.onload=function init() {
  var canvas = document.getElementById("c");
	gl = WebGLUtils.setupWebGL(canvas);

  gl.enable(gl.DEPTH_TEST);
  //gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  gl.clearColor( 0.9, 0.9, 0.9, 1.0);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  program.vPosition = gl.getAttribLocation(program, "vPosition");
  program.vNormal = gl.getAttribLocation(program, "vNormal");
  program.vColor = gl.getAttribLocation(program, "vColor");

  //Prepare empty buffer objects for vertex coordinates, colors, and normals
  model = initVertexBuffers(gl, program);

  //Start reading the OBJ file
  readOBJFile("el_crabbo.obj", gl, model, 0.25, false);

  modelView = gl.getUniformLocation(program, "modelViewMatrix");
  projection = gl.getUniformLocation(program, "projectionMatrix");
  lightPositionLoc = gl.getUniformLocation(program, "lightPosition");


  lightPosition = vec4(1.0, 1.0, 3.0, 0.0);
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

  console.log("MODEL VIEW MATRIX: "+ mvMatrix)
  console.log("PROJECTION MATRIX: "+ pMatrix)

  
  
  tick();
}

function tick() {
  theta += speed;

   if(theta >= Math.PI * 2) {
     theta -= Math.PI * 2;
   }

  render();
  requestAnimationFrame(tick);
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
  var o = new Object();
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.vPosition, 3, gl.FLOAT);
  o.normalBuffer = createEmptyArrayBuffer(gl, program.vNormal , 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.vColor, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return o;
}

//Create a buffer object, assign it to attribute variables, and enable the
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer(); //Create a buffer object

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute); // Enable the assignment

  return buffer;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request. status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
    }
  }
  request.open("GET", fileName, true); // Create a request to get file
  request.send(); // Send the request
}


//OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
  var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse);
  if (!result) {
    g_objDoc = null;
    g_drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  g_objDoc = objDoc;
}

// OBJ File has been read completely
function onReadComplete(gl, objDoc) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}

function render() {
  if (g_objDoc !== null && g_objDoc.isMTLComplete()){
    g_drawingInfo = onReadComplete(gl, g_objDoc);
    g_objDoc = null;
  }

  if(!g_drawingInfo) {
    return;
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(Math.cos(theta), 0*Math.cos(theta), 0*Math.cos(theta));

  mvMatrix = lookAt(eye, at , up);
  pMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(projection, false, flatten(pMatrix));

  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

}

