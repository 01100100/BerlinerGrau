# Berliner Grau 🎨

Living in Berlin, you often hear people talking about how grey it is. I found a Raspberry Pi with a camera and had an idea to combine my love of looking up at the sky with some old technology and create something to quantify the seasonal greyness of Berlin.

While I would like to say there is a deeper meaning to this project, I just wanted to build something, and give me some quests to help get familiar with some technical intricacies of the internet.

## The Idea 💡

- [ ] Raspberry Pi with camera mounted to look out of the window
- [ ] Script to take a photo every hour and calculate statistics
- [ ] Use a github repo to store the data
- [ ] Static site displaying 8x8 pixelated image of the sky and stats

## Step 1: Set up the Raspberry Pi 🥧

The first step was to set up the Raspberry Pi so I could start working on it. The official [Raspberry Pi Imager](https://www.raspberrypi.com/software/) makes everything super easy, providing options to set up a headless system with WiFi and SSH pre-enabled.

I had a fresh image downloaded onto a microSD card within 10 minutes, and was simply able to plug in the card, turn on the Pi and connect to it over SSH:

```bash
ssh pi@123.456.789.0 # you will have to change this 😉
```

## Step 2: Taking a photo (aka the data maker) 📸

The next step was to script the camera to take a photo every 5 minutes.

I decide to write a simple python script to take a photo, parse some interesting data from the image and push the data to a github repo via git.

I use Uv these days as my goto python environment tool of choice,  I wanted to write code from my laptop and manage the environment with `uv` and nicely define dependencies a la good practice... but I actually bumped into some issues with the `picamera2` library.

```bash
(berlinergrau) ➜  BerlinerGrau git:(main) ✗ uv add picamera2 
  × Failed to build `python-prctl==1.8.1`
  ├─▶ The build backend returned an error
  ╰─▶ Call to `setuptools.build_meta:__legacy__.build_wheel` failed (exit status: 1)

      [stderr]
      This module only works on linux

      hint: This usually indicates a problem with the package or the build environment.
```

The rpi comes with the package `picamera` pre-installed into a system python environment... and the docs recommend using this over a pip install.

I wasn't fussed to waste time figuring out how to get everything to work in `uv`, maybe next time. Instead, I went back to the good old raw pip installing over ssh on the remote and threw in some liberal `--break-system-packages` usage. Living on the edge.

```bash
dave@shredberrypi:~/Code/BerlinerGrau$ pip install gitpython --break-system-packages
Defaulting to user installation because normal site-packages is not writeable
Looking in indexes: https://pypi.org/simple, https://www.piwheels.org/simple
Collecting gitpython
  Downloading https://www.piwheels.org/simple/gitpython/GitPython-3.1.44-py3-none-any.whl (207 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 207.6/207.6 kB 1.6 MB/s eta 0:00:00
Collecting gitdb<5,>=4.0.1
  Downloading https://www.piwheels.org/simple/gitdb/gitdb-4.0.12-py3-none-any.whl (62 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 62.8/62.8 kB 2.6 MB/s eta 0:00:00
Collecting smmap<6,>=3.0.1
  Downloading https://www.piwheels.org/simple/smmap/smmap-5.0.2-py3-none-any.whl (24 kB)
Installing collected packages: smmap, gitdb, gitpython
Successfully installed gitdb-4.0.12 gitpython-3.1.44 smmap-5.0.2
```

I set up git creds on the rpi and was pretty much done. I set up a repo on github and was ready to let the rpi do its thing 😁
