# Deployments

## Local
```
cd server
npm run dev
cd ../client
npm run dev
```
Go to `localhost:3000` to see UI

## Run Linting & Tests
```
npm test
```

## Heroku Local

```
cd client
npm run build-heroku-local
cd ..
npm run heroku-local
```
Go to `localhost:5000` to see UI

## Heroku Staging

**Note**: This is the first stage at which you can test mobile devices due to the security restrictions of using Google as the auth server (authorized JavaScript origins cannot just be unsecure IP addresses unless they are `localhost`, which does not work for mobile connections).

```
git push staging main
```

To push feature branch to staging:
```
git push staging feature-branch:main
```

Go to https://evening-inlet-23063.herokuapp.com/ to see UI

## Heroku Production
```
git push production main
```
Go to https://floating-plains-76141.herokuapp.com/ to see UI

Also available at crosswordwith.me.

### View Server Logs
```
heroku logs
```
https://devcenter.heroku.com/articles/logging
