# Homebridge sonos play

I couldn't find a working integration for playing mp3 files via the home app, thus, I created a small plugin that are able to send tracks to Sonos.

I Use this for an alarm - the switch is easily automatable inside the app.

## Features:

The plugin allows you to create switches that when toggled on starts playing any mp3(and other formats that sonos supports) files.

You can customize volume, delay and timeout for these tracks, as well as which sonos devices should play the track.

## Installing:

Using the homebridge web UI, or:

```
npm i -g homebridge-sonos-player
```

## Configuration:

Either configure the plugin using the homebridge web ui, or though json:

```json
{
  "platform": "SonosPlayerJub",
  "switches": [
    {
      "name": "Switch name goes here - this will be seen in the home app",
      "trackUri": "Location of the mp3 file - must be located somewhere the Sonos devices can find it",
      "volume": 10,
      "delay": 100,
      "timeout": 10,
      "sonosSpeakerNames": ["Sonos-1"]
    },
    {
      "name": "Switch name goes here - this will be seen in the home app",
      "trackUri": "http://(...)",
      "volume": 10,
      "delay": 100,
      "timeout": 10,
      "sonosSpeakerNames": ["Sonos-1", "Sonos-2"]
    }
  ]
}
```

- `platform` **required**: must always be "SonosPlayerJub"

Switch object:

- `name` **required**: Name of the switch
- `trackUri` **required**: Url for the audio file location. This could be either on WAN or though the internet.
- `sonosSpeakerNames` **required**: Array for defining which speakers should play when the switch is activated
- `volume` optional: Volume (in procentage) the speaker(s) should change to. Reverts back to the volume it was before the switch getting activated. Defaults to 25%.
- `delay` optional: Delay (in ms) between the toggle on, and the audio plays. Defaults to 100ms
- `timeout` optional: When Sonos should return to the original track (in seconds). I recommend setting this to the audio length in seconds + 2

## Thanks to:

A big thanks to [bencevans](https://github.com/bencevans) for creating a node package to detect and send api calls to Sonos, and to [svrooij](https://github.com/svrooij) for creating a typescript port. Without these, this plugin wouldn't have been created!
