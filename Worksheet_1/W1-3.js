var gl;
var points;
var colors;

window.onload = function init() {
  // Setting up canvas (background)
  var canvas = document.getElementById("c");
  gl = WebGLUtils.setupWebGL(canvas);

  // Cornflower colouring of canvas
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  // Arrays for points and colors
  points  = [vec2(0, 0), vec2(1, 1), vec2(1, 0)];
  colors = [vec3(1,0,0), vec3(0,1,0), vec3(0,0,1)];

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  
  var a_Position = gl.getAttribLocation(program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  var colBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var a_Color = gl.getAttribLocation(program, 'a_Color');
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);

  // Rendering
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);

}
