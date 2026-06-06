import chalk from 'chalk';

type LogCategory = 'Supabase' | 'Seguranca' | 'Ferramentas' | 'Financeiro' | 'Geral';

interface Logger {
  info: (category: LogCategory, message: string, meta?: any) => void;
  warn: (category: LogCategory, message: string, meta?: any) => void;
  error: (category: LogCategory, message: string, meta?: any) => void;
  debug: (category: LogCategory, message: string, meta?: any) => void;
}

function maskSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = { ...obj };
  const keys = Object.keys(masked);
  for (const key of keys) {
    if (key.toLowerCase().includes('api') && typeof masked[key] === 'string') {
      masked[key] = '***MASKED***';
    }
    if (key.toLowerCase().includes('key') && typeof masked[key] === 'string') {
      masked[key] = '***MASKED***';
    }
  }
  return masked;
}

function createLogger(): Logger {
  const colorMap: Record<LogCategory, any> = {
    Supabase: chalk.yellow,
    Seguranca: chalk.redBright,
    Ferramentas: chalk.green,
    Financeiro: chalk.blue,
    Geral: chalk.white,
  };

  const log = (level: string, category: LogCategory, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const color = colorMap[category] || chalk.white;
    const metaStr = meta ? ` | ${JSON.stringify(maskSensitive(meta))}` : '';
    // eslint-disable-next-line no-console
    console.log(`${chalk.gray(timestamp)} ${color(level)} [${category}] ${message}${metaStr}`);
  };

  return {
    info: (c, m, meta) => log('INFO', c, m, meta),
    warn: (c, m, meta) => log('WARN', c, m, meta),
    error: (c, m, meta) => log('ERROR', c, m, meta),
    debug: (c, m, meta) => log('DEBUG', c, m, meta),
  };
}

export const logger = createLogger();
export { createLogger };

