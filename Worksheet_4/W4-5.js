var gl, program;

var points  = [ ];
var normals = [ ];
var colors  = [ ];

var cubeVertices;
var vertexColors;


// VIEW PARAMETERS ////////////////////////////////////////////////////////////
var theta = 0;

var aspect, eye;

var left    = -1.0,
  right   =  1.0,
  ytop    =  1.0,
  bottom  = -1.0;

var
  near   = -5.0,
  far    = 100,
  radius = 2.6,
  phi    = 0.0 * Math.PI / 180.0;

// View matrices
var modelView, projection;

// Field-of-view in Y direction angle (in degrees)
var  fovy = 45.0;  

// View vectors
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// LIGHT PARAMETERS ////////////////////////////////////////////////////////
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);

var lightAmbient  = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse  = vec4( 1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0);

// MATERIAL PARAMETERS ////////////////////////////////////////////////////////
var materialShininess = 20.0;
var materialAmbient = vec4(1.0, 0.4, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// GEOMETRY PARAMETERS ////////////////////////////////////////////////////////
var numTimesToSubdivide = 3;
var index = 0;

// Tetrahedron vertices
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);


// MAIN FUNCTION ////////////////////////////////////////////////////////////
window.onload = function init() {
  //Grabs stuff from html
  var canvas = document.getElementById("c");

  gl = WebGLUtils.setupWebGL(canvas);
  aspect = canvas.width / canvas.height;

  // Cornflower background
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);


  // Init shaders
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  modelViewLoc  = gl.getUniformLocation(program, "modelView");
  projectionLoc = gl.getUniformLocation(program, "projection");


  // CLICK FUNCTIONS /////////////////////////////////////////////////////////
  //#region click functions
  var increment = document.getElementById("incrementButton");
  increment.addEventListener("click", function () {
    numTimesToSubdivide+=1;
    index   = 0;
    points  = [];
    normals = [];
    redraw();
  });

  var decrement = document.getElementById("decrementButton");
  decrement.addEventListener("click", function () {
    if (numTimesToSubdivide > 0) {
      numTimesToSubdivide-=1;
    }
    index   = 0;
    points  = [];
    normals = [];
    redraw();
  });

  document.getElementById("slider_Alpha").oninput =
  function (event) {
    console.log(event.target.value);

    materialShininess = event.target.value;
    redraw();
  };

  document.getElementById("slider_Ambient").oninput =
    function (event) {
      console.log(event.target.value);

      amb = event.target.value;
      materialAmbient = vec4(amb, amb, amb, 1.0);
      redraw();
    };

  document.getElementById("slider_Diffuse").oninput =
    function (event) {
      console.log(event.target.value);

      diff = event.target.value;
      materialDiffuse = vec4(diff, diff, diff, 1.0);
      redraw();
    };

  document.getElementById("slider_Specular").oninput =
    function (event) {
      console.log(event.target.value);

      spec = event.target.value;
      materialSpecular = vec4(spec, spec, spec, 1.0);
      redraw();
    };

  document.getElementById("slider_Emission").oninput =
    function (event) {
      console.log(event.target.value);
      var L = event.target.value;
      lightDiffuse  = vec4(L, L, L, 1.0);
      lightAmbient  = vec4(L, L, L, 1.0);
      lightSpecular = vec4(L, L, L, 1.0);
      redraw();
    };
    //#endregion

  redraw();
  render();
}


////////////////////// RENDER FUNCTIONS /////////////////////////////////////
function redraw() {
  // Light setup
  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

  // Vertex buffer
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vertex_Position = gl.getAttribLocation(program, 'vertex_Position');
  gl.vertexAttribPointer(vertex_Position, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_Position);

  // Normal buffer
  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  var vertexNormal = gl.getAttribLocation(program, "vertex_Normal");
  gl.vertexAttribPointer(vertexNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexNormal);

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //#region  Orthographic view
    phi += 0.01;
    eye = vec3(radius * Math.sin(phi), radius * Math.sin(theta), radius * Math.cos(phi));

    // modelViewMatrix = lookAt(eye, at, up);
    // projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(45, aspect, 0.1, 100.0);

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
    
    //#endregion

    for (var i = 0; i < index; i += 3) {
      gl.drawArrays(gl.TRIANGLES, i, 3);
    }
    requestAnimFrame(render);

}

////////////////////// TETRAHEDRON FUNCTION ////////////////////////////////
function tetrahedron(a, b, c, d, n) {
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

////////////////////// DIVIDE FUNCTION /////////////////////////////////////
function divideTriangle(a, b, c, count) {
  if (count > 0) {
    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);
    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
  }
  else {
    triangle(a, b, c);
  }
}
////////////////////// TRIANGLE FUNCTION ////////////////////////////////////
function triangle(a, b, c) {
  normals.push(vec4(a[0], a[1], a[2] ,0));
  normals.push(vec4(b[0], b[1], b[2] ,0));
  normals.push(vec4(c[0], c[1], c[2] ,0));

  points.push(a);
  points.push(b);
  points.push(c);

  index += 3;
}

