import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import path from 'path';
import { fileURLToPath } from 'url';
import Debug from 'debug';

const debug = Debug('HTTP Server');

class HttpServer {
  constructor() {
    this.firebaseServerConfig = JSON.parse(process.env.FIREBASE_SERVER_CONFIG);
    this.server = express();
    this.server.use(bodyParser.urlencoded({ extended: true }));
    this.server.use(cookieParser());
    this.addAuthEndpoint();
    this.serveStaticFiles();
  }

  addAuthEndpoint() {
    this.server.post('/auth', async (req, res) => {
      HttpServer.#checkCSRFToken(req, res);
      const idToken = req.body.credential;
      const payload = await this.#verifyJWT(idToken);

      // Get redirect url
      const { nonce } = payload;
      const decodedNonce = Buffer.from(nonce, 'base64').toString('ascii');
      debug(decodedNonce);
      const redirectUrlRegex = /(http.+)---(.+)/;
      /* eslint no-unused-vars: ["error", { "destructuredArrayIgnorePattern": "^_" }] */
      const [_original, redirectUrl, _hash] = redirectUrlRegex.exec(decodedNonce);

      let returnedUrl = null;
      if (redirectUrl.includes('?gameId=')) {
        returnedUrl = `${redirectUrl}&token=${idToken}`;
      } else {
        returnedUrl = `${redirectUrl}?token=${idToken}`;
      }
      debug('Redirecting Google auth token back to front-end');
      res.redirect(returnedUrl);
    });
  }

  serveStaticFiles() {
    if (process.env.NODE_ENV !== 'development') {
      // eslint-disable-next-line no-underscore-dangle
      const __filename = fileURLToPath(import.meta.url);
      // eslint-disable-next-line no-underscore-dangle
      const __dirname = path.dirname(__filename);
      const root = path.join(__dirname, '../client/build');
      this.server.use('/', express.static(root));
      this.server.get('*', (req, res) => {
        res.sendFile(path.join(root, 'index.html'));
      });
      debug('Serving static files for front-end.');
    }
  }

  static #checkCSRFToken(req, res) {
    const csrfCookie = req.cookies.g_csrf_token;
    if (!csrfCookie) {
      res.status(400).send('No CSRF token in Cookie.');
    }
    const csrfBody = req.body.g_csrf_token;
    if (!csrfBody) {
      res.status(400).send('No CSRF token in post body.');
    }
    if (csrfCookie !== csrfBody) {
      res.status(400).send('Failed to verify double submit cookie.');
    }
  }

  async #verifyJWT(idToken) {
    const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://accounts.google.com',
      audience: this.firebaseAppConfig.googleClientId,
    });
    return payload;
  }
}

export default HttpServer;
