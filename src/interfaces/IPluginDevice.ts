export interface IPluginDevice {
    name: string;
    trackUri: string;
    volume: number;
    delay: number;
    timeout: number;
    sonosDeviceNames: Array<string>;
}