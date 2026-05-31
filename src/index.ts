import { app } from './app';
import { getConfig } from './config';

const port = getConfig().CELEB_API_PORT;

app.listen(port, () => {
  process.stdout.write(`celeb-api listening on ${port}\n`);
});
