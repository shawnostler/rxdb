import type {
    RxStorage,
    RxStorageInstanceCreationParams
} from '../../types/index.d.ts';
import { ensureRxStorageInstanceParamsAreCorrect } from '../../rx-storage-helper.ts';
import type { DenoKVSettings, DenoKVStorageInternals } from './denokv-types.ts';
import { RX_STORAGE_NAME_DENOKV, RxStorageDenoKVStatics } from "./denokv-helper.ts";
import { RxStorageInstanceDenoKV, createDenoKVStorageInstance } from "./rx-storage-instance-denokv.ts";



export class RxStorageDenoKV implements RxStorage<DenoKVStorageInternals<any>, DenoKVSettings> {
    public name = RX_STORAGE_NAME_DENOKV;
    public statics = RxStorageDenoKVStatics;

    constructor(
        public settings: DenoKVSettings
    ) { }

    public createStorageInstance<RxDocType>(
        params: RxStorageInstanceCreationParams<RxDocType, DenoKVSettings>
    ): Promise<RxStorageInstanceDenoKV<RxDocType>> {
        ensureRxStorageInstanceParamsAreCorrect(params);
        return createDenoKVStorageInstance(this, params, this.settings);
    }
}


export function getRxStorageDenoKV(
    settings: DenoKVSettings = {
        consistencyLevel: 'strong'
    }
): RxStorageDenoKV {
    const storage = new RxStorageDenoKV(settings);
    return storage;
}
