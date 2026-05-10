# rpisquare-agent 
![Static Badge](https://img.shields.io/badge/rpisquare--agent-_1.0.x_-FF5500?style=flat) ![Static Badge](https://img.shields.io/badge/Nodejs-%3E_23-66cc33?logo=nodedotjs&logoColor=white) ![Static Badge](https://img.shields.io/badge/NPM-%3E_10-CC3534?logo=npm&logoColor=white) ![Static Badge](https://img.shields.io/badge/Raspberry_Pi-Zero2_4B_5B-C51A4A?logo=raspberrypi&logoColor=white) ![Static Badge](https://img.shields.io/badge/OS-Bookworm_Trixie-0D7AB9?style=flat)



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
npm install https://github.com/gdorbes/rpisquare-agent/tarball/v1.0

# Compile rpi-io module to complete install
cd node_modules/rpi-io/
npm install
cd ../..
```

## First launch

### Step 1: Create an account on [app.rpisquare.com](https://app.rpisquare.com)

As **rpisquare-agent** purpose is to execute GPIO-related command initiated by remote scripts.  It is then mandatory to link the device where the agent is installed with a defined user.  

This is done using the  [app.rpisquare.com](https://app.rpisquare.com) web app which is the is the place to configure what devices and peripherals can be controlled remotely by some user.

The very first step is then to sign up / sign in to  [app.rpisquare.com](https://app.rpisquare.com) which is a free service that just requires a valid email address to be used.

When done, you can then register as many agents as you wish from the web app.

### Step 2: Register your device on [app.rpisquare.com](https://app.rpisquare.com)

Registering **rpisquare-agent**  agent installed on  a Raspberry Pi device is a straightforward process:

1. Launch the agent from your project directory and read logged data in your console.

```sh
# Launch test script from your project directory
~/myAgent $ node node_modules/rpisquare-agent/test/launch-agent.mjs
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
   * The green point 🟢  close to the agent name in side list means that the agent is connected to the server and ready to receive commands. If not, the point is red 🔴.
   * By default, the agent name is the serial number of the RPi device, but you can rename it with your own friendly name
   * You can export/import each agent configuration for backup and easy device reinstall if required.

![peripherals](https://raw.githubusercontent.com/gdorbes/rpisquare-agent/refs/heads/master/img/declaring-peripherals.webp)

Your agent is now ready to receive commands either from  the [rpisquare-sdk](https://github.com/gdorbes/rpisquare-sdk) integrated into your project or from  [app.rpisquare.com](https://app.rpisquare.com)  where you can test your remote peripherals as in the example above:

* Start/Stop monitoring of input GPIO and see results in the embedded console.
* Set/Reset output GPIO and check results on your electronic circuit.
* Control PWM peripherals thanks to sliders.



## Next launches

### Manual launches from your project directory

#### Simple launch command

```sh
# Launch test script from project directory
~/myAgent $ node test/launch-agent.mjs 
```



#### Simple launch from Node.js script

```javascript
// Import module
import {rpisquareAgent} from "./node_modules/rpisquare-agent/esm/rpa.mjs"
// Launch  module without parameters 
rpisquareAgent()
```



#### Launch from Node.js script with parameters

```javascript
// Import module
import {rpisquareAgent} from "./node_modules/rpisquare-agent/esm/rpa.mjs"
// Launch  module with optional parameters 
rpisquareAgent({
    room: '',
    logLevel: 2, // 2: log+warning, 1: log, 0: none
    restartTimeOut: 2, // in seconds
})
```

The example above is presented with the default parameters.

**Parameter `room`**

`room`  is a user communication room ID (see user section in [app.rpisquare.com](https://app.rpisquare.com)). By default, this parameter is empty as it is retrieved during the registration step and read locally  after.

The only case where you may need to use this parameter is if you reinstall your device that is already registered. In this situation you can force the agent to be linked to its user communication room.

```javascript
import {rpisquareAgent} from "./node_modules/rpisquare-agent/esm/rpa.mjs"
rpisquareAgent({
    room: 'abcddfbc12345678bfdf226290f8316d'
})
```

PLEASE NOTE: A device already registered with some specific user cannot be attached to another user; it must be deleted first from the initial user account in [app.rpisquare.com](https://app.rpisquare.com).

**Parameter `logLevel`**

The logging level may have 3 values:

2. warning and standard log (default)

1. warning only

0. none

**Parameter `restartTimeOut`**

`restartTimeOut` is a delay in seconds before agent restart in case of issues such as network error.



### Automatic launch on device boot

#### 1. Create a service file

```sh
sudo nano /etc/systemd/system/my-agent-script.service
```

```sh
[Unit]
# Name shown in systemctl status and logs
Description=rpisquare-agent

# Wait for the network to be fully online before starting
After=network-online.target
Wants=network-online.target

[Service]
Type=simple

# To replace with your own username and project directory
User=pi
WorkingDirectory=/home/pi/myAgent

# The actual command to run — use the full path to node (check with: which node)
ExecStart=/usr/bin/node /home/pi/myAgent/node_modules/rpisquare-agent/test/launch-agent.mjs

# Restart the service if it exits with an error (non-zero exit code or signal)
# "always" would restart even on clean exit — "on-failure" is safer
Restart=on-failure

# Wait 5 seconds before attempting a restart (avoids tight crash loops)
RestartSec=5

# Send stdout to the systemd journal (accessible via journalctl)
StandardOutput=journal

# Send stderr to the systemd journal as well
StandardError=journal

# Inline environment variable — add as many as needed
Environment=NODE_ENV=production

# Alternatively, load variables from a file (uncomment to use):
# EnvironmentFile=/home/pi/my-app/.env

[Install]
# Start this service when the system reaches the standard multi-user state
# (i.e. normal boot, after all basic services are up)
WantedBy=multi-user.target
```

 #### 2. Enable and start the service

```sh
sudo systemctl daemon-reload
sudo systemctl enable my-agent-script.service
sudo systemctl start my-agent-script.service
```

#### 3. Useful commands

```sh
sudo systemctl status my-agent-script.service   # check status
journalctl -u my-agent-script.service -f        # live logs
sudo systemctl restart my-agent-script.service  # restart
```



## Licence

MIT

