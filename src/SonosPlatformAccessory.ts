import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { SonosHomebridgePlatform } from './SonosHomebridgePlatform';
import { IPluginDevice } from './interfaces/IPluginDevice';

import { SonosDevice } from '@svrooij/sonos/lib';
import { NotificationStrategy } from './strategies/NotificationStrategy';
import { StatefulStrategy } from './strategies/StatefulStrategy';
import { NormalStrategy } from './strategies/NormalStrategy';

export class SonosPlatformAccessory {
  private service: Service;

  private state = {
    on: false,
    playing: false,
  };

  private strategies = {
    'notification': new NotificationStrategy(this),
    'stateful': new StatefulStrategy(this),
    'normal': new NormalStrategy(this),
  };


  constructor(
    public readonly platform: SonosHomebridgePlatform,
    public readonly accessory: PlatformAccessory,
    public readonly pluginDevice: IPluginDevice,
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

    const devices = this.findDevices();

    // Immediately set the state to reflect the UI change
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(castedValue);
    this.state.on = castedValue;

    if (!castedValue) {
      this.platform.log.info(`Stopping plugin device ${this.pluginDevice.name}`);
      this.strategies[this.pluginDevice.switchType].stop(devices);
      return;
    }

    this.platform.log.info(`Playing plugin device ${this.pluginDevice.name}`);

    try {
      await this.strategies[this.pluginDevice.switchType].play(devices);
    } catch (exception) {
      this.platform.log.error(`Exception were thrown when playing audio file for ${this.pluginDevice.name}
        switch (type: ${this.pluginDevice.switchType}). Exception: `, exception,
      );
    } finally {

      // Stateful switches should be stopped manually
      if (this.pluginDevice.switchType !== 'stateful') {
        // Deactivate the switch after the sound has been played
        this.state.on = false;
        this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(false);
        this.platform.log.debug(`Setting switch ${this.pluginDevice.name} to false`);
      }

      if (this.pluginDevice.switchType === 'notification') {
        this.strategies[this.pluginDevice.switchType].stop(devices);
      }
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.on;
    this.platform.log.debug(`Get Characteristic On for '${this.pluginDevice.name}' ->`, isOn);

    return isOn;
  }


  findDevices(): SonosDevice[] {
    return this.platform.sonosDevices.filter((sonos) => this.pluginDevice.sonosDeviceNames.includes(sonos.Name));
  }
}
