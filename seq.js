const stride = 30;
const step_width = 20;
const c = document.querySelector("#grid");

let grid_width = 16;
let grid_height = 10;
let beat = 0;
let tracks = Array(grid_height)
  .fill()
  .map(() => {
    return Array(grid_width).fill(0);
  });

c.addEventListener("click", (event) => {
  // todo: use getComputedStyle
  // getBoundingClientRect does not account for borders
  const bb = c.getBoundingClientRect();
  const x = Math.floor(((event.clientX - bb.left) / bb.width) * c.width);
  const y = Math.floor(((event.clientY - bb.top) / bb.height) * c.height);
  console.log(get_tick(x, y));
});

let step = (x, y, v) => {
  let ctx = c.getContext("2d");
  ctx.strokeStyle = x == beat ? "red" : "black";
  ctx.strokeRect(x * stride, y * stride, step_width, step_width);
  if (v == 1) {
    ctx.fillRect(x * stride, y * stride, step_width, step_width);
  }
};

const update = () => {
  let ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  tracks.map((row, i) => {
    row.map((v, j) => {
      step(j, i, v);
    });
  });
  ctx.fillText(beat, c.width - 30, c.height - 30);
};

// look up which tick is clicked on
const get_tick = (x, y) => {
  // todo: account for slack space between ticks
  row = Math.floor(y / stride);
  col = Math.floor(x / stride);
  console.log(row, col);
  tracks[row][col] = Math.abs(tracks[row][col] - 1);
  console.log(tracks[row][col]);
  update();
};

const play_beat = (n) => {};

let midi = null; // global MIDIAccess object
function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
}

function onMIDIFailure(msg) {
  console.error(`Failed to get MIDI access - ${msg}`);
}

const start = () => {
  setInterval(() => {
    beat = (beat + 1) % 16;
    update();
    console.log("tick");
    sendMiddleC(
      midi,
      "4BC23DFD90E633284BC0384FDE0364CC5CAED5A2B725F1FF78482AC46CA9CA6C",
    );
  }, 250);
};

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function sendMiddleC(midiAccess, portID) {
  const noteOnMessage = [0x90, 60, 0x7f]; // note on, middle C, full velocity
  const noteOffMessage = [0x80, 60, 0x00]; // note off, middle C
  const output = midiAccess.outputs.get(portID);
  output.send(noteOnMessage); // sends the message.
}

function listInputsAndOutputs() {
  for (const entry of midi.inputs) {
    const input = entry[1];
    console.log(
      `Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` +
        ` version:'${input.version}'`,
    );
  }

  for (const entry of midi.outputs) {
    const output = entry[1];
    console.log(
      `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
    );
  }
}

start();