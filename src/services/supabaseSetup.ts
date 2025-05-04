
/**
 * This file re-exports functionality from the refactored modules
 * to maintain backward compatibility with existing imports
 */

// Import and re-export from the new module files
export { setupSupabaseFunctions, checkCreatorIdColumn } from './database/dbInitializer';
export { saveDocument, updateDocument } from './documents/documentService';
export { fetchUserDocuments, fetchSharedDocuments } from './documents/documentFetcher';
