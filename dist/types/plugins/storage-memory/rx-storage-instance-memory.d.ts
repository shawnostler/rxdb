import { Observable } from 'rxjs';
import type { BulkWriteRow, EventBulk, RxConflictResultionTask, RxConflictResultionTaskSolution, RxDocumentData, RxJsonSchema, RxStorageBulkWriteResponse, RxStorageChangeEvent, RxStorageCountResult, RxStorageDefaultCheckpoint, RxStorageInfoResult, RxStorageInstance, RxStorageInstanceCreationParams, RxStorageQueryResult, StringKeys } from '../../types/index.d.ts';
import type { MemoryPreparedQuery, MemoryStorageInternals, RxStorageMemory, RxStorageMemoryInstanceCreationOptions, RxStorageMemorySettings } from './memory-types.ts';
/**
 * Used in tests to ensure everything
 * is closed correctly
 */
export declare const OPEN_MEMORY_INSTANCES: Set<RxStorageInstanceMemory<any>>;
export declare class RxStorageInstanceMemory<RxDocType> implements RxStorageInstance<RxDocType, MemoryStorageInternals<RxDocType>, RxStorageMemoryInstanceCreationOptions, RxStorageDefaultCheckpoint> {
    readonly storage: RxStorageMemory;
    readonly databaseName: string;
    readonly collectionName: string;
    readonly schema: Readonly<RxJsonSchema<RxDocumentData<RxDocType>>>;
    readonly internals: MemoryStorageInternals<RxDocType>;
    readonly options: Readonly<RxStorageMemoryInstanceCreationOptions>;
    readonly settings: RxStorageMemorySettings;
    readonly primaryPath: StringKeys<RxDocumentData<RxDocType>>;
    closed: boolean;
    constructor(storage: RxStorageMemory, databaseName: string, collectionName: string, schema: Readonly<RxJsonSchema<RxDocumentData<RxDocType>>>, internals: MemoryStorageInternals<RxDocType>, options: Readonly<RxStorageMemoryInstanceCreationOptions>, settings: RxStorageMemorySettings);
    bulkWrite(documentWrites: BulkWriteRow<RxDocType>[], context: string): Promise<RxStorageBulkWriteResponse<RxDocType>>;
    /**
     * Instead of directly inserting the documents into all indexes,
     * we do it lazy in the background. This gives the application time
     * to directly work with the write-result and to do stuff like rendering DOM
     * notes and processing RxDB queries.
     * Then in some later time, or just before the next read/write,
     * it is ensured that the indexes have been written.
     */
    ensurePersistence(): void;
    findDocumentsById(docIds: string[], withDeleted: boolean): Promise<RxDocumentData<RxDocType>[]>;
    query(preparedQuery: MemoryPreparedQuery<RxDocType>): Promise<RxStorageQueryResult<RxDocType>>;
    count(preparedQuery: MemoryPreparedQuery<RxDocType>): Promise<RxStorageCountResult>;
    info(): Promise<RxStorageInfoResult>;
    getChangedDocumentsSince(limit: number, checkpoint?: RxStorageDefaultCheckpoint): Promise<{
        documents: RxDocumentData<RxDocType>[];
        checkpoint: RxStorageDefaultCheckpoint;
    }>;
    cleanup(minimumDeletedTime: number): Promise<boolean>;
    getAttachmentData(documentId: string, attachmentId: string, digest: string): Promise<string>;
    changeStream(): Observable<EventBulk<RxStorageChangeEvent<RxDocumentData<RxDocType>>, RxStorageDefaultCheckpoint>>;
    remove(): Promise<void>;
    close(): Promise<void>;
    conflictResultionTasks(): Observable<RxConflictResultionTask<RxDocType>>;
    resolveConflictResultionTask(_taskSolution: RxConflictResultionTaskSolution<RxDocType>): Promise<void>;
}
export declare function createMemoryStorageInstance<RxDocType>(storage: RxStorageMemory, params: RxStorageInstanceCreationParams<RxDocType, RxStorageMemoryInstanceCreationOptions>, settings: RxStorageMemorySettings): Promise<RxStorageInstanceMemory<RxDocType>>;
