# rpisquare-agent 
![Static Badge](https://img.shields.io/badge/rpisquare--agent-_0.6.x_-FF5500?style=flat) ![Static Badge](https://img.shields.io/badge/Nodejs-%3E_23-66cc33?logo=nodedotjs&logoColor=white) ![Static Badge](https://img.shields.io/badge/NPM-%3E_10-CC3534?logo=npm&logoColor=white) ![Static Badge](https://img.shields.io/badge/Raspberry_Pi-Zero2_4B_5B-C51A4A?logo=raspberrypi&logoColor=white) ![Static Badge](https://img.shields.io/badge/OS-Bookworm_Trixie-0D7AB9?style=flat)

# Work in Progress ⚠️ Don't use yet

**rpisquare-agent** is part of the [rpisquare.com](https://rpisquare.com) service that aims at managing remote Raspberry Pi GPIO-based sensors and actuators. It has been tested with Pi 5, Pi 4B, Pi Zero 2 W running Raspberry Pi OS v12 a.k.a. Bookworm and Nodejs v23+.

**rpisquare-agent** is the module to install on Raspberry Pi devices to manage their GPIOs remotely. See [rpisquare.com](https://rpisquare.com) for further details about the solution architecture and components.

**rpisquare-agent** has been tested with Pi 5, Pi 4B, Pi Zero 2 W running Raspberry Pi OS v12 a.k.a. Bookworm and Nodejs v23+.



## Prerequisites

**rpisquare-agent**  is based on the  [**rpi-io**](https://github.com/gdorbes/rpi-io) module for GPIO interactions, thus **check carefully [rpi-io prerequisites](https://github.com/gdorbes/rpi-io#prerequisites)** before going further.

Also **rpisquare-agent**  must be connected to the Internet to communicate with the *rpisquare API server* to register and to receive commands. Theses communications use standard HTTP and  [socket.io](https://socket.io/) WebSocket.

IT IS STRONGLY RECOMMENDED TO TEST YOUR ELECTRONIC CIRCUIT LOCALLY ON YOUR RASPBERRY PI DEVICE USING THE  [**rpi-io**](https://github.com/gdorbes/rpi-io) MODULE BEFORE CONSIDERING ANY REMOTE USE. 



## Installation

From you project directory e.g. `~/myAgent`

```shell
# Go to your Raspberry Pi project main directory.
cd ~/myAgent

# Load rpisquare-agent module from Github latest release
npm install https://github.com/gdorbes/rpisquare-agent/tarball/v0.7.1

# Compile rpi-io module to complete install and back to your project directory
cd node_modules/rpi-io/
npm install
cd ../..
```

## First launch

### Step 1: Create an account on [app.rpisquare.com](https://app.rpisquare.com)

As **rpisquare-agent** purpose is to execute GPIO-related command initiated by remote scripts.  It is then mandatory to link the device where the agent is installed with a defined user.  

This is done with the  [app.rpisquare.com](https://app.rpisquare.com) web app which is the is the place to configure what devices and peripheral can be controlled remotely by some user.

The very first step is then to sign up to  [app.rpisquare.com](https://app.rpisquare.com) which is a free service that just requires a valid email address to be used.

When done, you can then register as many agents as you wish from the web app.

### Step 2: Register your device on [app.rpisquare.com](https://app.rpisquare.com)

Registering **rpisquare-agent**  agent installed on  a Raspberry Pi device is a straightforward process:

1. Launch the agent from your project directory and read looged data in your console.

```sh
# Launch test script from project directory
~/myAgent $ node test/launch-agent.mjs 
10:40:20.768 🔎  hardware: raspberry
10:40:20.895 🔎  model: raspberry pi 5 model b rev 1.0
10:40:20.896 🔎  operating system: { version: '12', name: 'bookworm' }
10:40:20.896 🔎  network interface: wlan
10:41:42.974 🔎  hardware: raspberry
10:41:43.006 🔎  model: raspberry pi 5 model b rev 1.0
10:41:43.006 🔎  operating system: { version: '12', name: 'bookworm' }
10:41:43.007 🔎  network interface: wlan
10:41:43.007 🔎  serial number: 55a43dc5bf9a8f54
10:41:43.217 🔎  socket is connected: rNVvFa2lm09PaFgRAAC7
```

2. Copy your device serial number. In this example: `55a43dc5bf9a8f54`.
3. In  [app.rpisquare.com](https://app.rpisquare.com), click the ✚ sign to register a new RPi, paste the serial number in the form and click OK.  Your RPi device is now linked to your user account 

![register](https://raw.githubusercontent.com/gdorbes/rpisquare-agent/refs/heads/master/img/registering-serial-number.webp)

### Step 3: Declare your peripherals on [app.rpisquare.com](https://app.rpisquare.com)

2. You can now declare your GPIOs as in the example below. Please note:
   * The green point 🟢  close to the agent name in side list means that the agent is connected to the server. If not, the point is red 🔴.
   * By default, the agent name is the serial number on its device, but you can rename it with your own friendly name
   * You can export/import each agent configuration for backup and easy device reinstall if required.

![peripherals](https://raw.githubusercontent.com/gdorbes/rpisquare-agent/refs/heads/master/img/declaring-peripherals.webp)

### Identify device Serial Number

On first launch, the agent is not associated to any user.

### Agent registration 

### Agent already registered



## Further launches

### Manual launches

### Automatic launch on device boot

## Licence

MIT

