export HEROKU_APP=y-buyma-api-pj-test

echo $HEROKU_TOKEN | docker login --username=_ --password-stdin registry.heroku.com
docker build -t registry.heroku.com/$HEROKU_APP/web --build-arg BUILD_ENV='heroku' .
docker push registry.heroku.com/$HEROKU_APP/web

docker run --rm -e HEROKU_API_KEY=$HEROKU_TOKEN wingrunr21/alpine-heroku-cli container:release web --app $HEROKU_APP
