var gl;
var maxVerts = 10000;
var numPoints = 0;
var chosenColor = 0;
var colors;
var drawMode = 'points';
var pointsIndices    = [];
var trianglesIndices = [];
var pointsIndex      = 0;
var trianglesIndex   = 0;

window.onload = function init() {
  //Grabs stuff from html
  var canvas          = document.getElementById("c");
  var colorMenu       = document.getElementById("colorMenu");
  var clearButton     = document.getElementById("clearButton");
  var pointsButton    = document.getElementById("pointsButton");
  var trianglesButton = document.getElementById("trianglesButton");
  gl = WebGLUtils.setupWebGL(canvas);
  
  colors = [
    vec4( 0.0, 0.0, 0.0, 1.0), // Black
    vec4( 1.0, 0.0, 0.0, 1.0), // Red
    vec4( 1.0, 1.0, 0.0, 1.0), // Yellow
    vec4( 0.0, 1.0, 0.0, 1.0), // Green
    vec4( 0.0, 0.0, 1.0, 1.0), // Blue
    vec4( 1.0, 0.0, 1.0, 1.0), // Magenta
    vec4( 0.0, 1.0, 1.0, 1.0), // Cyan
    vec4(0.3921, 0.5843, 0.9294, 1.0), // Cornflower
    vec4( 1.0, 1.0, 1.0, 1.0)  // White
  ];

  // Cornflower background
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Init shaders
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // SETTING UP BUFFERS ///////////////////////////////////////////////////////////////////

  // Vertex buffer
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, maxVerts*sizeof['vec2'], gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(program, 'vertex_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Color buffer
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sizeof['vec4'] * maxVerts, gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, 'vertex_Color');
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // CLICK FUNCTIONS ///////////////////////////////////////////////////////////////////////

  // Clicking on the color menu
  pointsButton.addEventListener("click", function () {
    drawMode = 'points';});

  // Clicking on the color menu
  trianglesButton.addEventListener("click", function () {
    drawMode ='triangles';});

  // Clicking on the color menu
  colorMenu.addEventListener("click", function () {
    chosenColor = colorMenu.selectedIndex;});

  // Clicking clear canvas button
  clearButton.addEventListener("click", function () {
    // Resets drawing indices
    pointsIndex       = 0;
    pointsIndices    = [];
    trianglesIndices = [];
    gl.clearColor( colors[chosenColor][0],colors[chosenColor][1],colors[chosenColor][2],1.0 );
    render();
  });

  // Clicking (drawing) on the canvas
  canvas.addEventListener("click", function (ev) {
    // Vertex position
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var mousepos = ev.target.getBoundingClientRect();
    var p = vec2(-1 + 2 * (ev.clientX - mousepos.left) / canvas.width, -1 + 2 * (canvas.height - ev.clientY + mousepos.top) / canvas.height);
    gl.bufferSubData(gl.ARRAY_BUFFER, pointsIndex * sizeof['vec2'], flatten(p));
    // Vertex coloring
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec4'] * pointsIndex, flatten(colors[chosenColor]));

    switch (drawMode) {
      case 'points':
        pointsIndices.push(pointsIndex);
        break;
      case 'triangles':
        console.log(drawMode);
        if (trianglesIndex < 2) {
          pointsIndices.push(pointsIndex);
          trianglesIndex++;
        }
        else {
          trianglesIndex = 0;
          pointsIndices.pop();
          pointsIndices.pop();
          trianglesIndices.push(pointsIndex - 2);
        }
    }

    numPoints = Math.max(numPoints, ++pointsIndex);
    pointsIndex %= maxVerts;
    //pointsIndex++;
    render();
  });

}

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var i = 0; i < pointsIndices.length; ++i){
    gl.drawArrays(gl.POINTS, pointsIndices[i], 1);
  }

  for (var i = 0; i < trianglesIndices.length; ++i){
    gl.drawArrays(gl.TRIANGLE_STRIP, trianglesIndices[i], 3);
  }
}
