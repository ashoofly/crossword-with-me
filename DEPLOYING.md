# Deployments

## Local
```
cd server
npm run dev
cd ../client
npm run dev
```
Go to `localhost:3000` to see UI

## Heroku Local
```
cd client
npm run build-heroku-local
cd ..
npm run heroku-local
```
Go to `localhost:5000` to see UI

## Heroku Staging
```
git push staging master
```
Go to https://evening-inlet-23063.herokuapp.com/ to see UI

## Heroku Production
```
git push production master
```
Go to https://floating-plains-76141.herokuapp.com/ to see UI

Also available at crosswordwith.me.