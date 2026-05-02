# rpisquare-agent 
![Static Badge](https://img.shields.io/badge/rpisquare--agent-_0.6.x_-FF5500?style=flat) ![Static Badge](https://img.shields.io/badge/Nodejs-%3E_23-66cc33?logo=nodedotjs&logoColor=white) ![Static Badge](https://img.shields.io/badge/NPM-%3E_10-CC3534?logo=npm&logoColor=white) ![Static Badge](https://img.shields.io/badge/Raspberry_Pi-Zero2_4B_5B-C51A4A?logo=raspberrypi&logoColor=white) ![Static Badge](https://img.shields.io/badge/OS-Bookworm_Trixie-0D7AB9?style=flat)

# Work in Progress ⚠️ Don't use yet

**rpisquare-agent** is part of the [rpisquare.com](https://rpisquare.com) service that aims at managing remote Raspberry Pi GPIO-based sensors and actuators. It has been tested with Pi 5, Pi 4B, Pi Zero 2 W running Raspberry Pi OS v12 a.k.a. Bookworm and Nodejs v23+.

**rpisquare-agent** is the module to install on Raspberry Pi devices to manage their GPIOs remotely. See [rpisquare.com](https://rpisquare.com) for further details about the solution architecture and components.

**rpisquare-agent** has been tested with Pi 5, Pi 4B, Pi Zero 2 W running Raspberry Pi OS v12 a.k.a. Bookworm and Nodejs v23+.

## Prerequisites

As **rpisquare-agent**  uses the  [**rpi-io**](https://github.com/gdorbes/rpi-io) module for GPIO interactions, the prerequisites are the same.

Also **rpisquare-agent**  must connected to the Internet to communicate with the *rpisquare API server* based on standard HTTP exchanges and  [socket.io](https://socket.io/) WebSocket.

## Installation

From you project directory, just install the NPM package.

* install the NPM package

```shell
npm i rpisquare-agent
```
## TO BE CONTINUED

## Licence

MIT

