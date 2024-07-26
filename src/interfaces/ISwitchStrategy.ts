import { SonosDevice } from '@svrooij/sonos/lib';
import { SonosPlatformAccessory } from '../SonosPlatformAccessory';

export interface ISwitchStrategy {
    platformAccessory: SonosPlatformAccessory;
    play(devices: SonosDevice[]): Promise<void>;
    stop(devices: SonosDevice[]): Promise<void>;

}