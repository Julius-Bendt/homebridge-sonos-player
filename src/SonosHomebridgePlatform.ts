import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { SonosDevice, SonosManager } from '@svrooij/sonos';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SonosPlatformAccessory } from './SonosPlatformAccessory';
import { IPluginConfig } from './interfaces/IPluginConfig';
import { IPluginDevice } from './interfaces/IPluginDevice';


export class SonosHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public readonly sonosManager: SonosManager;

  public readonly pluginConfig: IPluginConfig;

  public readonly sonosDevices: Array<SonosDevice>;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.sonosManager = new SonosManager();
    this.sonosDevices = [];

    this.pluginConfig = this.validateConfig();
    if (!this.pluginConfig) {
      log.error('Config not valid! Plugin will not start');
      return;
    }

    try {
      this.api.on('didFinishLaunching', () => {
        this.discoverDevices();
      });
    } catch (exception) {
      this.log.error('Error setting up virtual devices: ', exception);
      return;
    }

    this.setupPlugin().then((successful) => {

      if (!successful) {
        this.log.error('Failed to start plugin');
        new this.api.hap.HapStatusError(this.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        return;
      }

      this.log.info('Finished initializing platform');
    });

  }

  async setupPlugin(): Promise<boolean> {

    try {
      await this.sonosManager.InitializeWithDiscovery(10);

      this.sonosManager.Devices.forEach(device => {
        this.log.info('Device "%s" joined in %s', device.Name, device.GroupName ?? 'No group');
        this.sonosDevices.push(device);
      });

      if (this.sonosDevices.length === 0) {
        this.log.warn('Plugin didn\'t find any sonos devices. Plugin wont continue...');
        return false;
      }

    } catch (exception) {
      this.log.error('SONOS ERROR: ', exception);
      return false;
    }

    return true;
  }


  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  discoverDevices() {
    for (const device of this.pluginConfig.switches) {
      const uuid = this.api.hap.uuid.generate(device.name);

      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.debug('Restoring existing accessory from cache:', existingAccessory.displayName);
        new SonosPlatformAccessory(this, existingAccessory, device);


      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.debug('Adding new accessory:', device.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.name, uuid);

        accessory.context.device = device;

        new SonosPlatformAccessory(this, accessory, device);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  validateConfig(): IPluginConfig {


    const switches: Array<IPluginDevice> = [];

    this.config.switches?.forEach(device => {

      if (device.sonosDeviceNames === null || device.name === null || device.trackUri === null) {
        this.log.error('Sonos device is missing required keys! Will skip for now', device);
        return; //Continue equivalent
      }

      switches.push({
        sonosDeviceNames: device.sonosSpeakerNames,
        name: device.name,
        trackUri: device.trackUri,
        volume: device.volume ?? 25,
        delay: device.delay ?? 100,
        timeout: device.timeout ?? 10,
      });
    });

    const pluginConfig: IPluginConfig = {
      switches: switches,
    };

    return pluginConfig;

  }


}
