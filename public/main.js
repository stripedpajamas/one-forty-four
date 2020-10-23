/* CONSTS */
let Peer = window.Peer;
// let Tone = window.Tone;
// Tone.context.resume()

const NOTE_ON_CMD = 144
const NOTE_OFF_CMD = 128
const SYSTEM_TIMING_CLOCK_CMD = 248
const SYSTEM_ACTIVE_SENSING_CMD = 254

let selfIdEl = document.querySelector('#self-id')
let messagesEl = document.querySelector('.messages')
let peerIdEl = document.querySelector('#connect-to-peer')

const peers = new Map()
/*
const peerInstruments = {
  self: new Tone.PolySynth({
    oscillator: {
      type: "square"
    },
    envelope: {
      attack: 0.2
    }
  }).toDestination()
}
*/
const midiInputMap = {} // midi inputs for dropdown
const midiOutputMap = {} // midi outputs for dropdown

let selectedMidiInput = null
let selectedMidiOutput = null // TODO: allow peer=>output mapping
window.midiOutputMap = midiOutputMap
////////////////////////////////////////////////////////////////////////


/* SETUP */
// MIDI access
navigator.requestMIDIAccess().then(access => {
  const { inputs, outputs } = access
  
  createMidiInputDropdown(inputs)
  createMidiOutputDropdown(outputs)
  
  access.onstatechange = (change => {
    console.log(change)
  })
})

// Register with the peer server
let peer = new Peer({
  host: '/',
  path: '/peerjs/myapp'
});
peer.on('open', (id) => {
  selfIdEl.textContent = id
  // logMessage('My peer ID is: ' + id);
});
peer.on('error', (error) => {
  console.error(error);
});

// Handle incoming data connection
peer.on('connection', (conn) => {
  console.log(conn)
  let peerId = Math.random().toString(36).slice(2)
  
  logMessage('incoming peer connection!');
  
  conn.on('data', (msg) => {
    handleMsg(peerId, msg)
  });
  
  conn.on('open', () => {
    peers.set(peerId, conn)
    // addPeerInstrument(peerId)
    console.log(peerId, 'just connected')
  });
  
  conn.on('close', () => {
    peers.delete(peerId)
    // removePeerInstrument(peerId)
    console.log(peerId, 'just disconnected')
  })
});

////////////////////////////////////////////////////////////////////////

/* FUNCS */
let logMessage = (message) => {
  let newMessage = document.createElement('div');
  newMessage.innerText = message;
  messagesEl.appendChild(newMessage);
};

// called when you play something locally
const handleMidiMessage = message => {
  if (!message || !message.data) return

  const [cmd, note, velocity] = message.data
  
  if (cmd !== NOTE_ON_CMD) return

  const payload = {
    type: 'midimessage',
    data: message.data
  }
  peers.forEach(peer => {
    peer.send(payload)
  })
  
  handleMsg('self', payload)
  
  // playSound(peerInstruments.self, message.data)
}

const selectMidiInput = (e) => {
  Object.values(midiInputMap).forEach(input => {
    input.onMidiMessage = null
  })
  selectedMidiInput = midiInputMap[e.target.value]
  if (selectedMidiInput) {
      selectedMidiInput.onmidimessage = handleMidiMessage
  }
}

const selectMidiOutput = (e) => {
  Object.values(midiInputMap).forEach(input => {
    input.onMidiMessage = null
  })
  selectedMidiInput = midiInputMap[e.target.value]
  if (selectedMidiInput) {
      selectedMidiInput.onmidimessage = handleMidiMessage
  }
}

const createMidiInputDropdown = (inputs) => {
  if (!inputs) {
    logMessage('Error: no midi inputs available')
    return
  }
  
  const select = document.getElementById('in-devices')
  inputs.forEach(input => {
    midiInputMap[input.name] = input
    const option = document.createElement('option')
    option.text = input.name
    select.add(option)
  })
  
  select.onchange = (e) => selectMidiInput(e)

  selectedMidiInput = midiInputMap[select.value]
  if (selectedMidiInput) {
      selectedMidiInput.onmidimessage = handleMidiMessage
  }
}

const createMidiOutputDropdown = (outputs) => {
  if (!outputs) {
    logMessage('Error: no midi outputs available')
    return
  }
  
  const select = document.getElementById('out-devices')
  outputs.forEach(output => {
    midiOutputMap[output.name] = output
    const option = document.createElement('option')
    option.text = output.name
    select.add(option)
  })
  
  select.onchange = (e) => selectMidiOutput(e)

  selectedMidiOutput = midiOutputMap[select.value]
}

// Initiate outgoing connection
let connectToPeer = () => {
  let peerId = peerIdEl.value;
  logMessage(`Connecting to ${peerId}...`);
  
  let conn = peer.connect(peerId);
  conn.on('data', (msg) => {
    handleMsg(peerId, msg)
  });
  
  conn.on('open', () => {
    peers.set(peerId, conn)
    // addPeerInstrument(peerId)
    console.log(peerId, 'just connected')
  });
  
  conn.on('close', () => {
    peers.delete(peerId, conn)
    // removePeerInstrument(peerId)
    console.log(peerId, 'just disconnected')
  })
};

function handleMsg (id, msg) {
  const { type, data } = msg

  switch (type) {
    case 'midimessage': {
      // make sounds
      // const instrument = peerInstruments[id]
      // playSound(instrument, data)
      if (selectedMidiOutput) {
        selectedMidiOutput.send(data)
      }
      break
    }
  }
}

/* old peer instrument stuff

const addPeerInstrument = (peer) => {
  const instrument = new Tone.PolySynth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.1
    }
  }).toDestination();
  
  peerInstruments[peer] = instrument
}

const removePeerInstrument = (peer) => {
  delete peerInstruments[peer]
}


const playSound = (instrument, data) => {
  if (!instrument || !data) {
    console.error('sounds will not play, missing data')
    return
  }
  
  if (Tone.context.state !== 'running') {
    Tone.context.resume();
  }
  
  const { '0': cmd, '1': midiNote, '2': velocity } = data
  
  if (!velocity) {
    return
  }
  
  const note = Tone.Frequency(midiNote, 'midi').toNote()
  
  instrument.triggerAttackRelease(note, 0.2)
}
*/

window.connectToPeer = connectToPeer;