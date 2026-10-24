const MAX_MESSAGE = 300;

export function issue(rule, message, fields = {}) {
  const text = message.length > MAX_MESSAGE ? `${message.slice(0, MAX_MESSAGE - 3)}...` : message;
  return { rule, message: text, ...fields };
}

export function errorMessage(err) {
  if (err instanceof Error) return err.message || err.name;
  return String(err);
}
