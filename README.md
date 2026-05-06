# rpisquare-agent 
![Static Badge](https://img.shields.io/badge/rpisquare--agent-_0.6.x_-FF5500?style=flat) ![Static Badge](https://img.shields.io/badge/Nodejs-%3E_23-66cc33?logo=nodedotjs&logoColor=white) ![Static Badge](https://img.shields.io/badge/NPM-%3E_10-CC3534?logo=npm&logoColor=white) ![Static Badge](https://img.shields.io/badge/Raspberry_Pi-Zero2_4B_5B-C51A4A?logo=raspberrypi&logoColor=white) ![Static Badge](https://img.shields.io/badge/OS-Bookworm_Trixie-0D7AB9?style=flat)

# Work in Progress ⚠️ Don't use yet

**rpisquare-agent** is part of the [rpisquare.com](https://rpisquare.com) service that aims at managing remote Raspberry Pi GPIO-based sensors and actuators. It has been tested with Pi 5, Pi 4B, Pi Zero 2 W running Raspberry Pi OS v12 a.k.a. Bookworm and Nodejs v23+.

**rpisquare-agent** is the module to install on Raspberry Pi devices to manage their GPIOs remotely. See [rpisquare.com](https://rpisquare.com) for further details about the solution architecture and components.

**rpisquare-agent** has been tested with Pi 5, Pi 4B, Pi Zero 2 W running Raspberry Pi OS v12 a.k.a. Bookworm and Nodejs v23+.



## Prerequisites

As **rpisquare-agent**  is based on the  [**rpi-io**](https://github.com/gdorbes/rpi-io) module for GPIO interactions, **check carefully [rpi-io prerequisites](https://github.com/gdorbes/rpi-io#prerequisites)** before going further.

Also **rpisquare-agent**  must be connected to the Internet to communicate with the *rpisquare API server* to register and to receive commands. Theses communications use standard HTTP and  [socket.io](https://socket.io/) WebSocket.



## Installation

From you project directory e.g. `~/myAgent`

```shell
# Go to your Raspberry Pi project main directory.
cd ~/myAgent

# Load rpisquare-agent module from Github latest release
npm install https://github.com/gdorbes/rpisquare-agent/tarball/v0.6.2

# Compile rpi-io module
cd node_modules/rpi-io/
npm install
cd ../..

# Launch agent
node node_modules/rpisquare-agent/agent.mjs
```


## First launch

### Sign up to [app.rpisquare.com](https://app.rpisquare.com)

REMINDER: Rpisquare agent purpose is to execute GPIO-related command initiated by remote scripts.  It is then mandatory to link the device where the agent is installed with a defined user. 

As [app.rpisquare.com](https://app.rpisquare.com) is the place to configure what devices and peripheral can be controlled remotely, you must then sign up to [app.rpisquare.com](https://app.rpisquare.com) to declare what devices are installed with a an rpisquare agent.

PLEASE NOTE : [app.rpisquare.com](https://app.rpisquare.com)  is a free service and just requires a valid email address to be used.

When you are signed in, you can then register as many agents as you wish from the web app.

### Identify device Serial Number

On first launch, the agent is not associated to any user.

### Agent registration 

### Agent already registered



## Further launches

### Manual launches

### Automatic launch on device boot

## Licence

MIT

