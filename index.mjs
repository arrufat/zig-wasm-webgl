/**
 * index.mjs
 */

const APP = {
    "memory": undefined,
    "canvas": document.querySelector("canvas"),
};

const GL = APP.canvas.getContext('webgl') || APP.canvas.getContext('experimental-webgl');

const shaders = [];
const glPrograms = [];
const glBuffers = [];
const glUniformLocations = [];

const ENV = {
    "compileShader": (sourcePtr, sourceLen, type) => {
        const source = readCharStr(APP, sourcePtr, sourceLen);
        const shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            throw "Error compiling shader:" + GL.getShaderInfoLog(shader);
        }
        shaders.push(shader);
        return shaders.length - 1;
    },
    "linkShaderProgram": (vertexShaderId, fragmentShaderId) => {
        const program = GL.createProgram();
        GL.attachShader(program, shaders[vertexShaderId]);
        GL.attachShader(program, shaders[fragmentShaderId]);
        GL.linkProgram(program);
        if (!GL.getProgramParameter(program, GL.LINK_STATUS)) {
            throw ("Error linking program:" + GL.getProgramInfoLog(program));
        }
        glPrograms.push(program);
        return glPrograms.length - 1;
    },
    "glClearColor": (r, g, b, a) => {
        GL.clearColor(r, g, b, a);
    },
    "glEnable": (x) => {
        GL.enable(x);
    },
    "glDepthFunc": (x) => {
        GL.depthFunc(x);
    },
    "glClear": (x) => {
        GL.clear(x);
    },
    "glGetAttribLocation": (programId, namePtr, nameLen) => {
        GL.getAttribLocation(glPrograms[programId], readCharStr(APP, namePtr, nameLen));
    },
    "glGetUniformLocation": (programId, namePtr, nameLen) => {
        glUniformLocations.push(GL.getUniformLocation(glPrograms[programId], readCharStr(APP, namePtr, nameLen)));
        return glUniformLocations.length - 1;
    },
    "glUniform4fv": (locationId, x, y, z, w) => {
        GL.uniform4fv(glUniformLocations[locationId], [x, y, z, w]);
    },
    "glCreateBuffer": () => {
        glBuffers.push(GL.createBuffer());
        return glBuffers.length - 1;
    },
    "glBindBuffer": (type, bufferId) => {
        GL.bindBuffer(type, glBuffers[bufferId]);
    },
    "glBufferData": (type, dataPtr, count, drawType) => {
        const floats = new Float32Array(APP.memory.buffer, dataPtr, count);
        GL.bufferData(type, floats, drawType);
    },
    "glUseProgram": (programId) => {
        GL.useProgram(glPrograms[programId]);
    },
    "glEnableVertexAttribArray": (x) => {
        GL.enableVertexAttribArray(x);
    },
    "glVertexAttribPointer": (attribLocation, size, type, normalize, stride, offset) => {
        GL.vertexAttribPointer(attribLocation, size, type, normalize, stride, offset);
    },
    "glDrawArrays": (type, offset, count) => {
        GL.drawArrays(type, offset, count);
    }
};

function onWindowLoad(event) {
    setViewportFromApp(APP);
    fetchAndInstantiate('main.wasm', { "env": ENV }).then(function (instance) {
        APP.memory = instance.exports.memory;
        instance.exports.onInit();

        const onAnimationFrame = instance.exports.onAnimationFrame;

        function step(timestamp) {
            onAnimationFrame(timestamp);
            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    });
}

function fetchAndInstantiate(url, importObject) {
    return fetch(url).then(response =>
        response.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, importObject)
    ).then(results =>
        results.instance
    );
}

function readCharStr(app, ptr, len) {
    const bytes = new Uint8Array(app.memory.buffer, ptr, len);
    return new TextDecoder("utf-8").decode(bytes);
}

function setViewportFromApp(app) {
    GL.viewport(0, 0, app.canvas.width, app.canvas.height); // TODO: should be able to use bcr for all of them
}

window.addEventListener("load", onWindowLoad);
