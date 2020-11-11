var gl;
var maxVerts = 10000;
var numPoints = 0;
var chosenColor = 0;
var colors;
var drawMode = 'points';
var pointsIndices    = [];
var trianglesIndices = [];
var circlesIndices   = [];
var pointsIndex      = 0;
var trianglesIndex   = 0;
var circlesIndex     = 0;

var currentCenterPoint;

window.onload = function init() {
  //Grabs stuff from html
  var canvas          = document.getElementById("c");
  var colorMenu       = document.getElementById("colorMenu");
  var clearButton     = document.getElementById("clearButton");
  var pointsButton    = document.getElementById("pointsButton");
  var trianglesButton = document.getElementById("trianglesButton");
  var circlesButton   = document.getElementById("circlesButton");

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
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
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

  // Clicking on the points button
  pointsButton.addEventListener("click", function () {
    drawMode = 'points';});

  // Clicking on the triangles button
  trianglesButton.addEventListener("click", function () {
    drawMode ='triangles';});

  // Clicking on the circles button
  circlesButton.addEventListener("click", function () {
    drawMode ='circles';});

  // Clicking on the color menu
  colorMenu.addEventListener("click", function () {
    chosenColor = colorMenu.selectedIndex;});

  // Clicking clear canvas button
  clearButton.addEventListener("click", function () {
    // Resets drawing indices
    pointsIndex       = 0;
    pointsIndices    = [];
    trianglesIndices = [];
    circlesIndices   = [];
    gl.clearColor( colors[chosenColor][0],colors[chosenColor][1],colors[chosenColor][2],1.0 );
    render();
  });

  // Clicking (drawing) on the canvas
  canvas.addEventListener("click", function (ev) {
    // Vertex position    
    var mousepos = ev.target.getBoundingClientRect();
    var clickedPoint = vec2(-1 + 2 * (ev.clientX - mousepos.left) / canvas.width, -1 + 2 * (canvas.height - ev.clientY + mousepos.top) / canvas.height);

    vertexBuffering(clickedPoint,pointsIndex,vertexBuffer);
    colorBuffering(colors[chosenColor],pointsIndex,colorBuffer);

    switch (drawMode) {
      case 'points':
        pointsIndices.push(pointsIndex);
        break;

      case 'triangles':
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
        break;
      case 'circles':
        // First point (center)
        if (circlesIndex < 1) {
          currentCenterPoint = clickedPoint;
          pointsIndices.push(pointsIndex);
          circlesIndex++;
        }
        else {
          
          pointsIndices.pop();
          circlesIndices.push(pointsIndex - 1);

          // Finds radius of circle
          var distX = Math.abs(clickedPoint[0] - currentCenterPoint[0]);
          var distY = Math.abs(clickedPoint[1] - currentCenterPoint[1]);

          var radius = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
          
          // 
          var stepSize = 0.1;

          for (var i = 0; i <= 2 * Math.PI + stepSize; i += stepSize) {
            var position = vec2(
              currentCenterPoint[0] + Math.cos(i) * radius,
              currentCenterPoint[1] + Math.sin(i) * radius);
            
            vertexBuffering( position, pointsIndex, vertexBuffer );
            colorBuffering( colors[chosenColor], pointsIndex, colorBuffer );

            pointsIndex++;
          }

          circlesIndex = 0;
          currentCenterPoint = null;
        }
    }

    numPoints = Math.max(numPoints, ++pointsIndex);
    pointsIndex %= maxVerts;
    
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

  for (var i = 0; i < circlesIndices.length; ++i){
    gl.drawArrays(gl.TRIANGLE_FAN, circlesIndices[i], 65);
  }
}



function vertexBuffering(point,pointsIndex,vertexBuffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, pointsIndex * sizeof['vec2'], flatten(point));
}

function colorBuffering(color,pointsIndex,colorBuffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, pointsIndex * sizeof['vec4'], flatten(color));
}
