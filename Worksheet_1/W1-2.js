var gl
var points

window.onload = function init() {
  var canvas = document.getElementById("c");
  gl = WebGLUtils.setupWebGL(canvas);

  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);


  points = [vec2(0, 0), vec2(1, 1), vec2(1, 0)];

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, points.length);
}
