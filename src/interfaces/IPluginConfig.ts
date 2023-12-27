import { IPluginDevice } from './IPluginDevice';

export interface IPluginConfig {
    discoverFrom: string | undefined;
    switches: Array<IPluginDevice>;
}