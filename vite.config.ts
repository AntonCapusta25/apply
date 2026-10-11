import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sendgridApiKey = env.SENDGRID_API_KEY || '';
  const fromEmail = env.SENDGRID_FROM_EMAIL || 'info@spoonfull.nl';
  const fromName = env.SENDGRID_FROM_NAME || 'Spoonfull';

  return {
    plugins: [
      react(),
      {
        name: 'sendgrid-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/send-email', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const { to, subject, htmlContent, textContent } = data;

                if (!sendgridApiKey || !sendgridApiKey.startsWith('SG.')) {
                  console.warn('[SendGrid Middleware] Awaiting Spoonfull SENDGRID_API_KEY in .env. Skipped remote dispatch.');
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, pendingKey: true, message: 'Awaiting Spoonfull SENDGRID_API_KEY in .env' }));
                  return;
                }

                const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${sendgridApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    personalizations: [
                      {
                        to: [{ email: to }],
                      },
                    ],
                    from: {
                      email: fromEmail,
                      name: fromName,
                    },
                    reply_to: {
                      email: fromEmail,
                      name: fromName,
                    },
                    subject,
                    content: [
                      {
                        type: 'text/html',
                        value: htmlContent || textContent || '',
                      },
                    ],
                  }),
                });

                if (response.ok || response.status === 202) {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, status: response.status }));
                } else {
                  const errorText = await response.text();
                  console.error('SendGrid Error:', response.status, errorText);
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: errorText }));
                }
              } catch (err: any) {
                console.error('Email middleware failure:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          });
        },
      },
    ],
  };
});
