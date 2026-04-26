# rpisquare-agent
![Static Badge](https://img.shields.io/badge/rpi--io-_2.1.x_-FF5500?style=flat) ![Static Badge](https://img.shields.io/badge/Nodejs-%3E_23-66cc33?logo=nodedotjs&logoColor=white) ![Static Badge](https://img.shields.io/badge/NPM-%3E_10-CC3534?logo=npm&logoColor=white) ![Static Badge](https://img.shields.io/badge/Raspberry_Pi-Zero2_4B_5B-C51A4A?logo=raspberrypi&logoColor=white) ![Static Badge](https://img.shields.io/badge/OS-Bookworm_Trixie-0D7AB9?style=flat)

Current version is 0.6.x. More details in [CHANGELOG.md](CHANGELOG.md).




**rpisquare-agent** is part of the [rpisquare.com](https://rpisquare.com) service that aims at managing remote Raspberry Pi GPIO-based sensors and actuators. 

**rpisquare-agent** is the module to install on Raspberry Pi devices to manage their GPIOs remotely. See [rpisquare.com](https://rpisquare.com) for further details about the solution architecture and components.

## Prerequisites

**rpi-agent** is a Nodejs module to run on each *Rasperry Pi* device that you want to manage. The current version has been tested with *Pi 5*, *Pi 4B*, *Pi Zero 2 W* running Raspberry Pi OS v12 a.k.a. Bookworm and  Nodejs v23+.

## Installation

From you project directory, just install the NPM package.

```shell
npm i rpi-agent
```

## Usage

Add the following content to your Nodejs script

``` js
import {rpiAgent} from "rpi-agent"
const debug = true // Show console or not. Default is true
rpiAgent(debug)
```

## Status

Work in progress. Further details to come soon.