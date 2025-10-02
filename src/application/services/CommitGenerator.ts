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
    diff?: string,
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
    const prompt = this.buildCommitPrompt(changes, diff, commitType, language, options);

    // Use appropriate token limits for different models and analysis modes
    let maxTokens: number;
    const isFullMode = options.analysisMode === 'full';

    if (model.name === 'gpt-5-nano') {
      maxTokens = isFullMode ? 128000 : 128000; // gpt-5-nano supports max 128k completion tokens
    } else if (model.name.startsWith('gpt-5')) {
      maxTokens = isFullMode ? 120000 : 120000; // Other GPT-5 models
    } else {
      maxTokens = isFullMode ? 500 : 100; // GPT-4 and other models
    }

    const description = await this.aiAssistant.generateText(prompt, {
      model,
      maxTokens,
      temperature: 0.7,
      customInstructions: options.customInstructions ?? undefined,
    });

    // Clean and truncate description (allow longer descriptions for full mode)
    const descriptionMaxLength = options.analysisMode === 'full' ? Math.max(maxLength, 1000) : maxLength;
    const cleanDescription = this.cleanDescription(description, descriptionMaxLength);

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
    diff: string | undefined,
    commitType: CommitType,
    language: string,
    options: CommitGenerationOptions
  ): string {
    const changesSummary = this.summarizeChanges(changes);
    const customInstructions = options.customInstructions || '';
    const analysisMode = options.analysisMode || 'lite';

    let changesDescription = '';

    if (analysisMode === 'full' && diff && diff.trim()) {
      // Full analysis mode: detailed code analysis
      const codeAnalysis = this.analyzeCodeChanges(diff, changes);
      const truncatedDiff = diff.length > 8000 ? diff.substring(0, 8000) + '\n... (diff truncated)' : diff;

      changesDescription = `Files changed:
${changesSummary}

Code Analysis:
${codeAnalysis}

Diff of changes:
${truncatedDiff}`;
    } else {
      // Lite analysis mode: only file list
      changesDescription = `Files changed:
${changesSummary}`;
    }

    if (analysisMode === 'full') {
      return `Analyze the following code changes and generate a detailed conventional commit message.

${changesDescription}

Requirements:
- Write in ${language} with detailed bullet points
- Use appropriate emojis for different types of changes
- Group changes by logical components (backend, frontend, database, etc.)
- Focus on WHAT was added/changed, not HOW
- Analyze added classes, interfaces, functions, components, database tables, API endpoints
- Be specific about new features, entities, DTOs, repositories, migrations
- Start with imperative mood in the main description
- Keep main description under 70 characters, but be detailed in bullet points
- Use format like: "- 🧠 Added domain entities: GameSession, GameCase, GameClue"
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Example format:
feat: implemented basic AI game with sessions and cases 🚀
- 🧠 Added domain entities and VOs: GameSession, GameCase, GameClue, GameAnswer, SessionId, UserId, GameStatus
- 🔧 Implemented DTOs: CreateGameSessionRequest, GameActionRequest, GameSessionResponse
- 🚀 Engine and contracts: added GameEngineInterface and GameEngine for session management

Main description:`;
    } else {
      return `Generate a concise commit message description for ${commitType.value} type changes.

${changesDescription}

Requirements:
- Write in ${language}
- Be specific and actionable
- Start with imperative mood (Add, Fix, Update, Remove, etc.)
- Keep it under 50 characters when possible
- Focus on what changed and why, not how
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ''}

Description:`;
    }
  }

  private analyzeCodeChanges(diff: string, changes: readonly GitChange[]): string {
    const analysis: string[] = [];

    // Extract added classes, interfaces, functions
    const classMatches = diff.match(/^\+.*(?:class|interface|abstract class)\s+(\w+)/gm);
    const functionMatches = diff.match(/^\+.*(?:function|const|let|var)\s+(\w+)\s*[=(]/gm);
    const componentMatches = diff.match(/^\+.*(?:Vue\.component|export.*Component|class.*Component)/gm);
    const migrationMatches = diff.match(/^\+.*create_(\w+)_table/gm);
    const routeMatches = diff.match(/^\+.*Route::(?:get|post|put|delete|patch)/gm);

    // Group changes by type
    const addedClasses = classMatches ? [...new Set(classMatches.map(m => m.replace(/^\+.*(?:class|interface|abstract class)\s+/, '')))] : [];
    const addedFunctions = functionMatches ? [...new Set(functionMatches.map(m => m.replace(/^\+.*(?:function|const|let|var)\s+/, '').replace(/\s*[=(].*/, '')))] : [];
    const addedComponents = componentMatches ? componentMatches.length : 0;
    const addedMigrations = migrationMatches ? migrationMatches.map(m => m.replace(/^\+.*create_/, '').replace(/_table.*/, '')) : [];
    const addedRoutes = routeMatches ? routeMatches.length : 0;

    // Analyze file types
    const fileTypes = changes.reduce((acc, change) => {
      const ext = change.filePath.split('.').pop()?.toLowerCase();
      if (ext) {
        acc[ext] = (acc[ext] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Backend analysis
    if (addedClasses.length > 0) {
      analysis.push(`Added classes/interfaces: ${addedClasses.slice(0, 5).join(', ')}${addedClasses.length > 5 ? '...' : ''}`);
    }

    if (addedFunctions.length > 0) {
      analysis.push(`Added functions/methods: ${addedFunctions.slice(0, 3).join(', ')}${addedFunctions.length > 3 ? '...' : ''}`);
    }

    // Database analysis
    if (addedMigrations.length > 0) {
      analysis.push(`Database migrations: ${addedMigrations.join(', ')}`);
    }

    // Frontend analysis
    if (addedComponents > 0) {
      analysis.push(`Vue components: ${addedComponents} component(s) added`);
    }

    // API analysis
    if (addedRoutes > 0) {
      analysis.push(`API routes: ${addedRoutes} route(s) added`);
    }

    // File statistics
    const stats = Object.entries(fileTypes).map(([ext, count]) => `${ext}: ${count}`).join(', ');
    if (stats) {
      analysis.push(`File types changed: ${stats}`);
    }

    return analysis.length > 0 ? analysis.join('\n') : 'Code changes detected (detailed analysis in diff)';
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
