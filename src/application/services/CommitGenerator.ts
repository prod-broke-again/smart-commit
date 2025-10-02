import { CommitMessage } from '../../domain/entities/CommitMessage';
import { GitChange, GitChangeType } from '../../domain/entities/GitChange';
import { AiModel } from '../../domain/entities/AiModel';
import { CommitType } from '../../domain/value-objects/CommitType';
import {
  ICommitGenerator,
  CommitGenerationOptions,
  ReleaseGenerationOptions
} from '../../domain/services/ICommitGenerator';
import { IAiAssistant } from '../../domain/services/IAiAssistant';

/**
 * Commit message generator implementation
 */
export class CommitGenerator implements ICommitGenerator {

  constructor(private readonly aiAssistant: IAiAssistant) {}

  public async generateCommitMessage(
    changes: readonly GitChange[],
    options: CommitGenerationOptions = {}
  ): Promise<CommitMessage> {
    if (changes.length === 0) {
      throw new Error('No changes to commit');
    }

    const model = options.model || AiModel.GPT_3_5_TURBO;
    const language = options.language || 'en';
    const maxLength = options.maxLength || 72;

    // Analyze changes to determine commit type
    const commitType = CommitType.determineFromChanges(changes);

    // Generate description using AI with appropriate token limits
    const prompt = this.buildCommitPrompt(changes, commitType, language, options);

    // Use higher token limits for GPT-5 models (like in original script)
    const maxTokens = model.name.startsWith('gpt-5') ? 120000 : 100;

    const description = await this.aiAssistant.generateText(prompt, {
      model,
      maxTokens,
      temperature: 0.7,
      customInstructions: options.customInstructions ?? undefined,
    });

    // Clean and truncate description
    const cleanDescription = this.cleanDescription(description, maxLength);

    // Determine scope if needed
    const scope = options.includeScope ? this.determineScope(changes) : null;

    return CommitMessage.create(commitType.value, cleanDescription, scope);
  }

  public async generateReleaseTitle(
    changes: readonly GitChange[],
    version: string,
    options: ReleaseGenerationOptions = {}
  ): Promise<string> {
    const model = options.model || AiModel.GPT_3_5_TURBO;
    const language = options.language || 'en';

    const prompt = `Generate a concise release title for version ${version} based on these changes:\n\n${this.summarizeChanges(changes)}\n\nTitle should be in ${language} and follow semantic versioning conventions.`;

    const title = await this.aiAssistant.generateText(prompt, {
      model,
      maxTokens: 50,
      temperature: 0.5,
    });

    return this.cleanTitle(title);
  }

  public async generateReleaseDescription(
    changes: readonly GitChange[],
    version: string,
    options: ReleaseGenerationOptions = {}
  ): Promise<string> {
    const model = options.model || AiModel.GPT_3_5_TURBO;
    const language = options.language || 'en';

    const categorizedChanges = this.categorizeChanges(changes);

    const prompt = `Generate a detailed release description for version ${version} with the following sections:

## Features
${categorizedChanges.features.map(c => `- ${this.describeChange(c)}`).join('\n') || 'No new features'}

## Bug Fixes
${categorizedChanges.fixes.map(c => `- ${this.describeChange(c)}`).join('\n') || 'No bug fixes'}

## Other Changes
${categorizedChanges.other.map(c => `- ${this.describeChange(c)}`).join('\n') || 'No other changes'}

${options.includeBreakingChanges && categorizedChanges.breaking.length > 0 ?
  `## Breaking Changes\n${categorizedChanges.breaking.map(c => `- ${this.describeChange(c)}`).join('\n')}` :
  ''}

Write in ${language} and make it suitable for changelog.`;

    const description = await this.aiAssistant.generateText(prompt, {
      model,
      maxTokens: 500,
      temperature: 0.3,
    });

    return this.cleanDescription(description, 1000);
  }

  private buildCommitPrompt(
    changes: readonly GitChange[],
    commitType: CommitType,
    language: string,
    options: CommitGenerationOptions
  ): string {
    const changesSummary = this.summarizeChanges(changes);
    const customInstructions = options.customInstructions || '';

    return `Generate a concise commit message description for ${commitType.value} type changes.

Changes:
${changesSummary}

Requirements:
- Write in ${language}
- Be specific and actionable
- Start with imperative mood (Add, Fix, Update, Remove, etc.)
- Keep it under 50 characters when possible
- Focus on what changed and why, not how
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Description:`;
  }

  private summarizeChanges(changes: readonly GitChange[]): string {
    const summary: string[] = [];

    for (const change of changes) {
      const action = this.getChangeAction(change);
      summary.push(`${action} ${change.filePath}`);
    }

    return summary.join('\n');
  }

  private getChangeAction(change: GitChange): string {
    switch (change.changeType) {
      case GitChangeType.ADDED:
        return 'Added';
      case GitChangeType.MODIFIED:
        return 'Modified';
      case GitChangeType.DELETED:
        return 'Deleted';
      case GitChangeType.RENAMED:
        return 'Renamed';
      default:
        return 'Changed';
    }
  }

  private determineScope(changes: readonly GitChange[]): string | null {
    const directories = new Set<string>();

    for (const change of changes) {
      const dir = change.filePath.split('/')[0];
      if (dir && !change.isConfigFile) {
        directories.add(dir);
      }
    }

    // If all changes are in the same directory, use it as scope
    if (directories.size === 1) {
      return Array.from(directories)[0];
    }

    return null;
  }

  private categorizeChanges(changes: readonly GitChange[]): CategorizedChanges {
    const result: CategorizedChanges = {
      features: [],
      fixes: [],
      breaking: [],
      other: [],
    };

    for (const change of changes) {
      if (change.isTestFile) {
        result.other.push(change);
      } else if (change.isConfigFile) {
        result.other.push(change);
      } else {
        // For now, categorize based on file types and extensions
        // This could be enhanced with more sophisticated analysis
        result.features.push(change);
      }
    }

    return result;
  }

  private describeChange(change: GitChange): string {
    const action = this.getChangeAction(change);
    return `${action.toLowerCase()} ${change.filePath}`;
  }

  private cleanDescription(description: string, maxLength: number): string {
    let clean = description.trim();

    // Remove quotes if present
    clean = clean.replace(/^["']|["']$/g, '');

    // Remove trailing punctuation
    clean = clean.replace(/[.!?]*$/, '');

    // Capitalize first letter
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);

    // Truncate if too long
    if (clean.length > maxLength) {
      clean = clean.substring(0, maxLength - 3) + '...';
    }

    return clean;
  }

  private cleanTitle(title: string): string {
    return title.trim().replace(/^["']|["']$/g, '');
  }
}

interface CategorizedChanges {
  features: GitChange[];
  fixes: GitChange[];
  breaking: GitChange[];
  other: GitChange[];
}
