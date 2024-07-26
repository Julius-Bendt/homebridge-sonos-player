/* eslint-disable indent */
import { SonosDevice } from '@svrooij/sonos/lib';
import { ISwitchStrategy } from '../interfaces/ISwitchStrategy';
import { SonosPlatformAccessory } from '../SonosPlatformAccessory';

export class baseStrategy implements ISwitchStrategy {
    platformAccessory: SonosPlatformAccessory;

    constructor(platformAccessory: SonosPlatformAccessory) {
        this.platformAccessory = platformAccessory;
    }

    async play(devices: SonosDevice[]): Promise<void> {
        // Configure playback url, and volume
        const configurePromises = devices.map(device => this.configureDevice(device));
        await Promise.all(configurePromises);

        // After devices are configured, play the audio file
        const playPromises = devices.map(device => device.Play());
        await Promise.all(playPromises);
    }

    private async configureDevice(device: SonosDevice): Promise<void> {
        // If you're reading the code, and wondering why I'm not using the PlayNotification-function
        // I had lots of trouble with it - these three functions below seems to work like a charm.
        // It is, however, not pretty

        await Promise.all([
            device.Coordinator.Stop(),
            device.Coordinator.SetAVTransportURI(this.platformAccessory.pluginDevice.trackUri),
            device.Coordinator.SetVolume(this.platformAccessory.pluginDevice.volume),
        ]);
    }

    async stop(devices: SonosDevice[]): Promise<void> {
        const promises: Array<Promise<boolean>> = [];

        try {
            devices.forEach(device => {
                promises.push(device.Stop());
            });
        } catch (exception) {
            this.platformAccessory.platform.log.error('Error while creating stop data for sonos - ', exception);
            return;
        }

        Promise.all(promises).then((bools) => {
            this.platformAccessory.platform.log.info(`Stopped playing ${this.platformAccessory.pluginDevice.name}`, bools);
        }).catch((exception) => {
            this.platformAccessory.platform.log.error('Error while sending stop data to sonos - ', exception);
        });
    }

}