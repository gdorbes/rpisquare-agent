# rpi-agent
**rpi-agent** is part of the [rpisquare.com](https://rpisquare.com) service that aims at managing remote Raspberry Pi GPIO-based sensors and actuators.

## Prerequisites

**rpi-agent** is a Nodejs module to run on each *Rasperry Pi* device that you want to manage. The current version has been tested with *Pi 5*, *Pi 4B*, *Pi Zero 2 W* running Raspberry Pi OS v12 a.k.a. Bookworm and  Nodejs v23+.

## Installation

From you project directory, just install the NPM package.

```shell
npm i rpi-agent
```

## Usage

Add the following content in your Nodejs script

``` js
import {rpiAgent} from "rpi-agent"
const debug = true // Show console or not. Default is true
rpiAgent(debug)
```

