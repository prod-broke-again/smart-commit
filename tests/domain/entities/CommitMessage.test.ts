import { CommitMessage } from '../../../src/domain/entities/CommitMessage';

describe('CommitMessage', () => {
  describe('create', () => {
    it('should create a valid commit message', () => {
      const message = CommitMessage.create('feat', 'add new feature');

      expect(message.type).toBe('feat');
      expect(message.description).toBe('add new feature');
      expect(message.scope).toBeNull();
      expect(message.body).toBeNull();
      expect(message.footer).toBeNull();
      expect(message.isBreaking).toBe(false);
    });

    it('should create message with scope', () => {
      const message = CommitMessage.create('fix', 'resolve bug', 'auth');

      expect(message.type).toBe('fix');
      expect(message.scope).toBe('auth');
    });

    it('should create breaking change message', () => {
      const message = CommitMessage.create('feat', 'breaking change', null, null, null, true);

      expect(message.isBreaking).toBe(true);
    });

    it('should throw error for empty type', () => {
      expect(() => CommitMessage.create('', 'description')).toThrow('Commit type is required');
    });

    it('should throw error for empty description', () => {
      expect(() => CommitMessage.create('feat', '')).toThrow('Commit description is required');
    });

    it('should trim whitespace', () => {
      const message = CommitMessage.create('  feat  ', '  description  ');

      expect(message.type).toBe('feat');
      expect(message.description).toBe('description');
    });

    it('should convert type to lowercase', () => {
      const message = CommitMessage.create('FEAT', 'description');

      expect(message.type).toBe('feat');
    });
  });

  describe('toString', () => {
    it('should format basic message correctly', () => {
      const message = CommitMessage.create('feat', 'add new feature');

      expect(message.toString()).toBe('feat: add new feature');
    });

    it('should format message with scope', () => {
      const message = CommitMessage.create('fix', 'resolve bug', 'auth');

      expect(message.toString()).toBe('fix(auth): resolve bug');
    });

    it('should format breaking change message', () => {
      const message = CommitMessage.create('feat', 'breaking change', null, null, null, true);

      expect(message.toString()).toBe('feat!: breaking change');
    });

    it('should format message with body', () => {
      const message = CommitMessage.create('feat', 'add feature', null, 'This adds a new feature');

      expect(message.toString()).toBe('feat: add feature\n\nThis adds a new feature');
    });

    it('should format message with footer', () => {
      const message = CommitMessage.create('fix', 'resolve bug', null, null, 'BREAKING CHANGE: API changed');

      expect(message.toString()).toBe('fix: resolve bug\n\nBREAKING CHANGE: API changed');
    });

    it('should format complete message', () => {
      const message = CommitMessage.create(
        'feat',
        'add authentication',
        'auth',
        'This adds JWT authentication',
        'Closes #123',
        true
      );

      const expected = 'feat(auth)!: add authentication\n\nThis adds JWT authentication\n\nCloses #123';
      expect(message.toString()).toBe(expected);
    });
  });
});
