//=============================================================================
//
//    FILE  : website_serial.js
//
//  PROJECT : Web Serial Template
//
//  AUTHOR  : Bill Daniels
//            Copyright 2023-2024, D+S Tech Labs, Inc.
//            All Rights Reserved
//
//=============================================================================

//--- Globals ---------------------------------------------

const dataWindow = document.getElementById ('dataWindow');

let SerialPort   = undefined;
let SerialReader = undefined;
let SerialWriter = undefined;
let PortOpened   = false;

const SerialPortSettings =
{
  baudRate    : 115200,
  dataBits    : 8,
  stopBits    : 1,
  parity      : 'none',
  bufferSize  : 1024,
  flowControl : 'none'
};

//--- class LineBreakTransformer --------------------------

class LineBreakTransformer
{
  constructor ()
  {
    this.container = '';
  }

  transform (chunk, controller)
  {
    this.container += chunk;
    const lines = this.container.split ('\r\n');
    this.container = lines.pop();
    lines.forEach (line => controller.enqueue(line));
  }

  flush (controller)
  {
    controller.enqueue (this.container);
  }
}

//--- StartUp ---------------------------------------------

try
{
  // Check if this browser supports serial communication
  if (!('serial' in navigator) || navigator.serial == undefined)
    alert ('This browser does not support serial communications.\nPlease use the Chrome browser.');
  else
  {
    // Close serial port before exit
    window.addEventListener ('beforeunload', async (event) =>
    {
      event.preventDefault  ();
      event.stopPropagation ();

      await ClosePort ();
    });

    // Add connect/disconnect event handling
    navigator.serial.addEventListener ('connect', (event) =>
    {
      console.debug ('Received connect event');
    });

    navigator.serial.addEventListener ('disconnect', (event) =>
    {
      console.debug ('Received disconnect event');
    });
  }
}
catch (ex)
{
  alert (ex);
}

//--- ChoosePort ------------------------------------------

async function ChoosePort (event)
{
  try
  {
    // Disregard if port is already opened
    if (PortOpened)
      return;

    try
    {
      SerialPort = await navigator.serial.requestPort ();  // requestPort ({ filters });
    }
    catch (ex) { return; }  // ignore if no port choosen ('Failed to execute ...')

    if (SerialPort != undefined)
      await OpenPort ();
  }
  catch (ex)
  {
    alert (ex);
  }
}

//--- OpenPort --------------------------------------------

async function OpenPort ()
{
  try
  {
    if (SerialPort == undefined || PortOpened)
      return;

    // Open serial port
    try
    {
      await SerialPort.open (SerialPortSettings);
    }
    catch (ex)
    {
      alert (ex);

      await ClosePort ();
      return;
    }

    // Check if port/device is valid
    const portInfo = SerialPort.getInfo ();
    if (portInfo == undefined)
      alert ('Unable to connect to serial device.');
    else if (portInfo.usbVendorId == undefined && portInfo.usbProductId == undefined)
      alert ('The serial device is not from a valid vendor.');
    else
    {
      PortOpened = true;

      //=================================================
      //  Setup Serial Reader for text
      //=================================================
      // Pipe input data thru a UTF-8 text decoder and line handler
      SerialReader = SerialPort.readable
        .pipeThrough (new TextDecoderStream ())
        .pipeThrough (new TransformStream (new LineBreakTransformer ()))
        .getReader ();

      //=================================================
      //  Setup Serial Writer for text
      //=================================================
      const textEncoder = new TextEncoderStream ();
      textEncoder.readable.pipeTo (SerialPort.writable);
      SerialWriter = textEncoder.writable.getWriter ();

      // Hide choose button and show comms
      document.getElementById ('chooseButton').style.display = 'none';
      document.getElementById ('comms'       ).style.display = 'inline';

      dataWindow.innerHTML = 'Port opened<br>';

      // Listen for incoming data
      await ReadLoop ();
    }
  }
  catch (ex)
  {
    alert (ex);
  }
}

//--- ReadLoop --------------------------------------------

async function ReadLoop ()
{
  try
  {
    let readResult = { value:'', done:false };

    while (true)
    {
      readResult = await SerialReader.read ();

      if (readResult.done)
        throw ('SerialReader is done');

      // Process message from your device
      ProcessMessage (readResult.value);
    }
  }
  catch (error)
  {
    alert (error);
    await ClosePort ();
  }
}

//--- ProcessMessage -----------------------------------------

function ProcessMessage (message)
{
  try
  {
    dataWindow.innerHTML += '──▶ ' + message + '<br>';
  }
  catch (ex)
  {
    alert (ex);
  }
}

//--- SendCommand -----------------------------------------

function SendCommand ()
{
  try
  {
    const command = document.getElementById ('commandField').value;

    SerialWriter.write (command + '\n');
    dataWindow.innerHTML += '◀── ' + command + '<br>';
  }
  catch (ex)
  {
    alert (ex);
  }
}

//--- ClosePort -------------------------------------------

async function ClosePort ()
{
  try
  {
    if (SerialWorker != undefined)
    {
      SerialWorker.terminate ();
      SerialWorker = undefined;
    }

    if (SerialReader != undefined)
    {
      try { await SerialReader.cancel      (); } catch (ex) { }
      try {       SerialReader.releaseLock (); } catch (ex) { }
    }

    if (SerialWriter != undefined)
    {
      try { await SerialWriter.close       (); } catch (ex) { }
      try {       SerialWriter.releaseLock (); } catch (ex) { }
    }

    if (SerialPort != undefined)
    {
      try { await SerialPort.close (); } catch (ex) { }

      PortOpened = false;
    }
  }
  catch (ex)
  {
    alert (ex);
  }
}
