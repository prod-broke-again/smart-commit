// Entities
export { CommitMessage } from './entities/CommitMessage';
export { GitChange, GitChangeType } from './entities/GitChange';
export { AiModel } from './entities/AiModel';

// Value Objects
export { CommitType } from './value-objects/CommitType';
export { ApiCredentials } from './value-objects/ApiCredentials';
export { ConventionalCommitFormat } from './value-objects/ConventionalCommitFormat';
export type { ConventionalCommitValidation, ConventionalCommitParseResult } from './value-objects/ConventionalCommitFormat';

// Services
export type { ICommitGenerator, CommitGenerationOptions, ReleaseGenerationOptions } from './services/ICommitGenerator';
export type { IGitAnalyzer, GitStatus } from './services/IGitAnalyzer';
export type { IAiAssistant, AiGenerationOptions, ModelCapabilities } from './services/IAiAssistant';
