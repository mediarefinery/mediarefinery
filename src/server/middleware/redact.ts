import { redact } from '../../lib/logging/logger'

// Middleware to redact sensitive fields from req.body, req.query, and req.headers
// before passing the request along. It mutates these objects in-place for simplicity.
export function redactMiddleware(options?: { extraKeys?: string[] }) {
  const extra = options?.extraKeys ?? []
  return function (req: any, res: any, next: any) {
    try {
      if (req.body) {
        const redacted = redact(req.body, extra)
        // replace body with redacted copy
        req.body = redacted
      }
      if (req.query) {
        req.query = redact(req.query, extra)
      }
      if (req.headers) {
        // headers often use lowercase keys
        req.headers = redact(req.headers, extra)
      }
    } catch (e) {
      // don't block the request on logging failures
    }
    return next()
  }
}

export default redactMiddleware
