import * as vm from 'vm';

export interface RuleEvaluationResult {
  ruleId: string;
  condition: string;
  result: boolean;
  error?: string;
}

export class RuleEngine {
  /**
   * Evaluates a logical condition string against input data.
   * Supported: ==, !=, <, >, <=, >=, &&, ||
   * Custom functions: contains(field, value), startsWith(field, value), endsWith(field, value)
   */
  static evaluate(condition: string, data: any): boolean {
    if (condition.trim().toUpperCase() === 'DEFAULT') {
      return true;
    }

    // Create a context for execution
    const context = {
      ...data,
      contains: (field: string, value: string) => {
        const fieldValue = data[field];
        return typeof fieldValue === 'string' && fieldValue.includes(value);
      },
      startsWith: (field: string, value: string) => {
        const fieldValue = data[field];
        return typeof fieldValue === 'string' && fieldValue.startsWith(value);
      },
      endsWith: (field: string, value: string) => {
        const fieldValue = data[field];
        return typeof fieldValue === 'string' && fieldValue.endsWith(value);
      }
    };

    try {
      // Use vm to execute the condition string safely
      const script = new vm.Script(condition);
      return !!script.runInNewContext(context);
    } catch (error) {
      console.error(`Error evaluating condition: ${condition}`, error);
      throw new Error(`Invalid condition: ${condition}`);
    }
  }

  static evaluateAll(rules: any[], data: any): { rule: string, result: boolean, error?: string }[] {
    return rules.map(rule => {
      try {
        return {
          rule: rule.condition,
          result: this.evaluate(rule.condition, data)
        };
      } catch (err: any) {
        return {
          rule: rule.condition,
          result: false,
          error: err.message
        };
      }
    });
  }

  static findMatchingRule(rules: any[], data: any): any | null {
    // Sort rules by priority (lower number = higher priority)
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      try {
        if (this.evaluate(rule.condition, data)) {
          return rule;
        }
      } catch (error: any) {
        console.warn(`Rule evaluation failed for rule ${rule.id}: ${error.message}`);
      }
    }

    return null;
  }
}
