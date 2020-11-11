var gl;
var points;
var colors;
var beta;
var betaLoc;



window.onload = function init() {
  // Setting up canvas (background)
  var canvas = document.getElementById("c");
  gl = WebGLUtils.setupWebGL(canvas);

  // Cornflower colouring of canvas
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

  // Arrays for points and colors
  points  = [vec2(-0.5,  0.5),
             vec2(-0.5, -0.5), 
             vec2( 0.5,  0.5), 
             vec2( 0.5, -0.5)];
             
  colors = [ vec4(1.0, 0.0, 0.0, 1.0), 
             vec4(0.0, 1.0, 0.0, 1.0), 
             vec4(0.0, 0.0, 1.0, 1.0),
             vec4(1.0, 1.0, 0.0, 1.0)];

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(program, 'vertex_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  var colBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var a_Color = gl.getAttribLocation(program, 'vertex_Color');
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);
  
  beta = 0.00;
  betaLoc = gl.getUniformLocation(program, "beta");

  tick()

}

function tick() {
  beta += 0.02  ;
  gl.uniform1f(betaLoc, beta);
  render();
  requestAnimationFrame(tick);
}
  
function render(){
  // Rendering
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, points.length);

}
