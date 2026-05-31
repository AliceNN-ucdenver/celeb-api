import { createApp } from './app';

const port = Number(process.env.PORT ?? 8080);
const app = createApp();

if (require.main === module) {
  app.listen(port, () => {
    process.stdout.write(`celeb-api listening on ${port}\n`);
  });
}
