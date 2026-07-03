import { describe, it } from 'mocha';
import { expect } from 'chai';
import { assertValidIdentifier, isValidIdentifier } from '../../dist/security/identifiers.js';
import { SecurityError } from '../../dist/utils/errors.js';

describe('Identifier Validation', () => {
  const valid = [
    'users',
    '_users',
    'Users123',
    'order_items',
    'tab$le',
    'a',
    'a'.repeat(128),
  ];

  const invalid: [string, string][] = [
    ['users; DROP TABLE users', 'semicolon injection'],
    ['users"', 'double quote'],
    ['"users"', 'quoted name'],
    ["users'", 'single quote'],
    ['us ers', 'space'],
    ['users--comment', 'comment sequence'],
    ['`users`', 'backtick'],
    ['[users]', 'bracket'],
    ['users.name', 'dot-qualified name'],
    ['users)', 'closing paren'],
    ['*', 'wildcard'],
    ['1users', 'leading digit'],
    ['', 'empty string'],
    ['a'.repeat(129), 'too long'],
    ['us\ners', 'newline'],
    ['us\ters', 'tab'],
    ['usérs', 'accented character'],
    ['usеrs', 'cyrillic homoglyph'],
    ['users\u200b', 'zero-width space'],
    ['\uff55sers', 'fullwidth character'],
    ['users\0', 'null byte'],
  ];

  for (const name of valid) {
    it(`should accept '${name.slice(0, 32)}'`, () => {
      expect(isValidIdentifier(name)).to.be.true;
      expect(() => assertValidIdentifier(name, 'table name')).to.not.throw();
    });
  }

  for (const [name, reason] of invalid) {
    it(`should reject ${reason}`, () => {
      expect(isValidIdentifier(name)).to.be.false;
      expect(() => assertValidIdentifier(name, 'table name')).to.throw(SecurityError, /Invalid table name/);
    });
  }
});
