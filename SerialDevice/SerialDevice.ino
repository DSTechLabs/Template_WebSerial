//==============================================================================
//
//      FILE : SerialDevice.ino
//
//   PROJECT : Any
//
//  FUNCTION : Template for Serial Device
//
//    AUTHOR : Bill Daniels
//             Copyright 2023-2024, D+S Tech Labs, Inc.
//             All Rights Reserved
//
//=============================================================================

//--- Includes ----------------------------------------------------------------

#include <Arduino.h>

//--- Defines -----------------------------------------------------------------

#define SERIAL_BAUDRATE     115200L
#define MAX_COMMAND_LENGTH  80       // Update this length to hold your longest command

//--- Globals -----------------------------------------------------------------

char  commandString[MAX_COMMAND_LENGTH] = "";  // Command from Serial client (Chrome browser web app)
int   commandLength = 0;
char  nextChar;


//=========================================================
//  setup
//=========================================================

void setup()
{
  Serial.begin (SERIAL_BAUDRATE);
}

//=========================================================
//  loop
//=========================================================

void loop()
{
  // Check for any commands from UI app
  if (commandReady ())
  {
    executeCommand ();
    commandLength = 0;
  }
}

//--- commandReady ----------------------------------------

bool commandReady ()
{
  while (Serial.available ())
  {
    nextChar = (char) Serial.read ();

    if (nextChar != '\r')  // ignore CR's
    {
      if (nextChar == '\n')
      {
        // Command is ready, terminate string and process it
        commandString[commandLength] = 0;
        return true;
      }

      // Add char to end of buffer
      if (commandLength < MAX_COMMAND_LENGTH - 1)
        commandString[commandLength++] = nextChar;
      else  // too long
      {
        Serial.println ("ERROR: Command is too long.");

        // Ignore and start new command
        commandLength = 0;
      }
    }
  }

  return false;
}

//--- executeCommand --------------------------------------

void executeCommand ()
{
  // Parse and execute the command in commandString
  // ....

  Serial.println ("Command executed");
}
