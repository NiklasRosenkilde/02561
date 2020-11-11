var gl, program;

var points  = [ ];
var normals = [ ];
var colors  = [ ];

var cubeVertices;
var vertexColors;

var model;
var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// VIEW PARAMETERS ////////////////////////////////////////////////////////////
var theta = 1;

var aspect, eye;

var left  = -1.0,
  right   =  1.0,
  ytop    =  1.0,
  bottom  = -1.0;

var
  near   = -5.0,
  far    = 100,
  radius = 2.0,
  phi    = 3.9;

// View matrices
var modelView, projection;

// Field-of-view in Y direction angle (in degrees)
var  fovy = 45.0;  

// View vectors
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// LIGHT PARAMETERS ////////////////////////////////////////////////////////
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);

var lightAmbient  = vec4(0.6, 0.6, 0.6, 1.0);
var lightDiffuse  = vec4( 1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0);

// MATERIAL PARAMETERS ////////////////////////////////////////////////////////
var materialShininess = 400.0;
var materialAmbient = vec4(0.7, 0.4, 0.2, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);


// MAIN FUNCTION ////////////////////////////////////////////////////////////
window.onload = function init() {
  //Grabs stuff from html
  var canvas = document.getElementById("c");

  gl = WebGLUtils.setupWebGL(canvas);
  aspect = canvas.width / canvas.height;

  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1921, 0.5843, 0.2294, 1.0);
  
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);


  // Init shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  program.vertex_Position = gl.getAttribLocation(program, 'vertex_Position');
  program.vNormal = gl.getAttribLocation(program, 'vertex_Normal');
  program.vColor = gl.getAttribLocation(program, 'fColor'); // ????????????????????????++


  //Prepare empty buffer objects for vertex coordinates, colors, and normals
  model = initVertexBuffers(gl, program);

  //Start reading the OBJ file
  readOBJFile("el_crabbo.obj", gl, model, 0.07, false);

  modelViewLoc  = gl.getUniformLocation(program, "modelView");
  projectionLoc = gl.getUniformLocation(program, "projection");
  lightPositionLoc = gl.getUniformLocation(program, "lightPosition");


  // CLICK FUNCTIONS /////////////////////////////////////////////////////////
  //#region click functions

  document.getElementById("slider_Alpha").oninput =
  function (event) {
    materialShininess = event.target.value;
  };

  document.getElementById("slider_Ambient").oninput =
    function (event) {
      amb = event.target.value;
      materialAmbient = vec4(amb, amb, amb, 1.0);
    };

  document.getElementById("slider_Diffuse").oninput =
    function (event) {
      diff = event.target.value;
      materialDiffuse = vec4(diff, diff, diff, 1.0);
    };

  document.getElementById("slider_Specular").oninput =
    function (event) {
      spec = event.target.value;
      materialSpecular = vec4(spec, spec, spec, 1.0);
    };

  document.getElementById("slider_Emission").oninput =
    function (event) {
      var L = event.target.value;
      lightDiffuse = vec4(L, L, L, 1.0);
      lightAmbient = vec4(L, L, L, 1.0);
      lightSpecular = vec4(L, L, L, 1.0);
    };
  //#endregion

  redraw();

}

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

////////////////////// RENDER FUNCTIONS /////////////////////////////////////
function redraw() {
  // Light setup
  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  render();
  requestAnimationFrame(redraw);
}


function render() {

  if (g_objDoc !== null && g_objDoc.isMTLComplete()) {
    g_drawingInfo = onReadComplete(gl, g_objDoc);
    g_objDoc = null;
  }

  if (!g_drawingInfo) {
    return;
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  phi+=0.02;
  eye = vec3(radius * Math.sin(phi), radius * Math.sin(theta), radius * Math.cos(phi));

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}



////////////////////// OBJ FUNCTIONS /////////////////////////////////////
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


