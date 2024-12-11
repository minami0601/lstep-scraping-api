# 一旦仮
export PROJECT_ID=buyma-tool-341513
export QUEUE_NAME=buyma-queue
export LOCATION=asia-northeast1

gcloud tasks queues create $QUEUE_NAME \
--log-sampling-ratio=1.0 \
--max-concurrent-dispatches 1000 \
--max-dispatches-per-second 500 \
--max-attempts=5 \
--max-backoff=1800s \
--min-backoff=60s \
--max-doublings=5 \
--location=$LOCATION \
--project=$PROJECT_ID

