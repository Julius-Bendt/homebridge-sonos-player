import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { SonosHomebridgePlatform } from './SonosHomebridgePlatform';
import { IPluginDevice } from './interfaces/IPluginDevice';

import { SonosDevice } from '@svrooij/sonos/lib';
import { PlayNotificationOptions } from '@svrooij/sonos/lib/models';

export class SonosPlatformAccessory {
  private service: Service;

  private state = {
    on: false,
    playing: false,
  };

  constructor(
    private readonly platform: SonosHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly pluginDevice: IPluginDevice,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Jub')
      .setCharacteristic(this.platform.Characteristic.Model, 'Sonos play on toggle');


    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);


    this.service.setCharacteristic(this.platform.Characteristic.Name, this.pluginDevice.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }


  async setOn(value: CharacteristicValue) {
    const castedValue = value as boolean;
    if (castedValue === this.state.on) {
      this.platform.log.debug(`Skipping setting on value for ${this.pluginDevice.name}`);
      return;
    }
    this.state.on = castedValue;

    if (!castedValue) {
      this.platform.log.info(`Stopping plugin device ${this.pluginDevice.name}`);
      this.stopPlaying();
      return;
    }

    this.platform.log.info(`Playing plugin device ${this.pluginDevice.name}`);
    await this.playNotification();

    // Deactivate the switch, after the sound has been played
    this.state.on = false;
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.on;
    this.platform.log.debug(`Get Characteristic On for '${this.pluginDevice.name}' ->`, isOn);

    return isOn;
  }

  async playNotification() {
    const sonos: Array<SonosDevice> = this.findDevices();
    let promises: Array<Promise<boolean>> = [];

    // First, set the desired data:
    try {
      sonos.forEach(device => {

        if (this.pluginDevice.isNotification) {
          const options: PlayNotificationOptions = {
            trackUri: this.pluginDevice.trackUri,
            delayMs: this.pluginDevice.delay,
            timeout: this.pluginDevice.timeout,
            volume: this.pluginDevice.volume,
          };

          promises.push(device.PlayNotification(options));

        } else {
          // If you're reading the code, and wondering why I'm not using the PlayNotification-function
          // I had lots of trouble with it - these three functions below seems to work like a charm.
          // It is, however, not pretty
          promises.push(device.Stop());
          promises.push(device.SetAVTransportURI(this.pluginDevice.trackUri));
          promises.push(device.SetVolume(this.pluginDevice.volume));
        }


      });

      await Promise.all(promises);

    } catch (exception) {
      this.platform.log.error('Error while sending data to sonos: ', exception);
      return;
    }

    // Play on all the sonos speakers configured for this switch
    try {
      promises = [];

      sonos.forEach(device => {
        promises.push(device.Play());
      });

      await Promise.all(promises);

    } catch (exception) {
      this.platform.log.error('Error while sending play request to sonos:', exception);
      return;
    }
  }

  stopPlaying() {
    const sonos: Array<SonosDevice> = this.findDevices();
    const promises: Array<Promise<boolean>> = [];

    try {
      sonos.forEach(device => {
        promises.push(device.Stop());
      });
    } catch (exception) {
      this.platform.log.error('Error while creating stop data for sonos - ', exception);
      return;
    }

    Promise.all(promises).then((bools) => {
      this.platform.log.info(`Stopped playing ${this.pluginDevice.name}`, bools);
    }).catch((exception) => {
      this.platform.log.error('Error while sending stop data to sonos - ', exception);
    });

  }

  findDevices(): Array<SonosDevice> {
    return this.platform.sonosDevices.filter((sonos) => this.pluginDevice.sonosDeviceNames.includes(sonos.Name));
  }
}
