docker build --pull --rm -f "Dockerfile" -t ybuymascrapingapi:latest "."
docker run --rm -it -e SEND_GRID_API_KEY=$SEND_GRID_API_KEY -p 5050:5050/tcp ybuymascrapingapi:latest
