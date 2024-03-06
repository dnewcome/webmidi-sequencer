const stride = 30;
const step_width = 20;
const c = document.querySelector("#grid");
const track_notes = document.querySelectorAll("input");
const midi_root_note = 60;
const gate_time = 200;

let bpm = 120;
let beat_length = 60000/120;
let tick_length = beat_length/4;
let grid_width = 16;
let grid_height = 6;
let beat = 0;

let note_values = Array(grid_height).fill().map((v,i)=>{
    return midi_root_note + i;
});

note_values.map((item, i) => {
  let el = document.createElement("input");
  el.size = 3;
  el.value = item;
  document.querySelector("#note-values").appendChild(
	  el
  );
  el.addEventListener("change", (e)=>{
     note_values[i] = parseInt(e.target.value);
  });
});

let tracks = Array(grid_height)
  .fill()
  .map(() => {
    return Array(grid_width).fill(0);
  });

c.width = grid_width * (stride);
c.height = grid_height * (stride);

// wire up event handlers for midi note inputs
Array.from(track_notes).map((item, i)=>{
    item.value = i + midi_root_note;
    item.addEventListener("change", (e)=>{
	note_values[i] = parseInt(e.target.value);
    });
});

// wire up click handlers for enabling/disabling ticks in the grid
c.addEventListener("click", (event) => {
  console.log("click");
  // todo: use getComputedStyle
  // getBoundingClientRect does not account for borders
  const bb = c.getBoundingClientRect();
  const x = Math.floor(((event.clientX - bb.left) / bb.width) * c.width);
  const y = Math.floor(((event.clientY - bb.top) / bb.height) * c.height);
  get_tick(x, y);
});

// draw a sequencer step button in the UI
let step = (x, y, v) => {
  let ctx = c.getContext("2d");
  ctx.strokeStyle = x == beat ? "red" : "black";
	if(x == beat && v != 0) {
	      playNote(note_values[y]);
	}
  ctx.lineWidth = 1;
  // offset by one due to canvas rendering detail that line width lies
  // in the center of stroke, so steps on edge look thin
  ctx.strokeRect(x * stride + 1, y * stride + 1, step_width, step_width);
  if (v == 1) {
    ctx.fillRect(x * stride + 1, y * stride + 1, step_width, step_width);
  }
};

const playNote = (n) => {
    sendNote(
      midi,
      "4BC23DFD90E633284BC0384FDE0364CC5CAED5A2B725F1FF78482AC46CA9CA6C",
      n
    );
}

// redraw the scren 
const update = () => {
  let ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  tracks.map((row, i) => {
    row.map((v, j) => {
      step(j, i, v);
    });
  });
  // ctx.fillText(beat, c.width - 8, c.height - 5);
};

// look up which tick is clicked on
const get_tick = (x, y) => {
  // todo: account for slack space between ticks
  row = Math.floor(y / stride);
  col = Math.floor(x / stride);
  tracks[row][col] = Math.abs(tracks[row][col] - 1);
  update();
};

let midi = null; // global MIDIAccess object
function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
}

function onMIDIFailure(msg) {
  console.error(`Failed to get MIDI access - ${msg}`);
}
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function sendNote(midiAccess, portID, n) {
  const noteOnMessage = [0x90, n, 0x7f]; // note on, middle C, full velocity
  const noteOffMessage = [0x80, n, 0x00]; // note off, middle C
  const output = midiAccess.outputs.get(portID);
  output.send(noteOnMessage); // sends the message.
  console.log(`note on ${n}`);
  setTimeout(()=>{
	console.log(`note off ${n}`);
        output.send(noteOffMessage)
  }, gate_time);
}

const start = () => {
  setInterval(() => {
    update();
    beat = (beat + 1) % grid_width;
  }, tick_length);
};

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
