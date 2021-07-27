# H5DMD
A Virtual DMD (Dot Matrix Display) powered by HTML5 (Canvas, WebSockets), controlled via Mission Pinball Framework BCP protocol (https://missionpinball.org/)

![256x78 DMD on a 1280x390 display](/dmd-256x78-mp-logo.jpg?raw=true "1 dot = 4x4 pixels")

Quick demonstration videos (tests before using mpf):

https://youtu.be/ItiX97USKyU

https://www.youtube.com/watch?v=MtAN4vKRLQ0


# Installation
For now the process is quite manual.

- HTTP service installation:
```
# Copy service into system folder (after modifying it to fit your needs)
(sudo) cp http-server.service /etc/systemd/system/

# Refresh systemd
(sudo) systemctl daemon-reload

# Enable service
(sudo) systemctl enable http-server

# Start service (or reboot)
(sudo) systemctl start http-server
```

# Starting the media controller
- Run the server
```
./start.sh (will simply run ws/server.js)
```

- Launch Mission Pinball Framework
```
cd /to/your/mpf/project/folder
mpf
```

# In progress
- Implementing the audio manager on server side

# To do
- Create services for the controller and mpf
- Implement x and y offset to position the dmd in the display