import {
    changeIndexableStringByOneQuantum,
    getStartIndexStringFromLowerBound,
    getStartIndexStringFromUpperBound
} from '../../custom-index.ts';
import type {
    QueryMatcher,
    RxDocumentData,
    RxStorageQueryResult
} from '../../types/index.d.ts';
import { ensureNotFalsy } from '../../plugins/utils/index.ts';
import { getQueryMatcher, getSortComparator } from '../../rx-query-helper.ts';
import { RxStorageInstanceDenoKV } from "./rx-storage-instance-denokv.ts";
import { DENOKV_DOCUMENT_ROOT_PATH, getDenoKVIndexName } from "./denokv-helper.ts";
import type { DenoKVPreparedQuery } from "./denokv-types.ts";

export async function queryDenoKV<RxDocType>(
    instance: RxStorageInstanceDenoKV<RxDocType>,
    preparedQuery: DenoKVPreparedQuery<RxDocType>
): Promise<RxStorageQueryResult<RxDocType>> {
    console.log('## queryDenoKV()');
    console.log(JSON.stringify(preparedQuery, null, 4));
    const queryPlan = preparedQuery.queryPlan;
    const query = preparedQuery.query;
    const skip = query.skip ? query.skip : 0;
    const limit = query.limit ? query.limit : Infinity;
    const skipPlusLimit = skip + limit;
    const queryPlanFields: string[] = queryPlan.index;
    const mustManuallyResort = !queryPlan.sortFieldsSameAsIndexFields;


    let queryMatcher: QueryMatcher<RxDocumentData<RxDocType>> | false = false;
    if (!queryPlan.selectorSatisfiedByIndex) {
        queryMatcher = getQueryMatcher(
            instance.schema,
            preparedQuery.query
        );
    }

    const kv = await instance.kvPromise;


    const indexForName = queryPlanFields.slice(0);
    indexForName.unshift('_deleted');
    const indexName = getDenoKVIndexName(indexForName);
    const indexMeta = ensureNotFalsy(instance.internals.indexes[indexName]);

    let lowerBound: any[] = queryPlan.startKeys;
    lowerBound = [false].concat(lowerBound);
    let lowerBoundString = getStartIndexStringFromLowerBound(
        instance.schema,
        indexForName,
        lowerBound,
        queryPlan.inclusiveStart
    );
    if (!queryPlan.inclusiveStart) {
        lowerBoundString = changeIndexableStringByOneQuantum(lowerBoundString, 1);
    }

    let upperBound: any[] = queryPlan.endKeys;
    upperBound = [false].concat(upperBound);
    let upperBoundString = getStartIndexStringFromUpperBound(
        instance.schema,
        indexForName,
        upperBound,
        queryPlan.inclusiveEnd
    );
    if (!queryPlan.inclusiveEnd) {
        upperBoundString = changeIndexableStringByOneQuantum(upperBoundString, -1);
    }


    let result: RxDocumentData<RxDocType>[] = [];


    /**
     * TODO for whatever reason the keySelectors like firstGreaterThan etc.
     * do not work properly. So we have to hack here to find the correct
     * document in case lowerBoundString===upperBoundString.
     * This likely must be fixed in the foundationdb library.
     * When it is fixed, we do not need this if-case and instead
     * can rely on .getRangeBatch() in all cases.
     */
    if (lowerBoundString === upperBoundString) {
        const singleDocResult = await kv.get<string>([instance.keySpace, indexMeta.indexId, lowerBoundString], instance.kvOptions);
        if (singleDocResult.value) {
            const docId: string = singleDocResult.value;
            const docDataResult = await kv.get<RxDocumentData<RxDocType>>([instance.keySpace, DENOKV_DOCUMENT_ROOT_PATH, docId], instance.kvOptions);
            const docData = ensureNotFalsy(docDataResult.value);
            if (!queryMatcher || queryMatcher(docData)) {
                result.push(docData);
            }
        }
        return {
            documents: result
        };
    }


    console.log('range:');
    console.log(JSON.stringify({
        start: [instance.keySpace, indexMeta.indexId, lowerBoundString],
        end: [instance.keySpace, indexMeta.indexId, upperBoundString],
        limit,
        // schema: instance.schema
    }, null, 4));


    const range = kv.list<string>({
        start: [instance.keySpace, indexMeta.indexId, lowerBoundString],
        end: [instance.keySpace, indexMeta.indexId, upperBoundString]
    }, {
        consistency: instance.settings.consistencyLevel,
        limit: mustManuallyResort ? undefined : skipPlusLimit,
        batchSize: instance.settings.batchSize
    });

    for await (const indexDocEntry of range) {
        const docId = indexDocEntry.value;
        const docDataResult = await kv.get<RxDocumentData<RxDocType>>([instance.keySpace, DENOKV_DOCUMENT_ROOT_PATH, docId], instance.kvOptions);
        const docData = ensureNotFalsy(docDataResult.value);
        if (!queryMatcher || queryMatcher(docData)) {
            result.push(docData);
        }
        if (
            !mustManuallyResort &&
            result.length === skipPlusLimit
        ) {
            break;
        }
    }

    if (mustManuallyResort) {
        const sortComparator = getSortComparator(instance.schema, preparedQuery.query);
        result = result.sort(sortComparator);
    }

    // apply skip and limit boundaries.
    result = result.slice(skip, skipPlusLimit);

    return {
        documents: result
    };
}