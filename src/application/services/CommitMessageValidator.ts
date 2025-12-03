import { ConventionalCommitFormat, ConventionalCommitValidation } from '../../domain/value-objects/ConventionalCommitFormat';
import { IAiAssistant } from '../../domain/services/IAiAssistant';
import { AiModel } from '../../domain/entities/AiModel';

/**
 * Service for validating and improving commit messages
 * 
 * Validates commit messages against conventional commits format and
 * optionally improves them using AI assistant.
 * 
 * @example
 * ```typescript
 * const validator = new CommitMessageValidator(aiAssistant);
 * const result = await validator.validateAndImprove('fix bug', {
 *   autoImprove: true,
 *   language: 'en'
 * });
 * ```
 */
export class CommitMessageValidator {
  private readonly format: ConventionalCommitFormat;
  private readonly aiAssistant: IAiAssistant | null;

  constructor(aiAssistant?: IAiAssistant) {
    this.format = ConventionalCommitFormat.STANDARD;
    this.aiAssistant = aiAssistant || null;
  }

  /**
   * Validates commit message format
   */
  public validate(message: string): ConventionalCommitValidation {
    return this.format.validate(message);
  }

  /**
   * Improves commit message using AI
   */
  public async improveMessage(
    message: string,
    options: {
      language?: string;
      maxLength?: number;
      includeScope?: boolean;
    } = {}
  ): Promise<string> {
    if (!this.aiAssistant) {
      return message; // Return original if no AI assistant available
    }

    const language = options.language || 'en';
    const maxLength = options.maxLength || 72;

    const prompt = this.buildImprovementPrompt(message, language, maxLength);

    try {
      const improved = await this.aiAssistant.generateText(prompt, {
        model: AiModel.GPT_3_5_TURBO,
        temperature: 0.7,
      });

      // Extract improved message (AI might add explanations or metadata)
      // Look for a line that matches conventional commit format
      const lines = improved.split('\n');
      const improvedMessage = lines.find(line => {
        const trimmed = line.trim();
        return trimmed && 
          !trimmed.toLowerCase().includes('improved') &&
          !trimmed.toLowerCase().includes('suggestion') &&
          /^\w+(\(.+\))?!?:/.test(trimmed);
      }) || lines[0]?.trim() || message;

      return improvedMessage.trim();
    } catch (error) {
      // If AI fails, return original message
      console.warn('Failed to improve commit message with AI, using original');
      return message;
    }
  }

  /**
   * Validates and optionally improves commit message
   */
  public async validateAndImprove(
    message: string,
    options: {
      autoImprove?: boolean;
      language?: string;
      maxLength?: number;
      strict?: boolean;
    } = {}
  ): Promise<{ isValid: boolean; improvedMessage?: string; errors: readonly string[] }> {
    const validation = this.validate(message);

    // If valid and no auto-improve, return as is
    if (validation.isValid && !options.autoImprove) {
      return {
        isValid: true,
        errors: [],
      };
    }

    // If invalid or auto-improve is enabled
    if (!validation.isValid || options.autoImprove) {
      if (options.strict && !validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors,
        };
      }

      // Try to improve
      if (this.aiAssistant && options.autoImprove) {
        try {
          const improved = await this.improveMessage(message, {
            language: options.language,
            maxLength: options.maxLength,
          });

          const improvedValidation = this.validate(improved);
          if (improvedValidation.isValid) {
            return {
              isValid: true,
              improvedMessage: improved,
              errors: [],
            };
          }
        } catch (error) {
          // Fall through to return validation errors
        }
      }
    }

    return {
      isValid: validation.isValid,
      errors: validation.errors,
    };
  }

  private buildImprovementPrompt(message: string, language: string, maxLength: number): string {
    const lang = language === 'ru' ? 'русском' : 'English';
    
    return `Improve the following git commit message to follow conventional commits format. 
Requirements:
- Format: type(scope): description
- Header max length: ${maxLength} characters
- Use ${lang} language
- Be concise and clear
- Use appropriate commit type (feat, fix, docs, style, refactor, test, chore)

Original message: "${message}"

Return ONLY the improved commit message in conventional format, nothing else:`;
  }
}

