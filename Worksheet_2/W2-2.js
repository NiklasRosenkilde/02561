var gl;
var points;
var index = 0;
var maxVerts = 100000;
var numPoints = 0;
var chosenColor = 0;
var colors;

window.onload = function init() {
  //Grabs stuff from html
  var canvas        = document.getElementById("c");
  var colorMenu     = document.getElementById("colorMenu");
  var clearButton   = document.getElementById("clearButton");
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

  // Clicking on the color menu
  colorMenu.addEventListener("click", function () {
    chosenColor = colorMenu.selectedIndex;
  });

  // Clicking clear canvas button
  clearButton.addEventListener("click", function () {
    index = 0;
    gl.clearColor( colors[chosenColor][0],colors[chosenColor][1],colors[chosenColor][2],1.0 );
    render();
  });

  // Clicking (drawing) on the canvas
  canvas.addEventListener("click", function (ev) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var mousepos = ev.target.getBoundingClientRect();
    var p = vec2(-1 + 2 * (ev.clientX - mousepos.left) / canvas.width, -1 + 2 * (canvas.height - ev.clientY + mousepos.top) / canvas.height);
    gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof['vec2'], flatten(p));
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof ['vec4']*index, flatten(colors[chosenColor]));
    
    numPoints = Math.max(numPoints, ++index);
    index %= maxVerts;

    render();
  });
}

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, index);
}
