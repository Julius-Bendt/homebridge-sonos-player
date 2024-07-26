/* eslint-disable indent */
import { SonosDevice } from '@svrooij/sonos/lib';

import { PlayNotificationOptions } from '@svrooij/sonos/lib/models';
import { baseStrategy } from './BaseStrategy';

export class NotificationStrategy extends baseStrategy {

    override async play(devices: SonosDevice[]): Promise<void> {
        const playPromises = devices.map(device => this.sendNotification(device));
        await Promise.all(playPromises);
    }

    private async sendNotification(device: SonosDevice): Promise<void> {
        const options: PlayNotificationOptions = {
            trackUri: this.platformAccessory.pluginDevice.trackUri,
            delayMs: this.platformAccessory.pluginDevice.delay,
            timeout: this.platformAccessory.pluginDevice.timeout,
            volume: this.platformAccessory.pluginDevice.volume,
        };
        await device.PlayNotification(options);
    }

}