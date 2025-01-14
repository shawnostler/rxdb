import { ensureRxStorageInstanceParamsAreCorrect } from "../../rx-storage-helper.js";
import { RX_STORAGE_NAME_DENOKV, RxStorageDenoKVStatics } from "./denokv-helper.js";
import { createDenoKVStorageInstance } from "./rx-storage-instance-denokv.js";
export var RxStorageDenoKV = /*#__PURE__*/function () {
  function RxStorageDenoKV(settings) {
    this.name = RX_STORAGE_NAME_DENOKV;
    this.statics = RxStorageDenoKVStatics;
    this.settings = settings;
  }
  var _proto = RxStorageDenoKV.prototype;
  _proto.createStorageInstance = function createStorageInstance(params) {
    ensureRxStorageInstanceParamsAreCorrect(params);
    return createDenoKVStorageInstance(this, params, this.settings);
  };
  return RxStorageDenoKV;
}();
export function getRxStorageDenoKV(settings = {
  consistencyLevel: 'strong'
}) {
  var storage = new RxStorageDenoKV(settings);
  return storage;
}
//# sourceMappingURL=index.js.map