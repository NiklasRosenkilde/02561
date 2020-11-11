var canvas;
var gl;
var teapotProgram, groundProgram, shadowProgram;
var fb;

// VIEW PARAMETERS ////////////////////////////////////////////////////////////
var ground_modelViewLoc, ground_perspectiveLoc;
var teapot_modelViewLoc, teapot_perspectiveLoc, teapot_lightModelView,
  teapot_lightPerspective, teapot_lightPosition;

var moveTeapot = true, lookDown = false, moveLight = true;
var lightX, lightY = 3.5, lightZ;

// Projection shadow matrix
var projectionMatrix = mat4(1);
projectionMatrix[3][1] = -1 / (lightY + 1);
projectionMatrix[3][3] = 0;

// GEOMETRY PARAMETERS ////////////////////////////////////////////////////////
var teapotModel = {}, groundModel = {};
var g_objDoc, g_drawingInfo;
const shadowSize = 1024;

// Ground quad vertices
var groundQuad = [
  vec3(-2, -1, -1),
  vec3(-2, -1, -5),
  vec3(2, -1, -5),
  vec3(2, -1, -1)
];
// Texture coordinates
var texCoords = [
  vec2(-1, -1),
  vec2(-1, 1),
  vec2(1, 1),
  vec2(1, -1)];

var indices = [0, 3, 2, 0, 2, 1];

// MAIN FUNCTION ////////////////////////////////////////////////////////////
window.onload = function init() {

  initScene();
  initTexture();

  // CLICK FUNCTIONS /////////////////////////////////////////////////////////
  var bt_moveTeapot = document.getElementById("moveTeapot");
  bt_moveTeapot.onchange = x => {
    moveTeapot = bt_moveTeapot.checked;
  };

  var bt_lookDown = document.getElementById("lookDown");
  bt_lookDown.onchange = x => {
    lookDown = bt_lookDown.checked;
  };

  var bt_moveLight = document.getElementById("moveLight");
  bt_moveLight.onchange = x => {
    moveLight = bt_moveLight.checked;
  };

  render();
}

function initTexture() {
  // image texture
  var image = document.createElement('img');

  var texture = gl.createTexture();
  image.crossorigin = 'anonymous';
  image.onload = e => {
    console.log("Texture loaded");

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform1i(groundProgram.texture, 0);
    gl.uniform1i(groundProgram.shadow, 1);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  };
  image.src = 'textures/xamp23.png';
}

function render(time) {
  var t = time / 600;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  ////////////////// LIGHT //////////////////////////
  lightX = moveLight ? 2 * Math.sin(t) : 0;
  lightZ = moveLight ? -3 + 2 * Math.cos(t) : -2.9999;

  var lightPerspectiveMatrix = [
    perspective(90, 1, 1, 20),
    lookAt(vec3(lightX, lightY, lightZ), vec3(0, 0, -3), vec3(0, 1, 0)),
  ].reduce(mult);

  ////////////////// GROUND //////////////////////////
  gl.useProgram(groundProgram);
  initAttributeVariable(gl, groundProgram.position, groundModel.vertexBuffer, 3);
  initAttributeVariable(gl, groundProgram.texPosition, groundModel.texCoordsBuffer, 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundModel.indexBuffer);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);


  gl.useProgram(shadowProgram);//////////////////////////////////////// NY
  initAttributeVariable(gl, shadowProgram.position, groundModel.vertexBuffer, 3);//////////////////////////////////////// NY
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundModel.indexBuffer);//////////////////////////////////////// NY


  var uLocation = gl.getUniformLocation(shadowProgram, 'modelView');//////////////////////////////////////// NY
  gl.uniformMatrix4fv(uLocation, false, flatten(mat4()));

  uLocation = gl.getUniformLocation(shadowProgram, 'perspective');//////////////////////////////////////// NY
  gl.uniformMatrix4fv(uLocation, false, flatten(lightPerspective));

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);


  ////////////////// VIEW ////////////////////////////
  // Perspective view matrix
  var viewPerspectiveMatrix = [
    perspective(90, 1, 1, 20),
    lookAt(lookDown ? vec3(0, 2, -2.99) : vec3(0, 0, 0), vec3(0, 0, -3), vec3(0, 1, 0)),
  ].reduce(mult);

  // Sets view
  gl.uniformMatrix4fv(ground_perspectiveLoc, false, flatten(viewPerspectiveMatrix));
  gl.uniformMatrix4fv(ground_modelViewLoc, false, flatten(mat4()));


  ////////////////// TEAPOT //////////////////////////
  gl.useProgram(teapotProgram);
  initAttributeVariable(gl, teapotProgram.position, teapotModel.vertexBuffer, 3);
  initAttributeVariable(gl, teapotProgram.normal, teapotModel.normalBuffer, 3);
  initAttributeVariable(gl, teapotProgram.color, teapotModel.colorBuffer, 4);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotModel.indexBuffer);

  // Waits for model to load
  if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
    g_drawingInfo = onReadComplete(gl, teapotModel, g_objDoc);
    // console.log("g_drawingInfo set!");
  }
  if (g_drawingInfo) {

    var moveY = moveTeapot ? 0.25 * Math.cos(t) : 0;
    var modelViewMatrix = [
      translate(0, moveY, -3),
      scalem(0.25, 0.25, 0.25),
    ].reduce(mult);


    gl.useProgram(shadowProgram);
    initAttributeVariable(gl, shadowProgram.position, teapotModel.vertexBuffer, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotModel.indexBuffer);
    
    gl.uniformMatrix4fv(teapot_modelViewLoc, false, flatten(teapotModelView));
    var uaLocation = gl.getUniformLocation(shadowProgram, 'perspective');
    gl.uniformMatrix4fv(uaLocation, false, flatten(lightPerspective));

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

    // RENDER THE TEAPOT
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(teapotProgram);

    initAttributeVariable(gl, teapotProgram.position, teapotModel.vertexBuffer, 3);
    initAttributeVariable(gl, teapotProgram.normal, teapotModel.normalBuffer, 3);
    initAttributeVariable(gl, teapotProgram.color, teapotModel.colorBuffer, 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotModel.indexBuffer);

    gl.uniformMatrix4fv(teapot_modelViewLoc, false, flatten(teapotModelView));
    gl.uniformMatrix4fv(teapot_perspectiveLoc, false, flatten(cameraPerspective));
    gl.uniformMatrix4fv(teapot_lightModelView, false, flatten(teapotModelView));
    gl.uniformMatrix4fv(teapot_lightPerspective, false, flatten(lightPerspective));
    gl.uniform3f(teapot_lightPosition, lightX, lightY, lightZ);

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

    // ////////////////// TEAPOT SHADOWS //////////////////////////
    // var modelView = [
    //   translate(0, -0.001, 0),
    //   translate(lightX, lightY, lightZ),
    //   projectionMatrix,
    //   translate(-lightX, -lightY, -lightZ),
    //   modelViewMatrix
    // ].reduce(mult);



    // gl.uniformMatrix4fv(teapot_modelViewLoc, false, flatten(modelView));

    // gl.uniform1f(teapot_visibleLoc, false);
    // gl.depthFunc(gl.GREATER);
    // gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

    // ////////////////// TEAPOT ITSELF //////////////////////////
    // gl.uniformMatrix4fv(teapot_modelViewLoc, false, flatten(modelViewMatrix));
    // gl.uniformMatrix4fv(teapot_perspectiveLoc, false, flatten(viewPerspectiveMatrix));


    // gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
  };

  requestAnimationFrame(render);
}

////////////////////// INIT SCENE FUNCTION /////////////////////////////////
function initScene() {
  //Grabs stuff from html
  canvas = document.getElementById("c");

  gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl"));

  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Init teapot base shaders
  teapotProgram = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
  gl.useProgram(teapotProgram);

  teapotProgram.position = gl.getAttribLocation(teapotProgram, 'vertex_position');
  teapotProgram.color = gl.getAttribLocation(teapotProgram, 'vertex_color');
  teapotProgram.normal = gl.getAttribLocation(teapotProgram, 'vertex_normal');
  teapotProgram.shadow = gl.getUniformLocation(teapotProgram, 'shadow');
  gl.uniform1i(teapotProgram.shadow, 1);

  teapotModel.vertexBuffer = createEmptyArrayBuffer(gl, teapotProgram.position, 3, gl.FLOAT);
  normalBuffer: createEmptyArrayBuffer(gl, teapotProgram.normal, 3, gl.FLOAT),
    teapotModel.colorBuffer = createEmptyArrayBuffer(gl, teapotProgram.color, 4, gl.FLOAT);
  teapotModel.indexBuffer = gl.createBuffer();

  readOBJFile('./teapot/teapot.obj', 1, false);

  // Init teapot shadow shader
  shadowProgram = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
  gl.useProgram(shadowProgram);

  shadowProgram.position = gl.getAttribLocation(shadowProgram, 'position');

  fb = initFramebufferObject(gl);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, fb.texture);



  // Init ground shaders
  groundProgram = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
  gl.useProgram(groundProgram);

  groundProgram.position = gl.getAttribLocation(groundProgram, 'vertex_position');
  groundProgram.texPosition = gl.getAttribLocation(groundProgram, 'texPosition');
  groundProgram.texture = gl.getUniformLocation(groundProgram, 'texture');
  groundProgram.shadow = gl.getUniformLocation(groundProgram, 'shadow');

  groundModel.vertexBuffer = createEmptyArrayBuffer(gl, groundProgram.position, 3, gl.FLOAT);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(groundQuad), gl.STATIC_DRAW);

  groundModel.texCoordsBuffer = createEmptyArrayBuffer(gl, groundProgram.texPosition, 2, gl.FLOAT);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

  groundModel.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundModel.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);


  // Init shader locations
  ground_perspectiveLoc = gl.getUniformLocation(groundProgram, 'perspective');
  ground_modelViewLoc = gl.getUniformLocation(groundProgram, 'modelView');

  teapot_modelViewLoc = gl.getUniformLocation(teapotProgram, 'modelView');
  teapot_perspectiveLoc = gl.getUniformLocation(teapotProgram, 'perspectiveMatrix');
  teapot_lightModelView = gl.getUniformLocation(teapotProgram, 'perspectiveMatrix');
  teapot_lightPerspective = gl.getUniformLocation(teapotProgram, 'perspectiveMatrix');
  teapot_lightPosition = gl.getUniformLocation(teapotProgram, 'perspectiveMatrix');

}

////////////////////// BUFFER FUNCTIONS //////////////////////////////////
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
  return buffer;
}

function initAttributeVariable(gl, a_attribute, buffer, num) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}


////////////////////// OBJ FUNCTIONS /////////////////////////////////////
// Read a file
async function readOBJFile(fileName, scale, reverse) {
  fetch(fileName).then(x => x.text()).then(x => {
    onReadOBJFile(x, fileName, scale, reverse);
  }).catch(err => console.log(err));
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, scale, reverse) {
  var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse);

  if (!result) {
    g_objDoc = null;
    g_drawingInfo = null;
    console.log("OBJ file parsing error");
  } else {
    g_objDoc = objDoc;
  }
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {

  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo();
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  //gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  //gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}

////////////////////// FRAME BUFFER /////////////////////////////////////

function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  framebuffer = gl.createFramebuffer();

  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shadowSize, shadowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_FILTER, gl.LINEAR);
  framebuffer.texture = texture;

  depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, shadowSize, shadowSize);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (e !== gl.FRAMEBUFFER_COMPLETE) {
    console.log('Framebuffer object is incomplete: ' + e.toString());
    return error();
  }

  return framebuffer;
}